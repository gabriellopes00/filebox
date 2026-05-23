export interface GetUploadUrlsParams {
  files: {
    clientRef: string
    filename: string
    size: number
    contentType: string
    checksum: string
  }[]
}

export interface GetUploadUrlsResultSingle {
  fileKey: string
  clientRef: string
  uploadUrl: string
}

export interface GetUploadUrlsResultMultipart {
  clientRef: string
  partSize: number
  fileId: string
  parts: { partNumber: number; uploadUrl: string }[]
}

export interface GetUploadUrlsResult {
  uploads: {
    single: GetUploadUrlsResultSingle[]
    multipart: GetUploadUrlsResultMultipart[]
  }
}
