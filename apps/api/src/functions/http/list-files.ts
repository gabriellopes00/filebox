import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { parseHttpResponse } from '@/utils/parse-http-response.js'
import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'

export async function handler(_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const command = new ScanCommand({ TableName: 'FileboxFiles' })
  const { Items } = await dynamoDbClient.send(command)

  return parseHttpResponse(200, { files: Items })
}
