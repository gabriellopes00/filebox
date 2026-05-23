import { http } from '@/lib/axios'
import type {
  GetUploadUrlsParams,
  GetUploadUrlsResult,
  GetUploadUrlsResultMultipart
} from '@filebox/shared/http-contracts/get-upload-url.js'
import type { GetDownloadUrlsResult } from '@filebox/shared/http-contracts/get-download-urls.js'
import type { FileData, FileStatus } from '@filebox/shared/data/file-data'
import axios from 'axios'
import { hexToBase64 } from '@/utils/hex-to-base64'
import type { FileIdsParams } from '@filebox/shared/http-contracts/file-id-params'
import type { CompleteMPUBody } from '@filebox/shared/http-contracts/complete-mpu'
import pLimit from 'p-limit'

const uploadLimit = pLimit(3)

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

async function uploadChunk(
  chunk: Blob,
  uploadUrl: string,
  maxRetries: number = 3
): Promise<string> {
  try {
    const { headers } = await axios.put(uploadUrl, chunk)
    return headers['etag']?.replace(/"/g, '') // remove quotes from eTag
  } catch (error) {
    if (maxRetries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000)) // wait for 2 seconds before retrying
      return uploadChunk(chunk, uploadUrl, maxRetries - 1) // retry the upload
    }

    throw error // rethrow the error if max retries reached
  }
}

export class FileApi {
  private constructor() {}

  public static async getUploadUrls(
    params: GetUploadUrlsParams
  ): Promise<GetUploadUrlsResult['uploads']> {
    try {
      const { data } = await http.post<GetUploadUrlsResult>('/upload', params)
      return data.uploads
    } catch (error) {
      console.error('Error fetching upload URLs:', error)
      throw error
    }
  }

  public static async getDownloadUrls(params: FileIdsParams): Promise<GetDownloadUrlsResult> {
    try {
      const { data } = await http.post<GetDownloadUrlsResult>('/download', params)
      return data
    } catch (error) {
      console.error('Error fetching upload URLs:', error)
      throw error
    }
  }

  public static async getFiles(statuses?: FileStatus[]): Promise<FileData[]> {
    try {
      const { data } = await http.get<{ files: FileData[] }>('/files', {
        params: statuses?.length ? { status: statuses.join(',') } : undefined
      })
      return data.files
    } catch (error) {
      console.error('Error fetching files:', error)
      throw error
    }
  }

  public static async uploadSingle(
    uploadUrl: string,
    file: File,
    checksum?: string,
    onProgress?: (progress: number) => void,
    onStatusChange?: (status: FileUploadStatus) => void
  ): Promise<void> {
    try {
      onStatusChange?.('uploading')
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
          'x-amz-checksum-sha256': checksum ? hexToBase64(checksum) : undefined
        },
        timeout: 0,
        onUploadProgress: (event) => {
          if (!event.total) return
          onProgress?.((event.loaded / event.total) * 100)
        }
      })
      onStatusChange?.('success')
    } catch (error) {
      onStatusChange?.('error')
      console.error('Error fetching files:', error)
      throw error
    }
  }

  public static async uploadMultipart(
    { parts, partSize, fileId }: GetUploadUrlsResultMultipart,
    file: File,
    onProgress?: (progress: number) => void,
    onStatusChange?: (status: FileUploadStatus) => void
  ): Promise<void> {
    try {
      onStatusChange?.('uploading')
      let completedPartsCount = 0

      const uploadedParts = await Promise.all(
        parts.map(({ partNumber, uploadUrl }, index) =>
          uploadLimit(async () => {
            const start = index * partSize
            const end = Math.min(start + partSize, file.size)

            const blobPart = file.slice(start, end)
            const eTag = await uploadChunk(blobPart, uploadUrl)

            completedPartsCount++
            onProgress?.((completedPartsCount / parts.length) * 100) // The progress is based on the number of completed parts, not based on the uploaded bytes like a single upload.

            return { partNumber, eTag }
          })
        )
      )

      const completeParams: CompleteMPUBody = { parts: uploadedParts }
      await http.post(`/upload/mpu/${fileId}/complete`, completeParams)
      onStatusChange?.('success')
    } catch (error) {
      onStatusChange?.('error')
      await http.post(`/upload/mpu/${fileId}/abort`)
      throw error
    }
  }

  public static async delete(params: FileIdsParams): Promise<void> {
    try {
      await http.post('/files/delete', params)
    } catch (error) {
      console.error('Error deleting files:', error)
      throw error
    }
  }

  public static async confirmDeletion(params: FileIdsParams): Promise<void> {
    try {
      await http.post('/files/delete/confirm', params)
    } catch (error) {
      console.error('Error deleting files:', error)
      throw error
    }
  }

  public static async restore(params: FileIdsParams): Promise<void> {
    try {
      await http.post('/files/restore', params)
    } catch (error) {
      console.error('Error restoring files:', error)
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

  public static async copy(params: FileIdsParams): Promise<void> {
    try {
      await http.post('/files/copy', params)
    } catch (error) {
      console.error('Error copying file:', error)
      throw error
    }
  }
}
