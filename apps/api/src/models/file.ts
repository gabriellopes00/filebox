import type { FileData } from '@filebox/shared/data/file-data.js'

export class File {
  public id: string
  public name: string
  public size: number
  public contentType: string
  public checksum?: string
  public uploadedAt?: Date

  constructor(data: FileData) {
    this.id = data.id
    this.name = data.name
    this.size = data.size
    this.contentType = data.contentType
    this.checksum = data.checksum
    this.uploadedAt = data.uploadedAt
  }
}
