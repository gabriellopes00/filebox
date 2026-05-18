import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { parseHttpEvent } from '@/utils/parse-http-event.js'
import { parseHttpResponse } from '@/utils/parse-http-response.js'
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'

interface RenameFileRequestBody {
  name: string
}

interface RenameFilePathParams {
  id: string
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const req = parseHttpEvent<RenameFileRequestBody, RenameFilePathParams>(event)
  const { id } = req.pathParams

  const command = new GetCommand({ TableName: 'FileboxFiles', Key: { id } })
  const { Item } = await dynamoDbClient.send(command)

  if (!Item) {
    return parseHttpResponse(404, { message: 'File not found' })
  }

  const updateCommand = new UpdateCommand({
    TableName: 'FileboxFiles',
    Key: { id },
    UpdateExpression: 'SET #name = :name',
    ExpressionAttributeNames: { '#name': 'name' },
    ExpressionAttributeValues: { ':name': req.body.name }
  })
  await dynamoDbClient.send(updateCommand)

  return parseHttpResponse(204)
}
