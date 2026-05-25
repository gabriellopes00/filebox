import { FileIcon } from '@/components/file-icon'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatBytes } from '@/utils/format-bytes'
import { getFileExtension } from '@filebox/shared/utils/file'
import { format } from 'date-fns'
import { CheckIcon, CopyIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { useFileExplorer } from './file-explorer-context'

export function FileDetails() {
  const { selected, setSelected } = useFileExplorer()
  const [copied, setCopied] = useState(false)
  const file = selected.length === 1 ? selected[0] : null
  if (!file) return null
  const ext = getFileExtension(file.name)
  const typeLabel = ext ? `${ext.toUpperCase()} File` : file.contentType || 'File'

  async function handleCopyChecksum() {
    if (!file?.checksum) return
    await navigator.clipboard.writeText(file.checksum)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-auto">
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-1.5">
        <span className="truncate text-xs font-medium text-muted-foreground">Details</span>
        <Button variant="ghost" size="icon-sm" onClick={() => setSelected([])}>
          <XIcon />
        </Button>
      </div>

      <div className="flex aspect-square w-full shrink-0 items-center justify-center bg-muted/40 p-6 [&>svg]:size-24">
        <FileIcon className="text-muted-foreground" type={file.contentType} ext={ext} />
      </div>

      <div className="flex flex-col justify-between gap-3 px-4 py-4">
        <div className="flex items-start gap-2">
          <FileIcon
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            type={file.contentType}
            ext={ext}
          />
          <h2 className="text-base font-semibold break-all">{file.name}</h2>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-3 px-4 py-4">
        <h3 className="text-sm font-semibold">Details</h3>
        <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
          <dt className="text-muted-foreground">Type</dt>
          <dd className="truncate">{typeLabel}</dd>

          <dt className="text-muted-foreground">Size</dt>
          <dd className="truncate">{formatBytes(file.size)}</dd>

          <dt className="text-muted-foreground">Status</dt>
          <dd className="truncate">
            {file.status === 'available' && 'Available'}
            {file.status === 'pending' && 'Processing...'}
            {file.status === 'deleting' && 'Deleting...'}
          </dd>

          <dt className="text-muted-foreground">Uploaded at</dt>
          <dd className="truncate">
            {file.availableAt ? format(file.availableAt, 'MMM dd, yyyy') : '-'}
          </dd>

          {file.checksum && (
            <>
              <dt className="text-muted-foreground">Checksum</dt>
              <dd className="flex items-center gap-1 truncate font-mono text-xs">
                <span className="truncate rounded-sm bg-accent px-2 py-1">{file.checksum}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  onClick={handleCopyChecksum}
                  tooltip="Copy"
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </Button>
              </dd>
            </>
          )}
        </dl>
      </div>
    </aside>
  )
}
