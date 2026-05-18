import { Separator } from '@/components/ui/separator'
import { FileDetails } from './file-details'
import { FileExplorerProvider, useFileExplorer } from './file-explorer-context'
import { FileList } from './file-list'
import { Toolbar } from './toolbar'
import { FolderTree } from './folder-tree'

export function FileExplorer() {
  return (
    <FileExplorerProvider>
      <FileExplorerLayout />
    </FileExplorerProvider>
  )
}

function FileExplorerLayout() {
  const { selected, showDrawer } = useFileExplorer()

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Toolbar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <FolderTree />
        <Separator orientation="vertical" className="data-[orientation=vertical]:h-auto" />
        <FileList />
        {selected.length === 1 && showDrawer && (
          <>
            <Separator orientation="vertical" className="data-[orientation=vertical]:h-auto" />
            <FileDetails />
          </>
        )}
      </div>
    </div>
  )
}
