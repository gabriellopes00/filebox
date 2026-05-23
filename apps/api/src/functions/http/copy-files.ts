import { randomUUID } from 'node:crypto'
import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { s3Client } from '@/lib/s3-client.js'
import { parseHttpEvent } from '@/utils/parse-http-event.js'
import { parseHttpResponse } from '@/utils/parse-http-response.js'
import { File } from '@/models/file.js'
import { BatchGetCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { CopyObjectCommand } from '@aws-sdk/client-s3'
import type { FileIdsParams } from '@filebox/shared/http-contracts/file-id-params.js'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { getFileExtension, generateFileKey, getFileName } from '@filebox/shared/utils/file.js'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { body } = parseHttpEvent<FileIdsParams>(event)
  const { fileIds } = body

  const { Responses } = await dynamoDbClient.send(
    new BatchGetCommand({ RequestItems: { FileboxFiles: { Keys: fileIds.map((id) => ({ id })) } } })
  )

  const existentFiles = Responses?.FileboxFiles ?? []
  const copyFiles = existentFiles.map((file) => {
    const newId = randomUUID()

    const extension = getFileExtension(file.name)
    const baseName = getFileName(file.name)
    const copiedName = `${baseName}_copy${extension ? `.${extension}` : ''}`

    const newFileKey = generateFileKey(newId, extension)

    return {
      file: new File({
        id: newId,
        name: copiedName,
        size: file.size,
        checksum: file.checksum,
        contentType: file.contentType,
        key: newFileKey,
        status: 'pending',
        source: 'copy'
      }),
      sourceKey: file.key
    }
  })

  const ttl = Math.floor(Date.now() / 1000) + 60 * 5
  const batchWriteItems = copyFiles.map(({ file }) => ({ PutRequest: { Item: { ...file, ttl } } }))
  const insertCommand = new BatchWriteCommand({ RequestItems: { FileboxFiles: batchWriteItems } })
  await dynamoDbClient.send(insertCommand)

  await Promise.all(
    copyFiles.map(async ({ sourceKey, file }) => {
      await s3Client.send(
        new CopyObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          CopySource: `${process.env.BUCKET_NAME}/${sourceKey}`,
          Key: file.key
        })
      )
    })
  )

  return parseHttpResponse(201, { files: copyFiles })
}
