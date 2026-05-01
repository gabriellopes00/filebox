import { AppSidebar } from '@/components/app/side-bar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import type { CSSProperties } from 'react'
import { AppHeader } from './components/app/header'

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
            <div className="flex flex-1 flex-col gap-4 p-4">
              {Array.from({ length: 24 }).map((_, index) => (
                <div key={index} className="aspect-video h-12 w-full rounded-lg bg-muted/50" />
              ))}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
