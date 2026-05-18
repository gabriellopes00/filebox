import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { getFileName } from '@filebox/shared/utils/file.js'
import type { S3Event } from 'aws-lambda'

export async function handler(event: S3Event): Promise<void> {
  const commands = event.Records.map(
    (record) =>
      new DeleteCommand({
        TableName: 'FileboxFiles',
        Key: { id: getFileName(record.s3.object.key) },
        ConditionExpression: 'attribute_exists(id) AND #status = :deleted',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':deleted': 'deleted' }
      })
  )

  await Promise.all(commands.map((command) => dynamoDbClient.send(command)))
}
