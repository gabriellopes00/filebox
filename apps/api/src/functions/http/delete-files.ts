import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { parseHttpEvent } from '@/utils/parse-http-event.js'
import { parseHttpResponse } from '@/utils/parse-http-response.js'
import { DeleteCommand } from '@aws-sdk/lib-dynamodb/dist-types/commands/index.js'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'

interface DeleteFilePathParams {
  fileId: string
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const req = parseHttpEvent<any, DeleteFilePathParams>(event)
  const { fileId } = req.pathParams

  const command = new DeleteCommand({ TableName: 'FileboxFiles', Key: { id: fileId } })
  await dynamoDbClient.send(command)

  return parseHttpResponse(204)
}
