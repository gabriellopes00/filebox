import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import type { HttpRequest } from '../types/http.js'

export function parseHttpEvent<B = any, P = any, Q = any>(
  event: APIGatewayProxyEventV2
): HttpRequest<B, P, Q> {
  return {
    body: JSON.parse(event.body ?? '{}') as B,
    pathParams: (event.pathParameters ?? {}) as P,
    queryParams: (event.queryStringParameters ?? {}) as Q
  }
}
