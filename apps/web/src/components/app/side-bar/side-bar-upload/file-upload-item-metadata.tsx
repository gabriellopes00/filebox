import { cn } from '@/lib/cn'
import { formatBytes } from '@/utils/format-bytes'
import type { ComponentProps } from 'react'

interface FileUploadItemMetadataProps extends ComponentProps<'div'> {
  file: File
  size?: 'default' | 'sm'
}

export function FileUploadItemMetadata(props: FileUploadItemMetadataProps) {
  const { size = 'default', file, ...metadataProps } = props

  return (
    <div
      data-slot="file-upload-metadata"
      {...metadataProps}
      className={'flex min-w-0 flex-1 flex-col'}
    >
      <span
        className={cn(
          'truncate overflow-hidden text-sm font-medium',
          size === 'sm' && 'text-[13px] leading-snug font-normal'
        )}
      >
        {file.name}
      </span>
      <span
        // id={itemContext.sizeId}
        className={cn(
          'truncate text-xs text-muted-foreground',
          size === 'sm' && 'text-[11px] leading-snug'
        )}
      >
        {file.type || 'Unknown file type'} &middot; {formatBytes(file.size)}
      </span>
      {/* {error && (
        <span id={itemContext.messageId} className="text-xs text-destructive">
          {error}
        </span>
      )} */}
    </div>
  )
}
