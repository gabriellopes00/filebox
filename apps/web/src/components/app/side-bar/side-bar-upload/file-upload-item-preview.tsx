import { cn } from '@/lib/cn'
import { renderPreview } from '@/utils/render-file-preview'
import type { ComponentProps } from 'react'

interface FileUploadItemPreviewProps extends ComponentProps<'div'> {
  file: File
}

export function FileUploadItemPreview(props: FileUploadItemPreviewProps) {
  const { file, ...previewProps } = props

  return (
    <div
      {...previewProps}
      className={cn(
        'relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded border bg-accent/50 text-muted-foreground [&>svg]:size-6'
      )}
    >
      {renderPreview(file)}
    </div>
  )
}
