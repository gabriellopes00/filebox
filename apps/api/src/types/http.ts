export type HttpRequest<B = any, P = any, Q = any> = {
  body: B
  queryParams: Q
  pathParams: P
}

export type HttpResponse = {
  statusCode: number
  body?: Record<string, any>
}

export type ProtectedHttpRequest = HttpRequest & {
  userId: string
}
