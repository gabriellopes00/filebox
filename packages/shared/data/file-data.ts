export const MULTIPART_THRESHOLD = 50 * 1024 * 1024 // 50MB
export const PART_SIZE = 5 * 1024 * 1024 // 5MB

export type FileStatus = 'pending' | 'available' | 'deleting' | 'deleted' | 'delete_failed'

export type FileSource = 'upload' | 'url' | 'copy'

export interface FileData {
  id: string
  name: string
  size: number
  contentType: string
  checksum: string
  key: string
  source: FileSource
  availableAt?: Date
  status: FileStatus

  // this data should be moved to another entity
  uploadId?: string
  // multipartPartSize?: number
}
