import { formatBytes } from '@/utils/format-bytes'
import { MULTIPART_THRESHOLD } from '@filebox/shared/data/file-data'
import type { ComponentProps } from 'react'

interface FileUploadItemMetadataProps extends ComponentProps<'div'> {
  file: File
}

export function FileUploadItemMetadata(props: FileUploadItemMetadataProps) {
  const { file, ...metadataProps } = props

  return (
    <div
      data-slot="file-upload-metadata"
      {...metadataProps}
      className="flex min-w-0 flex-1 flex-col"
    >
      <span className="truncate overflow-hidden text-sm font-medium">{file.name}</span>
      <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
        <span className="truncate">{file.type || 'Unknown file type'}</span>
        <span className="shrink-0">
          &middot; {formatBytes(file.size)}
          {file.size >= MULTIPART_THRESHOLD && ' (Multipart)'}
        </span>
      </span>
      {/* {error && (
        <span id={itemContext.messageId} className="text-xs text-destructive">
          {error}
        </span>
      )} */}
    </div>
  )
}
