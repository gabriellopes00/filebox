import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { s3Client } from '@/lib/s3-client.js'
import { parseHttpEvent } from '@/utils/parse-http-event.js'
import { parseHttpResponse } from '@/utils/parse-http-response.js'
import { BatchGetCommand } from '@aws-sdk/lib-dynamodb'
import { DeleteObjectsCommand, ListObjectVersionsCommand } from '@aws-sdk/client-s3'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { FileIdsParams } from '@filebox/shared/http-contracts/file-id-params.js'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { body } = parseHttpEvent<FileIdsParams>(event)
  const { fileIds } = body

  const { Responses } = await dynamoDbClient.send(
    new BatchGetCommand({ RequestItems: { FileboxFiles: { Keys: fileIds.map((id) => ({ id })) } } })
  )

  const files = Responses?.FileboxFiles ?? []

  await Promise.all(
    files.map(async (file) => {
      const versions = await s3Client.send(
        new ListObjectVersionsCommand({ Bucket: process.env.BUCKET_NAME, Prefix: file.key })
      )

      const objects = [...(versions.Versions ?? []), ...(versions.DeleteMarkers ?? [])]
        .filter((object) => object.Key === file.key && object.VersionId)
        .map((object) => ({ Key: object.Key!, VersionId: object.VersionId! }))

      if (objects.length === 0) {
        return
      }

      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: process.env.BUCKET_NAME,
          Delete: { Objects: objects, Quiet: false }
        })
      )
    })
  )

  return parseHttpResponse(204)
}
