export type FileStatus = 'pending' | 'uploaded' | 'deleting' | 'deleted' | 'delete_failed'

export interface FileData {
  id: string
  name: string
  size: number
  contentType: string
  checksum: string
  uploadedAt?: Date
  status: FileStatus
}
