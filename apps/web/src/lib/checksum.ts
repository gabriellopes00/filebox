import { createSHA256 } from 'hash-wasm'

const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB

interface ComputeFileChecksumOptions {
  signal?: AbortSignal
  onProgress?: (progress: number) => void
}

export async function computeFileChecksum(
  file: File,
  options?: ComputeFileChecksumOptions
): Promise<string> {
  const hasher = await createSHA256()
  hasher.init()

  let processedBytes = 0

  for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
    if (options?.signal?.aborted) throw new Error('Hash aborted')

    const chunk = file.slice(offset, offset + CHUNK_SIZE)
    const buffer = new Uint8Array(await chunk.arrayBuffer())
    hasher.update(buffer)
    processedBytes += buffer.byteLength
    options?.onProgress?.(Math.min(100, Math.round((processedBytes / file.size) * 100)))
  }

  return hasher.digest('hex')
}
