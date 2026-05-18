export interface GetDownloadUrlsParams {
  fileIds: string[]
}

export interface GetDownloadUrlsResult {
  downloads: { fileId: string; filename: string; url: string }[]
}
