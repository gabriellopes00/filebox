import { AppSidebar } from '@/components/app/side-bar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import type { CSSProperties } from 'react'
import { AppHeader } from './components/app/header'
import { FileExplorer } from './components/app/explorer/file-explorer'

export function App() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '440px'
        } as CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        <AppHeader />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden">
            <FileExplorer />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
