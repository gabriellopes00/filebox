import { parseHttpResponse } from '@/utils/parse-http-response.js'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { parseHttpEvent } from '@/utils/parse-http-event.js'
import { AbortMultipartUploadCommand } from '@aws-sdk/client-s3'
import { s3Client } from '@/lib/s3-client.js'
import { DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import type { File } from '@/models/file.js'
import { dynamoDbClient } from '@/lib/dynamo-db-client.js'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { pathParams } = parseHttpEvent<never, { fileId: string }>(event)

  const getCmd = new GetCommand({ TableName: 'FileboxFiles', Key: { id: pathParams.fileId } })
  const file = (await dynamoDbClient.send(getCmd))?.Item as File | undefined

  if (!file) return parseHttpResponse(400, { message: 'File not found' })
  else if (!file.uploadId) return parseHttpResponse(400, { message: 'File is not an MPU' })

  const command = new AbortMultipartUploadCommand({
    Bucket: process.env.BUCKET_NAME,
    UploadId: file.uploadId,
    Key: file.key
  })

  await s3Client.send(command)
  await dynamoDbClient.send(new DeleteCommand({ TableName: 'FileboxFiles', Key: { id: file.id } }))

  return parseHttpResponse(204)
}
