import { parseHttpResponse } from '@/utils/parse-http-response.js'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { randomUUID } from 'node:crypto'
import { parseHttpEvent } from '@/utils/parse-http-event.js'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { body } = parseHttpEvent(event)

  const s3Client = new S3Client()
  const command = new PutObjectCommand({
    Bucket: 'gbr-upload-lambda',
    Key: randomUUID() + '-' + body.filename
  })

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 120 })
  return parseHttpResponse(200, { url: signedUrl })
}
