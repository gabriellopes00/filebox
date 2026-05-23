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
        UpdateExpression: 'SET #availableAt = :availableAt, #status = :status REMOVE #ttl',
        ExpressionAttributeNames: {
          '#availableAt': 'availableAt',
          '#status': 'status',
          '#ttl': 'ttl'
        },
        ExpressionAttributeValues: {
          ':availableAt': record.eventTime,
          ':status': 'available'
        }
      })
  )

  await Promise.all(commands.map((command) => dynamoDbClient.send(command)))
}
