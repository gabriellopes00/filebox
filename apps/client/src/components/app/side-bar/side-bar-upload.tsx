import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  Sidebar,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar'
import { useState, useCallback } from 'react'
import { TrashIcon, UploadIcon, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadItemProgress,
  FileUploadList,
  type FileUploadProps,
  FileUploadTrigger
} from '@/components/ui/file-upload'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function SideBarUpload() {
  const [files, setFiles] = useState<File[]>([])

  function handleClearFiles() {
    setFiles([])
  }

  const onUpload: NonNullable<FileUploadProps['onUpload']> = useCallback(
    async (files, { onProgress, onSuccess, onError }) => {
      try {
        // Process each file individually
        const uploadPromises = files.map(async (file) => {
          try {
            // Simulate file upload with progress
            const totalChunks = 100
            let uploadedChunks = 0

            // Simulate chunk upload with delays
            for (let i = 0; i < totalChunks; i++) {
              // Simulate network delay (100-300ms per chunk)
              await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 100))

              // Update progress for this specific file
              uploadedChunks++
              const progress = (uploadedChunks / totalChunks) * 100
              onProgress(file, progress)
            }

            // Simulate server processing delay
            await new Promise((resolve) => setTimeout(resolve, 500))
            onSuccess(file)
          } catch (error) {
            onError(file, error instanceof Error ? error : new Error('Upload failed'))
          }
        })

        // Wait for all uploads to complete
        await Promise.all(uploadPromises)
      } catch (error) {
        // This handles any error that might occur outside the individual upload processes
        console.error('Unexpected error during upload:', error)
      }
    },
    []
  )

  // const onFileReject = (file: File, message: string) => {
  //   // toast(message, {
  //   //   description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}" has been rejected`,
  //   // });
  // }

  return (
    <Sidebar collapsible="none" className="hidden flex-1 overflow-auto md:flex">
      <FileUpload
        value={files}
        onValueChange={setFiles}
        onUpload={onUpload}
        // onFileReject={onFileReject}
        maxFiles={10}
        className="h-full w-full"
        multiple
      >
        <SidebarHeader>
          <div className="p-4 text-base font-medium text-foreground">Upload</div>
          <FileUploadDropzone>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="flex items-center justify-center rounded-full border p-2.5">
                <UploadIcon className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Drag & drop files here</p>
              <p className="text-xs text-muted-foreground">
                Or click to browse (max 10 files, up to 1GB each)
              </p>
            </div>
            <FileUploadTrigger asChild>
              <Button variant="outline" size="sm" className="mt-2 w-fit">
                Browse files
              </Button>
            </FileUploadTrigger>
          </FileUploadDropzone>
        </SidebarHeader>
        <SidebarContent className="[scrollbar-width:thin]">
          <SidebarGroup className="py-0">
            <SidebarGroupContent>
              <FileUploadList>
                {files.map((file, index) => (
                  <FileUploadItem key={index} value={file} className="flex-col">
                    <div className="flex w-full items-center gap-2">
                      <FileUploadItemPreview />
                      <FileUploadItemMetadata />
                      <FileUploadItemDelete asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <XIcon />
                        </Button>
                      </FileUploadItemDelete>
                    </div>
                    <FileUploadItemProgress />
                  </FileUploadItem>
                ))}
              </FileUploadList>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {files.length > 0 && (
          <SidebarFooter>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="outline" tooltip="Remove all">
                    <TrashIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="grid gap-2">
                    <div className="space-y-1">
                      <h4 className="leading-none font-medium">Confirm?</h4>
                      <p className="text-sm text-muted-foreground">
                        Are you sure you want to remove all files?
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleClearFiles}>
                      Yes, remove all
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button className="flex-1">Upload</Button>
            </div>
          </SidebarFooter>
        )}
      </FileUpload>
    </Sidebar>
  )
}
