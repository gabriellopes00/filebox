import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  CopyIcon,
  DownloadIcon,
  PencilIcon,
  Trash2Icon,
  RefreshCwIcon,
  Share2Icon,
  PanelRightIcon,
  PlayIcon,
  FolderPlusIcon
} from 'lucide-react'
import { useFileExplorer } from './file-explorer-context'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useState, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { FileApi } from '@/api/files-api'
import { queryClient } from '@/lib/react-query'
import type { FileIdsParams } from '@filebox/shared/http-contracts/file-id-params'
import { useMutation } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/spinner'
import { Toggle } from '@/components/ui/toggle'
import { toast } from 'sonner'
import { downloadFile } from '@/utils/download-file'

export function Toolbar() {
  const { selected, setSelected, reload, triggerRename, showDrawer, toggleDrawer } =
    useFileExplorer()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const deleteMutation = useMutation<void, Error, FileIdsParams>({
    mutationKey: ['delete-file'],
    mutationFn: (params) => FileApi.delete(params),
    onSuccess: async (_, { fileIds }) => {
      await queryClient.invalidateQueries({ queryKey: ['files'] })
      setSelected([])
      toast.success(fileIds.length > 1 ? `${fileIds.length} files deleted` : 'File deleted')
    },
    onError: (error, { fileIds }) => {
      console.error('Error deleting file:', error)
      toast.error(fileIds.length > 1 ? 'Error deleting files' : 'Error deleting file')
    },
    onSettled: () => setDeleteOpen(false)
  })

  const downloadMutation = useMutation<void, Error, FileIdsParams>({
    mutationKey: ['download-file'],
    mutationFn: async (params) => {
      const result = await FileApi.getDownloadUrls(params)
      for (const [index, { url, filename }] of result.downloads.entries()) {
        setTimeout(() => downloadFile(url, filename), index * 500)
      }
    }
  })

  const copyMutation = useMutation<void, Error, FileIdsParams>({
    mutationKey: ['copy-file'],
    mutationFn: (params) => FileApi.copy(params),
    onSuccess: async (_, { fileIds }) => {
      await queryClient.invalidateQueries({ queryKey: ['files'] })
      setSelected([])
      toast.success(fileIds.length > 1 ? `${fileIds.length} files copied` : 'File copied')
    },
    onError: (error, { fileIds }) => {
      console.error('Error copying file:', error)
      toast.error(fileIds.length > 1 ? 'Error copying files' : 'Error copying file')
    }
  })

  return (
    <div className="flex shrink-0 items-center gap-0.5 border-b px-2 py-1.5">
      <div className="flex w-64 items-center">
        <ToolbarButton icon={<FolderPlusIcon />} label="Add folder" />
      </div>

      <ToolbarButton
        disabled={
          selected.length === 0 ||
          copyMutation.isPending ||
          !selected.every((file) => file.status === 'available')
        }
        icon={<CopyIcon />}
        label="Copy"
        loading={copyMutation.isPending}
        onClick={() => copyMutation.mutate({ fileIds: selected.map((file) => file.id) })}
      />

      {/* <ToolbarButton disabled={selected.length === 0} icon={<MoveIcon />} label="Move" /> */}

      <ToolbarButton
        disabled={
          selected.length === 0 ||
          downloadMutation.isPending ||
          !selected.every((file) => file.status === 'available')
        }
        icon={<DownloadIcon />}
        label="Download"
        loading={downloadMutation.isPending}
        onClick={() => downloadMutation.mutate({ fileIds: selected.map((file) => file.id) })}
      />

      <ToolbarButton
        disabled={selected.length !== 1 || !selected.every((file) => file.status === 'available')}
        icon={<PencilIcon />}
        onClick={() => selected.length === 1 && triggerRename(selected[0].id)}
        label="Rename"
      />

      <ToolbarButton
        disabled={selected.length === 0 || !selected.every((file) => file.status === 'available')}
        icon={<Share2Icon />}
        label="Share"
      />

      <Popover open={deleteOpen} onOpenChange={setDeleteOpen}>
        <PopoverTrigger asChild disabled={selected.length === 0}>
          <ToolbarButton disabled={selected.length === 0} icon={<Trash2Icon />} label="Delete" />
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="grid gap-2">
            <div className="space-y-1">
              <h4 className="leading-none font-medium">Confirm?</h4>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete {selected.length > 1 ? 'these files' : 'this file'}?{' '}
                <br />
                {selected.length > 1 ? 'They' : 'It'} will be moved to the trash and can be restored
                within 3 days. <br /> After that, {selected.length > 1 ? 'they' : 'it'} will be
                permanently deleted.
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() =>
                selected.length > 0 && deleteMutation.mutate({ fileIds: selected.map((f) => f.id) })
              }
              disabled={selected.length === 0 || deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Spinner />}
              Yes, delete {selected.length > 1 ? `${selected.length} files` : 'file'}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <ToolbarButton
        disabled
        icon={<PlayIcon />}
        label="Play"
        // enable only for video & audio files
      />

      {selected.length > 1 && (
        <p className="mr-2 ml-auto text-xs text-muted-foreground">Selected ({selected.length})</p>
      )}

      <Separator
        orientation="vertical"
        className={cn(
          'data-[orientation=vertical]:h-full',
          selected.length > 1 ? 'mx-1' : 'ml-auto'
        )}
      />

      <ToolbarButton icon={<RefreshCwIcon />} onClick={reload} />
      <Toggle size="sm" pressed={showDrawer} onClick={() => toggleDrawer()}>
        <PanelRightIcon />
      </Toggle>
    </div>
  )
}

function ToolbarButton({
  icon,
  label,
  className,
  loading,
  ...rest
}: ComponentProps<'button'> & { icon: React.ReactNode; label?: string; loading?: boolean }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('font-normal text-muted-foreground hover:text-foreground', className)}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {label && <span>{label}</span>}
    </Button>
  )
}
