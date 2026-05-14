import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { S3Event } from 'aws-lambda'
import { getFileName } from '@filebox/shared/utils/file.js'

export async function handler(event: S3Event): Promise<void> {
  const commands = event.Records.map(
    (record) =>
      new UpdateCommand({
        TableName: 'FileboxFiles',
        Key: { id: getFileName(record.s3.object.key) },
        UpdateExpression: 'SET #uploadedAt = :uploadedAt, #size = :size REMOVE #ttl',
        ExpressionAttributeNames: {
          '#uploadedAt': 'uploadedAt',
          '#size': 'size',
          '#ttl': 'ttl'
        },
        ExpressionAttributeValues: {
          ':uploadedAt': record.eventTime,
          ':size': record.s3.object.size
        }
      })
  )

  await Promise.all(commands.map((command) => dynamoDbClient.send(command)))
}
