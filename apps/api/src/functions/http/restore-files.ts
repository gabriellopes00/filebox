import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { s3Client } from '@/lib/s3-client.js'
import { parseHttpEvent } from '@/utils/parse-http-event.js'
import { parseHttpResponse } from '@/utils/parse-http-response.js'
import { BatchGetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { DeleteObjectCommand, ListObjectVersionsCommand } from '@aws-sdk/client-s3'
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
      // find latest delete marker
      const versions = await s3Client.send(
        new ListObjectVersionsCommand({ Bucket: process.env.BUCKET_NAME, Prefix: file.key })
      )

      const deleteMarker = versions.DeleteMarkers?.find(
        (marker) => marker.Key === file.key && marker.IsLatest
      )

      if (!deleteMarker?.VersionId) {
        return
      }

      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: file.key,
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
          UpdateExpression: 'SET #status = :available',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':deleted': 'deleted', ':available': 'available' }
        }
      }))
    })
  )

  return parseHttpResponse(204)
}
