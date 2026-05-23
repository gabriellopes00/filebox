import type { FileData, FileSource, FileStatus } from '@filebox/shared/data/file-data.js'

export class File implements FileData {
  public id: string
  public name: string
  public size: number
  public key: string
  public status: FileStatus
  public source: FileSource
  public contentType: string
  public checksum: string
  public availableAt?: Date

  public uploadId?: string // will be moved to a separate model in the future when MPU files are tracked separately

  constructor(data: FileData) {
    this.id = data.id
    this.name = data.name
    this.size = data.size
    this.key = data.key
    this.source = data.source
    this.status = data.status
    this.contentType = data.contentType
    this.checksum = data.checksum
    this.availableAt = data.availableAt
    this.uploadId = data.uploadId
  }
}
