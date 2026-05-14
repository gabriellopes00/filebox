import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { parseHttpEvent } from '@/utils/parse-http-event.js'
import { parseHttpResponse } from '@/utils/parse-http-response.js'
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'

interface UpdateFileRequestBody {
  id: string
  name: string
}

interface UpdateFilePathParams {
  fileId: string
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const req = parseHttpEvent<UpdateFileRequestBody, UpdateFilePathParams>(event)
  const { fileId } = req.pathParams

  const command = new GetCommand({ TableName: 'FileboxFiles', Key: { id: fileId } })
  const { Item } = await dynamoDbClient.send(command)

  if (!Item) {
    return parseHttpResponse(404, { message: 'File not found' })
  }

  const updateCommand = new UpdateCommand({
    TableName: 'FileboxFiles',
    Key: { id: fileId },
    UpdateExpression: 'SET #name = :name',
    ExpressionAttributeNames: { '#name': 'name' },
    ExpressionAttributeValues: { ':name': req.body.name }
  })
  await dynamoDbClient.send(updateCommand)

  return parseHttpResponse(204)
}
