import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { s3Client } from '@/lib/s3-client.js'
import { parseHttpEvent } from '@/utils/parse-http-event.js'
import { parseHttpResponse } from '@/utils/parse-http-response.js'
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { DeleteObjectCommand, ListObjectVersionsCommand } from '@aws-sdk/client-s3'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'

type RestoreFilesParams = {
  fileIds: string[]
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { body } = parseHttpEvent<RestoreFilesParams>(event)
  const { fileIds } = body

  await Promise.all(
    fileIds.map(async (id) => {
      // find latest delete marker
      const versions = await s3Client.send(
        new ListObjectVersionsCommand({
          Bucket: process.env.BUCKET_NAME,
          Prefix: id
        })
      )

      const deleteMarker = versions.DeleteMarkers?.find(
        (marker) => marker.Key === id && marker.IsLatest
      )

      if (!deleteMarker?.VersionId) {
        throw new Error(`Delete marker not found for ${id}`)
      }

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: id,
          VersionId: deleteMarker.VersionId
        })
      )
    })
  )

  await dynamoDbClient.send(
    new TransactWriteCommand({
      TransactItems: fileIds.map((id) => ({
        Update: {
          TableName: 'FileboxFiles',
          Key: { id },
          ConditionExpression: '#status = :deleted',
          UpdateExpression: 'SET #status = :uploaded',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':deleted': 'deleted', ':uploaded': 'uploaded' }
        }
      }))
    })
  )

  return parseHttpResponse(204)
}
