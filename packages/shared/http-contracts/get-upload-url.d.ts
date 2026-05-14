export interface GetUploadUrlsParams {
  files: {
    clientRef: string
    filename: string
    size: number
    contentType: string
    checksum?: string
  }[]
}

export type GetUploadUrlsResult = {
  clientRef: string
  uploadUrl: string
}[]
