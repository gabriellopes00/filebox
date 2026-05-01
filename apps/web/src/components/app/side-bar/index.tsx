import { ThemeSwitcher } from '@/components/theme/theme-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar'
import { Trash2Icon, GalleryVerticalEndIcon, UploadIcon, LinkIcon } from 'lucide-react'
import { type ComponentProps, useState } from 'react'
import { SideBarUpload } from './side-bar-upload'
import { SideBarLinks } from './side-bar-links'

const tabs = [
  {
    label: 'Upload',
    name: 'upload',
    icon: <UploadIcon />
  },
  {
    label: 'Links',
    name: 'links',
    icon: <LinkIcon />
  },
  {
    label: 'Trash',
    name: 'trash',
    icon: <Trash2Icon />
  }
]

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const [activeTab, setActiveTab] = useState(tabs[0].name)
  const { setOpen } = useSidebar()

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      <Sidebar collapsible="none" className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GalleryVerticalEndIcon className="size-4.5" />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {tabs.map((tab) => (
                  <SidebarMenuItem key={tab.name}>
                    <SidebarMenuButton
                      tooltip={{ children: tab.label, hidden: false }}
                      onClick={() => {
                        setActiveTab(tab.name)
                        setOpen(true)
                      }}
                      isActive={activeTab === tab.name}
                      className="px-2.5 md:px-2"
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <ThemeSwitcher />
        </SidebarFooter>
      </Sidebar>

      {activeTab === 'upload' && <SideBarUpload />}
      {activeTab === 'links' && <SideBarLinks />}
    </Sidebar>
  )
}
