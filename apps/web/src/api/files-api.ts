import { http } from '@/lib/axios'
import type {
    GetUploadUrlsParams,
    GetUploadUrlsResult
} from '@filebox/shared/http-contracts/get-upload-url.js'
import type { FileData } from '@filebox/shared/data/file-data'
import axios from 'axios'

export type FileUploadStatus = 'ready' | 'uploading' | 'success' | 'error'

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
    onProgress?: (progress: number) => void,
    onStatusChange?: (status: FileUploadStatus) => void
  ): Promise<void> {
    console.log({ uploadUrl, file })

    try {
      onStatusChange?.('uploading')
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
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
}
