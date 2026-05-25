import { FileApi } from '@/api/files-api'
import type { FileData, FileStatus } from '@filebox/shared/data/file-data'
import { useQuery } from '@tanstack/react-query'
import { createContext, use, useCallback, useState, type ReactNode } from 'react'

interface FileExplorerContextValue {
  files: FileData[]
  isLoading: boolean
  reload: () => void
  selected: FileData[]
  setSelected: (files: FileData[]) => void
  toggleSelected: (file: FileData) => void
  renamingId: string | null
  triggerRename: (id: string) => void
  closeRename: () => void

  showDrawer: boolean
  toggleDrawer: (open?: boolean) => void
}

const FileExplorerContext = createContext<FileExplorerContextValue | null>(null)

export function FileExplorerProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<FileData[]>([])

  const toggleSelected = useCallback((file: FileData) => {
    setSelected((prev) =>
      prev.some((f) => f.id === file.id) ? prev.filter((f) => f.id !== file.id) : [...prev, file]
    )
  }, [])
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [showDrawer, setShowDrawer] = useState(true)

  const statuses: FileStatus[] = ['pending', 'available']
  const {
    data: files = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['files', statuses],
    queryFn: () => FileApi.getFiles(statuses)
  })

  const triggerRename = useCallback((id: string) => setRenamingId(id), [])
  const closeRename = useCallback(() => setRenamingId(null), [])

  function toggleDrawer(open?: boolean) {
    setShowDrawer((prev) => (typeof open === 'boolean' ? open : !prev))
  }

  return (
    <FileExplorerContext
      value={{
        files,
        isLoading,
        selected,
        setSelected,
        toggleSelected,
        reload: refetch,
        renamingId,
        triggerRename,
        closeRename,
        showDrawer,
        toggleDrawer
      }}
    >
      {children}
    </FileExplorerContext>
  )
}

export function useFileExplorer() {
  const ctx = use(FileExplorerContext)
  if (!ctx) throw new Error('useFileExplorer must be used within a FileExplorerProvider')

  return ctx
}
