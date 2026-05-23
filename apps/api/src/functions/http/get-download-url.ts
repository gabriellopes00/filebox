import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { s3Client } from '@/lib/s3-client.js'
import { parseHttpEvent } from '@/utils/parse-http-event.js'
import { parseHttpResponse } from '@/utils/parse-http-response.js'
import { BatchGetCommand } from '@aws-sdk/lib-dynamodb'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { GetDownloadUrlsResult } from '@filebox/shared/http-contracts/get-download-urls.js'
import type { FileIdsParams } from '@filebox/shared/http-contracts/file-id-params.js'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { body } = parseHttpEvent<FileIdsParams>(event)
  const { fileIds } = body

  const { Responses } = await dynamoDbClient.send(
    new BatchGetCommand({ RequestItems: { FileboxFiles: { Keys: fileIds.map((id) => ({ id })) } } })
  )

  const files = Responses?.FileboxFiles ?? []

  const downloads = await Promise.all(
    files.map(async (file: any) => {
      const url = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: file.key,
          ResponseContentDisposition: `attachment; filename="${file.name}"`
        }),
        { expiresIn: 60 * 5 }
      )

      return { fileId: file.id, filename: file.name, url }
    })
  )

  return parseHttpResponse<GetDownloadUrlsResult>(200, { downloads })
}
