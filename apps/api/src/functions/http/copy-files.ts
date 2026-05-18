import { randomUUID } from 'node:crypto'
import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { s3Client } from '@/lib/s3-client.js'
import { parseHttpEvent } from '@/utils/parse-http-event.js'
import { parseHttpResponse } from '@/utils/parse-http-response.js'
import { File } from '@/models/file.js'
import { BatchGetCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { CopyObjectCommand } from '@aws-sdk/client-s3'
import type { CopyFilesParams } from '@filebox/shared/http-contracts/copy-files.js'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getFileExtension, getFileKey, getFileName } from '@filebox/shared/utils/file.js'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { body } = parseHttpEvent<CopyFilesParams>(event)
  const { fileIds } = body

  const { Responses } = await dynamoDbClient.send(
    new BatchGetCommand({ RequestItems: { FileboxFiles: { Keys: fileIds.map((id) => ({ id })) } } })
  )

  const files = Responses?.FileboxFiles ?? []

  const copiedFiles = await Promise.all(
    files.map(async (file: any) => {
      const newId = randomUUID()

      const extension = getFileExtension(file.name)
      const baseName = getFileName(file.name)
      const copiedName = `${baseName}_copy${extension ? `.${extension}` : ''}`

      const existentFileKey = getFileKey(file.id, extension)
      const newFileKey = getFileKey(newId, extension)

      await s3Client.send(
        new CopyObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          CopySource: `${process.env.BUCKET_NAME}/${existentFileKey}`,
          Key: newFileKey
        })
      )

      return new File({
        id: newId,
        name: copiedName,
        size: file.size,
        checksum: file.checksum,
        contentType: file.contentType,
        status: 'uploaded'
      })
    })
  )

  await dynamoDbClient.send(
    new BatchWriteCommand({
      RequestItems: {
        FileboxFiles: copiedFiles.map((file) => ({
          PutRequest: { Item: file }
        }))
      }
    })
  )

  return parseHttpResponse(201, { files: copiedFiles })
}
