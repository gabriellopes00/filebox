// type EntryKind = 'folder' | 'file'

import { ChevronDownIcon, ChevronRightIcon, FolderIcon } from 'lucide-react'
import { useState } from 'react'

interface TreeNode {
  name: string
  children?: TreeNode[]
}

// interface FileRow {
//   name: string
//   kind: EntryKind
//   modifiedAt: string
//   permission: string
//   size: string
// }

const tree: TreeNode[] = [
  {
    name: 'Folder name',
    children: [
      { name: 'scripts' },
      { name: 'front-end' },
      {
        name: 'Web assets',
        children: [{ name: 'logs' }, { name: 'testfolder' }, { name: 'public_html' }]
      }
    ]
  },
  { name: 'backup_files', children: [] },
  { name: 'others' },
  { name: 'New folder' }
]

export function FolderTree() {
  return (
    <div className="w-64 shrink-0 overflow-auto py-2 [scrollbar-width:thin]">
      <ul className="text-sm">
        {tree.map((node) => (
          <TreeItem
            key={node.name}
            node={node}
            depth={0}
            defaultOpen={node.name === 'Folder name'}
          />
        ))}
      </ul>
    </div>
  )
}

function TreeItem({
  node,
  depth,
  defaultOpen = false
}: {
  node: TreeNode
  depth: number
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const hasChildren = node.children && node.children.length > 0
  const isExpandable = node.children !== undefined

  return (
    <li>
      <button
        type="button"
        onClick={() => isExpandable && setOpen((v) => !v)}
        className="flex w-full items-center gap-1 rounded-md py-1 pr-2 text-left hover:bg-muted"
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <span className="flex size-3.5 items-center justify-center text-muted-foreground">
          {isExpandable ? (
            open ? (
              <ChevronDownIcon className="size-3.5" />
            ) : (
              <ChevronRightIcon className="size-3.5" />
            )
          ) : null}
        </span>
        <FolderIcon className="size-4 text-muted-foreground" />
        <span className="truncate">{node.name}</span>
      </button>
      {hasChildren && open && (
        <ul>
          {node.children!.map((child) => (
            <TreeItem
              key={child.name}
              node={child}
              depth={depth + 1}
              defaultOpen={child.name === 'Web assets'}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
