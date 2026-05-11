import { FileApi } from '@/api/files-api'
import { FileIcon } from '@/components/file-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/utils/format-bytes'
import { getFileExtension } from '@filebox/shared/utils/get-file-extension'
import type { FileData } from '@filebox/shared/src/file-data'
import { useQuery } from '@tanstack/react-query'
import {
  CopyIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  FolderPlusIcon,
  MoveIcon,
  PencilIcon,
  RefreshCwIcon,
  SearchIcon,
  Share2Icon,
  Trash2Icon,
  XIcon
} from 'lucide-react'
import { useState } from 'react'

// type EntryKind = 'folder' | 'file'

// interface TreeNode {
//   name: string
//   children?: TreeNode[]
// }

// interface FileRow {
//   name: string
//   kind: EntryKind
//   modifiedAt: string
//   permission: string
//   size: string
// }

// const tree: TreeNode[] = [
//   {
//     name: 'Folder name',
//     children: [
//       { name: 'scripts' },
//       { name: 'front-end' },
//       {
//         name: 'Web assets',
//         children: [{ name: 'logs' }, { name: 'testfolder' }, { name: 'public_html' }]
//       }
//     ]
//   },
//   { name: 'backup_files', children: [] },
//   { name: 'others' },
//   { name: 'New folder' }
// ]

// const rows: FileRow[] = [
//   {
//     name: 'logs',
//     kind: 'folder',
//     modifiedAt: '16/9/2023 5:54 am',
//     permission: '777',
//     size: '167 KB'
//   },
//   {
//     name: 'testfolder',
//     kind: 'folder',
//     modifiedAt: '4/12/2023 5:54 am',
//     permission: '777',
//     size: '7 MB'
//   },
//   {
//     name: 'public_html',
//     kind: 'folder',
//     modifiedAt: '26/1/2023 7:20 pm',
//     permission: '777',
//     size: '76 KB'
//   },
//   {
//     name: 'testfile.txt',
//     kind: 'file',
//     modifiedAt: '26/1/2023 5:54 am',
//     permission: '777',
//     size: '167 KB'
//   },
//   {
//     name: 'localhost.sql',
//     kind: 'file',
//     modifiedAt: '26/1/2023 5:54 am',
//     permission: '777',
//     size: '8 KB'
//   },
//   {
//     name: 'index.html',
//     kind: 'file',
//     modifiedAt: '26/1/2023 1:32 pm',
//     permission: '777',
//     size: '180 KB'
//   },
//   {
//     name: 'about.php',
//     kind: 'file',
//     modifiedAt: '14/7/2018 2:01 pm',
//     permission: '777',
//     size: '167 KB'
//   }
// ]

export function FileExplorer() {
  const [selected, setSelected] = useState<FileData | null>(null)

  const { data: files = [] } = useQuery({
    queryKey: ['files'],
    queryFn: () => FileApi.getFiles()
  })

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Toolbar />
      {/* <AddressBar /> */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* <Tree /> */}
        {/* <Separator orientation="vertical" className="data-[orientation=vertical]:h-auto" /> */}
        <FileList files={files} selected={selected} onSelect={setSelected} />
        {selected && (
          <>
            <Separator orientation="vertical" className="data-[orientation=vertical]:h-auto" />
            <FileDetails file={selected} onClose={() => setSelected(null)} />
          </>
        )}
      </div>
    </div>
  )
}

function FileDetails({ file, onClose }: { file: FileData; onClose: () => void }) {
  const ext = getFileExtension(file.name)

  const typeLabel = ext ? `${ext.toUpperCase()} File` : file.contentType || 'File'
  const uploadedAt = file.uploadedAt
    ? new Date(file.uploadedAt).toLocaleString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '—'

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-auto">
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-1.5">
        <span className="truncate text-xs font-medium text-muted-foreground">Details</span>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
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

        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="w-fit gap-1.5">
            <Share2Icon />
            Share
          </Button>
          <Button variant="outline" size="icon-sm">
            <EllipsisVerticalIcon />
          </Button>
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

          <dt className="text-muted-foreground">Uploaded at</dt>
          <dd className="truncate">{uploadedAt}</dd>

          {file.checksum && (
            <>
              <dt className="text-muted-foreground">Checksum</dt>
              <dd className="truncate font-mono text-xs">{file.checksum}</dd>
            </>
          )}
        </dl>
      </div>
    </aside>
  )
}

function Toolbar() {
  return (
    <div className="flex shrink-0 items-center justify-center gap-0.5 border-b px-2 py-1.5">
      <ToolbarButton icon={<FolderPlusIcon />} label="Add folder" />
      <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-full" />
      <ToolbarButton disabled icon={<CopyIcon />} label="Copy" />
      <ToolbarButton disabled icon={<MoveIcon />} label="Move" />
      <ToolbarButton disabled icon={<DownloadIcon />} label="Download" />
      <ToolbarButton disabled icon={<PencilIcon />} label="Rename" />
      <ToolbarButton disabled icon={<Trash2Icon />} label="Delete" />
      <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-full" />
      <ToolbarButton icon={<RefreshCwIcon />} />

      <div className="relative flex w-full items-center">
        <SearchIcon className="absolute left-2 size-3.5 text-muted-foreground" />
        <Input placeholder="Search" className="h-7 pl-7 text-sm" />
      </div>
    </div>
  )
}

function ToolbarButton({
  icon,
  label,
  disabled
}: {
  icon: React.ReactNode
  label?: string
  disabled?: boolean
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="font-normal text-muted-foreground hover:text-foreground"
      disabled={disabled}
    >
      {icon}
      {label && <span>{label}</span>}
    </Button>
  )
}

// function AddressBar() {
//   return (
//     <div className="flex shrink-0 items-center gap-1.5 border-b px-2 py-1.5">
//       <Button variant="ghost" size="icon-sm" tooltip="Home">
//         <HomeIcon />
//       </Button>
//       <Button variant="ghost" size="icon-sm" tooltip="Back">
//         <ArrowLeftIcon />
//       </Button>
//       <Button variant="ghost" size="icon-sm" tooltip="Forward">
//         <ArrowRightIcon />
//       </Button>
//       <Button variant="ghost" size="icon-sm" tooltip="Up">
//         <ArrowUpIcon />
//       </Button>
//       <Button variant="ghost" size="icon-sm" tooltip="Refresh">
//         <RefreshCwIcon />
//       </Button>

//       <div className="relative flex flex-1 items-center">
//         <FolderIcon className="absolute left-2 size-3.5 text-muted-foreground" />
//         <Input defaultValue="Path://public_html/files/Web assets/" className="pr-8 pl-7 text-sm" />
//         <Button variant="ghost" size="icon-xs" className="absolute right-1" tooltip="Go">
//           <ArrowRightIcon />
//         </Button>
//       </div>

//       <div className="relative flex w-56 items-center">
//         <SearchIcon className="absolute left-2 size-3.5 text-muted-foreground" />
//         <Input placeholder="Search" className="pl-7 text-sm" />
//       </div>

//       <Button variant="ghost" size="icon-sm" tooltip="View options">
//         <KeyRoundIcon className="rotate-90" />
//       </Button>
//     </div>
//   )
// }

// function Tree() {
//   return (
//     <div className="w-64 shrink-0 overflow-auto py-2 [scrollbar-width:thin]">
//       <ul className="text-sm">
//         {tree.map((node) => (
//           <TreeItem
//             key={node.name}
//             node={node}
//             depth={0}
//             defaultOpen={node.name === 'Folder name'}
//           />
//         ))}
//       </ul>
//     </div>
//   )
// }

// function TreeItem({
//   node,
//   depth,
//   defaultOpen = false
// }: {
//   node: TreeNode
//   depth: number
//   defaultOpen?: boolean
// }) {
//   const [open, setOpen] = useState(defaultOpen)
//   const hasChildren = node.children && node.children.length > 0
//   const isExpandable = node.children !== undefined

//   return (
//     <li>
//       <button
//         type="button"
//         onClick={() => isExpandable && setOpen((v) => !v)}
//         className="flex w-full items-center gap-1 rounded-md py-1 pr-2 text-left hover:bg-muted"
//         style={{ paddingLeft: 8 + depth * 14 }}
//       >
//         <span className="flex size-3.5 items-center justify-center text-muted-foreground">
//           {isExpandable ? (
//             open ? (
//               <ChevronDownIcon className="size-3.5" />
//             ) : (
//               <ChevronRightIcon className="size-3.5" />
//             )
//           ) : null}
//         </span>
//         <FolderIcon className="size-4 text-muted-foreground" />
//         <span className="truncate">{node.name}</span>
//       </button>
//       {hasChildren && open && (
//         <ul>
//           {node.children!.map((child) => (
//             <TreeItem
//               key={child.name}
//               node={child}
//               depth={depth + 1}
//               defaultOpen={child.name === 'Web assets'}
//             />
//           ))}
//         </ul>
//       )}
//     </li>
//   )
// }

function FileList({
  files,
  selected,
  onSelect
}: {
  files?: FileData[]
  selected: FileData | null
  onSelect: (file: FileData) => void
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-auto">
      <div className="sticky top-0 grid grid-cols-[minmax(0,1fr)_180px_120px_100px] items-center gap-4 border-b bg-background px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
        <span>Name</span>
        <span>Uploaded At</span>
        <span>Permission</span>
        <span className="text-right">Size</span>
      </div>
      <ul>
        {files?.map((file) => (
          <li key={file.id}>
            <button
              type="button"
              onClick={() => onSelect(file)}
              className={cn(
                'grid w-full grid-cols-[minmax(0,1fr)_180px_120px_100px] items-center gap-4 px-4 py-2 text-left text-sm hover:bg-muted',
                selected?.id === file.id && 'bg-muted'
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                {/* {file.kind === 'folder' ? (
                  <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
                ) : ( */}
                <FileIcon
                  className="size-5 shrink-0 text-muted-foreground"
                  type={file.contentType}
                  ext={getFileExtension(file.name)}
                />
                {/* )} */}
                <span className="truncate">{file.name}</span>
              </span>
              <span className="truncate text-muted-foreground">
                {file.uploadedAt?.toISOString() ?? ''}
              </span>
              <span className="truncate text-muted-foreground">{file.contentType}</span>
              <span className="text-right text-muted-foreground">{formatBytes(file.size)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
