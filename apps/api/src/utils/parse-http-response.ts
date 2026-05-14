import type { APIGatewayProxyResultV2 } from 'aws-lambda'

export function parseHttpResponse<T = any>(statusCode: number, body?: T): APIGatewayProxyResultV2 {
  return { statusCode, body: body ? JSON.stringify(body) : undefined }
}
