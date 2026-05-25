import { FileApi } from '@/api/files-api'
import { FileIcon } from '@/components/file-icon'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/cn'
import { queryClient } from '@/lib/react-query'
import { formatBytes } from '@/utils/format-bytes'
import type { FileIdsParams } from '@filebox/shared/http-contracts/file-id-params'
import { getFileExtension } from '@filebox/shared/utils/file'
import { useMutation, useQuery } from '@tanstack/react-query'
import { RotateCcwIcon, Trash2Icon, TrashIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function SideBarTrash() {
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files', 'trash'],
    queryFn: () => FileApi.getFiles(['deleting', 'deleted'])
  })

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const restoreMutation = useMutation<void, Error, FileIdsParams>({
    mutationKey: ['restore-files'],
    mutationFn: (params) => FileApi.restore(params),
    onSuccess: async (_, { fileIds }) => {
      await queryClient.invalidateQueries({ queryKey: ['files'] })
      setSelectedIds([])
      toast.success(fileIds.length > 1 ? `${fileIds.length} files restored` : 'File restored')
    },
    onError: (error, { fileIds }) => {
      console.error('Error restoring files:', error)
      toast.error(fileIds.length > 1 ? 'Error restoring files' : 'Error restoring file')
    }
  })

  const confirmDeleteMutation = useMutation<void, Error, FileIdsParams>({
    mutationKey: ['confirm-delete-files'],
    mutationFn: (params) => FileApi.confirmDeletion(params),
    onSuccess: async (_async, { fileIds }) => {
      await queryClient.invalidateQueries({ queryKey: ['files'] })
      setSelectedIds([])
      toast.success(
        fileIds.length > 1
          ? `${fileIds.length} files permanently deleted`
          : 'File permanently deleted'
      )
    },
    onError: (error, { fileIds }) => {
      console.error('Error deleting files:', error)
      toast.error(fileIds.length > 1 ? 'Error deleting files' : 'Error deleting file')
    },
    onSettled: () => {
      setBulkDeleteOpen(false)
      setConfirmDeleteId(null)
    }
  })

  const allSelected = files.length > 0 && selectedIds.length === files.length
  const someSelected = selectedIds.length > 0 && !allSelected

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : files.map((f) => f.id))
  }

  const hasSelection = selectedIds.length > 0
  const isItemRestoring = (id: string) =>
    restoreMutation.isPending && restoreMutation.variables?.fileIds.includes(id)
  const isItemDeleting = (id: string) =>
    confirmDeleteMutation.isPending && confirmDeleteMutation.variables?.fileIds.includes(id)

  return (
    <Sidebar collapsible="none" className="hidden min-w-0 flex-1 md:flex">
      <SidebarHeader className="gap-3.5 border-b p-4">
        <div className="flex w-full items-center justify-between">
          <div className="text-base font-medium text-foreground">Trash</div>
        </div>
        <SidebarInput placeholder="Type to search... (not working yet)" />
      </SidebarHeader>

      {(hasSelection || files.length > 0) && !isLoading && (
        <div className="flex items-center gap-2 border-b px-4 py-2 text-xs">
          <Checkbox
            id="trash-select-all"
            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
            onCheckedChange={toggleSelectAll}
            aria-label="Select all"
          />
          {hasSelection ? (
            <>
              <Label htmlFor="trash-select-all" className="text-xs text-muted-foreground">
                {selectedIds.length} selected
              </Label>
              <div className="ml-auto flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  tooltip="Restore selected"
                  disabled={restoreMutation.isPending || confirmDeleteMutation.isPending}
                  onClick={() => restoreMutation.mutate({ fileIds: selectedIds })}
                >
                  {restoreMutation.isPending ? <Spinner /> : <RotateCcwIcon />}
                </Button>
                <Popover open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      tooltip="Delete selected permanently"
                      disabled={restoreMutation.isPending || confirmDeleteMutation.isPending}
                    >
                      {confirmDeleteMutation.isPending ? <Spinner /> : <Trash2Icon />}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="grid gap-2">
                      <div className="space-y-1">
                        <h4 className="leading-none font-medium">Delete permanently?</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedIds.length > 1
                            ? `These ${selectedIds.length} files will be permanently deleted.`
                            : 'This file will be permanently deleted.'}{' '}
                          This action cannot be undone.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => confirmDeleteMutation.mutate({ fileIds: selectedIds })}
                        disabled={confirmDeleteMutation.isPending}
                      >
                        {confirmDeleteMutation.isPending && <Spinner />}
                        Yes, delete{' '}
                        {selectedIds.length > 1 ? `${selectedIds.length} files` : 'file'}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  tooltip="Clear selection"
                  onClick={() => setSelectedIds([])}
                >
                  <XIcon />
                </Button>
              </div>
            </>
          ) : (
            <Label htmlFor="trash-select-all" className="text-xs text-muted-foreground">
              Select all
            </Label>
          )}
        </div>
      )}

      <SidebarContent>
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-start gap-2 border-b p-4 last:border-b-0"
                >
                  <div className="flex w-full items-center gap-2">
                    <Skeleton className="size-5 shrink-0 rounded-sm" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="flex w-full items-center gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="ml-auto size-7 rounded" />
                    <Skeleton className="size-7 rounded" />
                  </div>
                </div>
              ))}

            {!isLoading && files.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
                <TrashIcon className="size-12 text-muted-foreground/60" strokeWidth={1.5} />
                <div className="space-y-1">
                  <p className="font-semibold">Trash is empty</p>
                  <p className="text-sm text-muted-foreground">Deleted files will appear here</p>
                </div>
              </div>
            )}

            {!isLoading &&
              files.map((file) => {
                const checked = selectedIds.includes(file.id)
                const restoring = isItemRestoring(file.id)
                const deleting = isItemDeleting(file.id)
                const busy = restoring || deleting

                return (
                  <div
                    key={file.id}
                    data-state={checked ? 'selected' : undefined}
                    onClick={() => toggleSelected(file.id)}
                    className={cn(
                      'group/trash-item flex cursor-pointer flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      checked && 'bg-sidebar-accent text-sidebar-accent-foreground'
                    )}
                  >
                    <div className="flex w-full min-w-0 items-center gap-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleSelected(file.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${file.name}`}
                      />
                      <FileIcon
                        className="size-5 shrink-0 text-muted-foreground"
                        type={file.contentType}
                        ext={getFileExtension(file.name)}
                      />
                      <span className="min-w-0 truncate font-medium">{file.name}</span>
                    </div>
                    <div className="flex w-full min-w-0 items-center gap-2">
                      <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                        <span className="truncate">{file.contentType}</span>
                        <span className="shrink-0">
                          · {formatBytes(file.size)} · Expires at May 23, 12:00
                        </span>
                      </span>
                      <div
                        className={cn(
                          'ml-auto flex items-center gap-1 opacity-0 group-hover/trash-item:opacity-100 focus-within:opacity-100',
                          confirmDeleteId === file.id && 'opacity-100'
                        )}
                      >
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          tooltip="Restore"
                          disabled={busy}
                          onClick={(e) => {
                            e.stopPropagation()
                            restoreMutation.mutate({ fileIds: [file.id] })
                          }}
                        >
                          {restoring ? <Spinner /> : <RotateCcwIcon />}
                        </Button>
                        <Popover
                          open={confirmDeleteId === file.id}
                          onOpenChange={(open) => setConfirmDeleteId(open ? file.id : null)}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              tooltip="Delete permanently"
                              disabled={busy}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {deleting ? <Spinner /> : <Trash2Icon />}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-80"
                            align="end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="grid gap-2">
                              <div className="space-y-1">
                                <h4 className="leading-none font-medium">Delete permanently?</h4>
                                <p className="text-sm text-muted-foreground">
                                  This file will be permanently deleted. This action cannot be
                                  undone.
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  confirmDeleteMutation.mutate({ fileIds: [file.id] })
                                }}
                                disabled={confirmDeleteMutation.isPending}
                              >
                                {deleting && <Spinner />}
                                Yes, delete file
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                )
              })}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
