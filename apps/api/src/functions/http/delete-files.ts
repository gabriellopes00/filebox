import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { s3Client } from '@/lib/s3-client.js'
import { parseHttpEvent } from '@/utils/parse-http-event.js'
import { parseHttpResponse } from '@/utils/parse-http-response.js'
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { DeleteObjectsCommand } from '@aws-sdk/client-s3'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { DeleteFilesParams } from '@filebox/shared/http-contracts/delete-files.js'
import { getFileName } from '@filebox/shared/utils/file.js'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { body } = parseHttpEvent<DeleteFilesParams>(event)
  const { fileKeys } = body

  await dynamoDbClient.send(
    new TransactWriteCommand({
      TransactItems: fileKeys.map((key) => ({
        Update: {
          TableName: 'FileboxFiles',
          Key: { id: getFileName(key) },
          UpdateExpression: 'SET #status = :status',
          ConditionExpression: 'attribute_exists(id) AND #status = :uploaded',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': 'deleting', ':uploaded': 'uploaded' }
        }
      }))
    })
  )

  const result = await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: process.env.BUCKET_NAME,
      Delete: { Objects: fileKeys.map((Key) => ({ Key })), Quiet: false }
    })
  )

  if (result.Errors && result.Errors.length > 0) {
    const failedIds = result.Errors.map((error) => error.Key!)

    await dynamoDbClient.send(
      new TransactWriteCommand({
        TransactItems: failedIds.map((id) => ({
          Update: {
            TableName: 'FileboxFiles',
            Key: { id },
            UpdateExpression: 'SET #status = :status',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':status': 'delete_failed' }
          }
        }))
      })
    )
  }

  return parseHttpResponse(204)
}
