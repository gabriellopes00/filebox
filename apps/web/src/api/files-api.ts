import { http } from '@/lib/axios'
import type {
  GetUploadUrlsParams,
  GetUploadUrlsResult
} from '@filebox/shared/http-contracts/get-upload-url.js'
import type {
  GetDownloadUrlsParams,
  GetDownloadUrlsResult
} from '@filebox/shared/http-contracts/get-download-urls.js'
import type { FileData } from '@filebox/shared/data/file-data'
import type { DeleteFilesParams } from '@filebox/shared/http-contracts/delete-files.js'
import axios from 'axios'
import { hexToBase64 } from '@/utils/hex-to-base64'
import type { CopyFilesParams } from '@filebox/shared/http-contracts/copy-files'

export type FileUploadStatus =
  | 'waiting'
  | 'queued'
  | 'hashing'
  | 'ready'
  | 'uploading'
  | 'success'
  | 'error'

export interface RenameFileParams {
  fileId: string
  name: string
}

export class FileApi {
  private constructor() {}

  public static async getUploadUrls(params: GetUploadUrlsParams): Promise<Map<string, string>> {
    try {
      const { data } = await http.post<GetUploadUrlsResult>('/upload', params)
      return new Map(data.map((item) => [item.clientRef, item.uploadUrl]))
    } catch (error) {
      console.error('Error fetching upload URLs:', error)
      throw error
    }
  }

  public static async getDownloadUrls(
    params: GetDownloadUrlsParams
  ): Promise<GetDownloadUrlsResult> {
    try {
      const { data } = await http.post<GetDownloadUrlsResult>('/download', params)
      return data
    } catch (error) {
      console.error('Error fetching upload URLs:', error)
      throw error
    }
  }

  public static async getFiles(): Promise<FileData[]> {
    try {
      const { data } = await http.get<{ files: FileData[] }>('/files')
      return data.files
    } catch (error) {
      console.error('Error fetching files:', error)
      throw error
    }
  }

  public static async upload(
    uploadUrl: string,
    file: File,
    checksum: string,
    onProgress?: (progress: number) => void,
    onStatusChange?: (status: FileUploadStatus) => void
  ): Promise<void> {
    try {
      onStatusChange?.('uploading')
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type, 'x-amz-checksum-sha256': hexToBase64(checksum) },
        timeout: 0,
        onUploadProgress: (event) => {
          if (!event.total) return
          if (event.loaded === event.total) onStatusChange?.('success')

          onProgress?.((event.loaded / event.total) * 100)
        }
      })
    } catch (error) {
      onStatusChange?.('error')
      console.error('Error fetching files:', error)
      throw error
    }
  }

  public static async delete(params: DeleteFilesParams): Promise<void> {
    try {
      await http.post('/files/delete', params)
    } catch (error) {
      console.error('Error deleting files:', error)
      throw error
    }
  }

  public static async rename({ fileId, ...params }: RenameFileParams): Promise<void> {
    try {
      await http.post(`/files/${fileId}/rename`, params)
    } catch (error) {
      console.error('Error renaming file:', error)
      throw error
    }
  }

  public static async copy(params: CopyFilesParams): Promise<void> {
    try {
      await http.post('/files/copy', params)
    } catch (error) {
      console.error('Error copying file:', error)
      throw error
    }
  }
}
