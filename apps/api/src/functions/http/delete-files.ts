import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { s3Client } from '@/lib/s3-client.js'
import { parseHttpEvent } from '@/utils/parse-http-event.js'
import { parseHttpResponse } from '@/utils/parse-http-response.js'
import { BatchGetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { DeleteObjectsCommand } from '@aws-sdk/client-s3'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { FileIdsParams } from '@filebox/shared/http-contracts/file-id-params.js'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { body } = parseHttpEvent<FileIdsParams>(event)
  const { fileIds } = body

  const { Responses } = await dynamoDbClient.send(
    new BatchGetCommand({ RequestItems: { FileboxFiles: { Keys: fileIds.map((id) => ({ id })) } } })
  )

  const files = Responses?.FileboxFiles ?? []

  await dynamoDbClient.send(
    new TransactWriteCommand({
      TransactItems: fileIds.map((id) => ({
        Update: {
          TableName: 'FileboxFiles',
          Key: { id },
          UpdateExpression: 'SET #status = :status',
          ConditionExpression: 'attribute_exists(id) AND #status = :available',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': 'deleting', ':available': 'available' }
        }
      }))
    })
  )

  // TODO: should completelly remove there is nothing related on s3
  // should add delete marker on s3 if status = available
  // should abort the s3 multipartupload & remove the file if multipart upload in progress

  const removablefiles = files.filter((file) => file.status === 'available')
  const result = await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: process.env.BUCKET_NAME,
      Delete: { Objects: removablefiles.map((file) => ({ Key: file.key })), Quiet: false }
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
