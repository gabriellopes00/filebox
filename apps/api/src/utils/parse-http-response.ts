import type { HttpBody } from '@/types/http.js'
import type { APIGatewayProxyResultV2 } from 'aws-lambda'

export function parseHttpResponse(statusCode: number, body?: HttpBody): APIGatewayProxyResultV2 {
  return { statusCode, body: body ? JSON.stringify(body) : undefined }
}
