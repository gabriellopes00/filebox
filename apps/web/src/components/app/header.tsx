import { Separator } from '../ui/separator'
import { SidebarTrigger } from '../ui/sidebar'

export function AppHeader() {
  return (
    <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
    </header>
  )
}
