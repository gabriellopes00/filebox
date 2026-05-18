import { parseHttpResponse } from '@/utils/parse-http-response.js'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { randomUUID } from 'node:crypto'
import { parseHttpEvent } from '@/utils/parse-http-event.js'
import { File } from '@/models/file.js'
import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type {
  GetUploadUrlsParams,
  GetUploadUrlsResult
} from '@filebox/shared/http-contracts/get-upload-url.js'
import { getFileKey, getFileExtension } from '@filebox/shared/utils/file.js'
import { s3Client } from '@/lib/s3-client.js'
import type { FileStatus } from '@filebox/shared/data/file-data.js'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { body } = parseHttpEvent<GetUploadUrlsParams>(event)

  const files: { data: File; uploadUrl: string; clientRef: string }[] = []
  for (const { clientRef, filename, contentType, size, checksum } of body.files) {
    const fileId = randomUUID()
    const status: FileStatus = 'pending'
    const file = new File({ id: fileId, name: filename, size, contentType, checksum, status })

    const fileExtension = getFileExtension(file.name)
    const fileKey = getFileKey(fileId, fileExtension)

    const base64Checksum = Buffer.from(checksum, 'hex').toString('base64')
    const uploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: fileKey,
        ContentType: contentType,
        ContentLength: size,
        ChecksumSHA256: base64Checksum
      }),
      {
        expiresIn: 60 * 5,
        unhoistableHeaders: new Set(['x-amz-checksum-sha256'])
      }
    )

    files.push({ data: file, uploadUrl, clientRef })
  }

  const ttl = Math.floor(Date.now() / 1000) + 60 * 5
  const batchWriteItems = files.map(({ data }) => ({ PutRequest: { Item: { ...data, ttl } } }))
  const insertCommand = new BatchWriteCommand({ RequestItems: { FileboxFiles: batchWriteItems } })
  await dynamoDbClient.send(insertCommand)

  const responseBody = files.map(({ uploadUrl, clientRef }) => ({ clientRef, uploadUrl }))
  return parseHttpResponse<GetUploadUrlsResult>(200, responseBody)
}
