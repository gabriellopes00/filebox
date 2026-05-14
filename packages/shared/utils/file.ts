export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

export function getFileKey(fileId: string, fileExtension?: string): string {
  return `${fileId}${fileExtension ? `.${fileExtension}` : ''}`
}

export function getFileName(key: string): string {
  return key.includes('.') ? key.split('.')[0] : key
}
