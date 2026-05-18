import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { parseHttpResponse } from '@/utils/parse-http-response.js'
import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const statuses = event.queryStringParameters?.status?.split(',').filter(Boolean) || []

  const command = new ScanCommand({
    TableName: 'FileboxFiles',

    ...(statuses.length > 0 && {
      FilterExpression: `#status IN (${statuses.map((_, index) => `:status${index}`).join(', ')})`,
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: Object.fromEntries(
        statuses.map((status, index) => [`:status${index}`, status])
      )
    })
  })
  const { Items } = await dynamoDbClient.send(command)

  return parseHttpResponse(200, { files: Items })
}
