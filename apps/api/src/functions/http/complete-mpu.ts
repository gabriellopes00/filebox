import { parseHttpResponse } from '@/utils/parse-http-response.js'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { parseHttpEvent } from '@/utils/parse-http-event.js'
import { CompleteMultipartUploadCommand } from '@aws-sdk/client-s3'
import { s3Client } from '@/lib/s3-client.js'
import { GetCommand } from '@aws-sdk/lib-dynamodb'
import type { File } from '@/models/file.js'
import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import type { CompleteMPUBody } from '@filebox/shared/http-contracts/complete-mpu.js'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { body, pathParams } = parseHttpEvent<CompleteMPUBody, { fileId: string }>(event)

  const getCmd = new GetCommand({ TableName: 'FileboxFiles', Key: { id: pathParams.fileId } })
  const file = (await dynamoDbClient.send(getCmd))?.Item as File | undefined

  if (!file) return parseHttpResponse(400, { message: 'File not found' })
  else if (!file.uploadId) return parseHttpResponse(400, { message: 'File is not an MPU' })

  const base64Checksum = Buffer.from(file.checksum, 'hex').toString('base64')
  const command = new CompleteMultipartUploadCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: file.key,
    UploadId: file.uploadId,
    ChecksumSHA256: base64Checksum,
    MultipartUpload: {
      Parts: body.parts.map(({ partNumber, eTag }) => ({
        PartNumber: partNumber,
        ETag: eTag
      }))
    }
  })

  await s3Client.send(command)

  // TODO: remove file.uploadId and set availableAt

  return parseHttpResponse(204)
}
