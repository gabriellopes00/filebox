import type { FileUploadStatus } from '@/api/files-api'
import { cn } from '@/lib/cn'
import type { ComponentProps } from 'react'

interface FileUploadItemProgressProps extends ComponentProps<'div'> {
  status?: FileUploadStatus
  progress?: number
}

export function FileUploadItemProgress(props: FileUploadItemProgressProps) {
  const { progress = 0, status, ...progressProps } = props

  // const shouldRender = forceMount || itemContext.fileState.progress !== 100
  // if (!shouldRender) return null

  return (
    <div className="relative flex w-full flex-1 flex-col gap-0.5">
      <span className={cn('text-xs text-muted-foreground')}>
        {(status === 'waiting' || status === 'queued') && 'Waiting...'}
        {status === 'hashing' && 'Preparing file...'}
        {status === 'ready' && 'Ready'}
        {status === 'uploading' && `Uploading ${Math.round(progress)}%`}
        {status === 'success' && 'Uploaded successfully'}
        {status === 'error' && 'There was a problem uploading this file. Try again.'}
      </span>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        data-slot="file-upload-progress"
        {...progressProps}
        className={cn(
          'relative h-1.5 w-full overflow-hidden rounded-full bg-primary/20',
          status === 'error' && 'bg-destructive/20',
          status === 'success' && 'bg-green-600/20'
        )}
      >
        <div
          className={cn(
            'h-full w-full flex-1 bg-primary transition-transform duration-300 ease-linear',
            status === 'error' && 'bg-destructive',
            status === 'success' && 'bg-green-600'
          )}
          style={{ transform: `translateX(-${100 - progress}%)` }}
        />
      </div>
    </div>
  )
}
