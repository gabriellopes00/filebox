import { FileIcon } from '@/components/file-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table
} from '@/components/ui/table'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/utils/format-bytes'
import { getFileExtension } from '@filebox/shared/utils/file'
import { format } from 'date-fns'
import { CheckIcon, LinkIcon, PackageOpenIcon, UploadIcon, XIcon } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent
} from 'react'
import { useFileExplorer } from './file-explorer-context'
import { FileApi, type RenameFileParams } from '@/api/files-api'
import { queryClient } from '@/lib/react-query'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/spinner'

export function FileList() {
  const { files, isLoading, selected, setSelected, toggleSelected, renamingId, closeRename } =
    useFileExplorer()

  const renameMutation = useMutation<void, Error, RenameFileParams>({
    mutationKey: ['rename-file'],
    mutationFn: (params) => FileApi.rename(params),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['files'] })
      toast.success('File renamed')
    },
    onError: (error) => {
      console.error(error)
      toast.error('Failed to rename file')
    },
    onSettled: () => closeRename()
  })

  const isSelected = (id: string) => selected.some((f) => f.id === id)

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-muted/50 text-xs uppercase [&_th]:text-muted-foreground">
          <TableRow>
            <TableHead className="px-4">Name</TableHead>
            <TableHead className="w-45">Uploaded At</TableHead>
            <TableHead className="w-30">Permission</TableHead>
            <TableHead className="w-25 px-4 text-right">Size</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr]:border-0">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="px-4">
                  <span className="flex min-w-0 items-center gap-2">
                    <Skeleton className="size-5 shrink-0 rounded-sm" />
                    <Skeleton className="h-4 w-40" />
                  </span>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="px-4">
                  <Skeleton className="ml-auto h-4 w-16" />
                </TableCell>
              </TableRow>
            ))}
          {!isLoading && files?.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="py-16">
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <PackageOpenIcon className="size-12 text-muted-foreground/60" strokeWidth={1.5} />
                  <div className="space-y-1">
                    <p className="font-semibold">No files uploaded here</p>
                    <p className="text-sm text-muted-foreground">
                      Upload files from you computer or import them from a URL
                    </p>
                    <div className="item-center flex justify-center gap-2 p-3">
                      <Button size="sm" variant="outline">
                        <UploadIcon />
                        Upload file
                      </Button>
                      <Button size="sm" variant="ghost">
                        <LinkIcon />
                        Import from URL
                      </Button>
                    </div>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
          {!isLoading &&
            files?.map((file) => (
              <TableRow
                onContextMenu={() => {
                  if (!isSelected(file.id)) setSelected([file])
                }}
                key={file.id}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) toggleSelected(file)
                  else if (!isSelected(file.id)) setSelected([file])
                  else setSelected([])
                }}
                data-state={isSelected(file.id) ? 'selected' : undefined}
                className={cn('cursor-pointer')}
              >
                <TableCell className="px-4">
                  <span className="flex min-w-0 items-center gap-2">
                    <FileIcon
                      className="size-5 shrink-0 text-muted-foreground"
                      type={file.contentType}
                      ext={getFileExtension(file.name)}
                    />
                    {renamingId === file.id ? (
                      <RenameInput
                        isLoading={renameMutation.isPending}
                        initialName={file.name.split('.')[0]}
                        onCommit={(name) =>
                          renameMutation.mutate({
                            fileId: file.id,
                            name:
                              name + (file.name.includes('.') ? `.${file.name.split('.')[1]}` : '')
                          })
                        }
                        onCancel={closeRename}
                      />
                    ) : (
                      <span className="min-w-0 truncate">{file.name}</span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {file.uploadedAt ? format(file.uploadedAt, 'MMM dd, yyyy HH:mm') : '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">{file.contentType}</TableCell>
                <TableCell className="px-4 text-right text-muted-foreground">
                  {formatBytes(file.size)}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}

function RenameInput({
  initialName,
  isLoading,
  onCommit,
  onCancel
}: {
  initialName: string
  onCommit: (name: string) => void
  onCancel: () => void
  isLoading?: boolean
}) {
  const [value, setValue] = useState(initialName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    input.focus()
    const dot = initialName.lastIndexOf('.')
    const end = dot > 0 ? dot : initialName.length
    input.setSelectionRange(0, end)
  }, [initialName])

  function commit() {
    const trimmed = value.trim()
    if (!trimmed || trimmed === initialName) {
      onCancel()
      return
    }
    onCommit(trimmed)
  }

  return (
    <span
      className="flex min-w-0 flex-1 items-center gap-1"
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <Input
        disabled={isLoading}
        ref={inputRef}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            onCancel()
          }
        }}
        onBlur={(e: FocusEvent<HTMLInputElement>) => {
          if ((e.relatedTarget as HTMLElement | null)?.closest('[data-rename-action]')) return
          commit()
        }}
        className="h-7 text-sm"
      />
      <Button
        type="button"
        data-rename-action="commit"
        variant="ghost"
        size="icon-xs"
        onMouseDown={(e) => e.preventDefault()}
        onClick={commit}
        disabled={isLoading}
        tooltip="Confirm"
      >
        {isLoading ? <Spinner /> : <CheckIcon />}
      </Button>
      <Button
        type="button"
        data-rename-action="cancel"
        variant="ghost"
        size="icon-xs"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onCancel}
        disabled={isLoading}
        tooltip="Cancel"
      >
        <XIcon />
      </Button>
    </span>
  )
}
