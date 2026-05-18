import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { getFileName } from '@filebox/shared/utils/file.js'
import type { S3Event } from 'aws-lambda'

export async function handler(event: S3Event): Promise<void> {
  await dynamoDbClient.send(
    new TransactWriteCommand({
      TransactItems: event.Records.map((record) => ({
        Update: {
          TableName: 'FileboxFiles',
          Key: { id: getFileName(record.s3.object.key) },
          UpdateExpression: 'SET #status = :status',
          ConditionExpression: 'attribute_exists(id) AND #status = :deleting',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': 'deleted', ':deleting': 'deleting' }
        }
      }))
    })
  )
}
