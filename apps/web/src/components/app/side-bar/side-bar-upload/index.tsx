import {
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent
} from '@/components/ui/sidebar'
import { TrashIcon, UploadIcon, XIcon } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useForm } from 'react-hook-form'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { nanoid } from 'nanoid'
import type { GetUploadUrlsParams } from '@filebox/shared/http-contracts/get-upload-url'
import { FileApi, type FileUploadStatus } from '@/api/files-api'
import { cn } from '@/lib/cn'
import { FileUploadItemPreview } from './file-upload-item-preview'
import { FileUploadItemMetadata } from './file-upload-item-metadata'
import { FileUploadItemProgress } from './file-upload-item-progress'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

type FormFile = { data: File; progress: number; status: FileUploadStatus }
interface UploadFormValues {
  files: Record<string, FormFile>
}

export function SideBarUpload() {
  const queryClient = useQueryClient()
  const form = useForm<UploadFormValues>({ defaultValues: { files: {} } })

  async function onSubmit(_values: UploadFormValues) {
    try {
      const params: GetUploadUrlsParams = {
        files: Object.entries(files).map(([clientRef, file]) => ({
          clientRef,
          filename: file.data.name,
          size: file.data.size,
          contentType: file.data.type
        }))
      }

      const result = await FileApi.getUploadUrls(params)
      // await queryClient.setQueryData // use optimistic update to set files data into cache of query key = "files "

      await Promise.allSettled(
        Array.from(result.entries()).map(([fileRef, uploadUrl]) =>
          FileApi.upload(
            uploadUrl,
            files[fileRef].data,
            (progress) => form.setValue(`files.${fileRef}.progress`, progress),
            (status) => form.setValue(`files.${fileRef}.status`, status)
          )
        )
      )

      await queryClient.invalidateQueries({ queryKey: ['files'] })
      toast.success('Files uploaded successfully')
    } catch (error) {
      toast.error('Failed to upload files')
    }
  }

  function handleClearFiles() {
    form.setValue('files', {})
  }

  function handleRemoveFile(fileRef: string) {
    const prev = form.getValues('files')
    const updated = Object.fromEntries(Object.entries(prev).filter(([k]) => k !== fileRef))
    form.setValue('files', updated)
  }

  function handleAddFiles(newFiles: File[]) {
    form.setValue('files', {
      ...form.getValues('files'),
      ...newFiles.reduce(
        (acc, file) => {
          const ref = nanoid()
          acc[ref] = { data: file, status: 'ready', progress: 0 }
          return acc
        },
        {} as Record<string, FormFile>
      )
    })
  }

  const dropzone = useDropzone({
    disabled: form.formState.isSubmitting,
    maxFiles: 10,
    maxSize: 500 * 1024 * 1024, // 500MB
    multiple: true,
    onDropAccepted: (newFiles) => handleAddFiles(newFiles),
    onDropRejected: (rejections) => {
      const tooManyFiles = rejections.some((r) => r.errors.some((e) => e.code === 'too-many-files'))
      if (tooManyFiles) toast.error('You can only upload up to 10 files at a time')

      const fileTooLarge = rejections.some((r) => r.errors.some((e) => e.code === 'file-too-large'))
      if (fileTooLarge) toast.error('Each file must be smaller than 500MB')
    }
  })

  const files = form.watch('files')

  useEffect(() => {
    if (form.formState.isSubmitSuccessful) form.reset()
  }, [form.formState.isSubmitSuccessful, form.reset])

  return (
    <Sidebar collapsible="none" className="hidden flex-1 md:flex">
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
        <SidebarHeader>
          <div className="p-4 text-base font-medium text-foreground">Upload</div>
          <div
            {...dropzone.getRootProps()}
            data-dragging={dropzone.isDragActive ? '' : undefined}
            data-invalid={dropzone.fileRejections.length > 0 ? '' : undefined}
            data-disabled={form.formState.isSubmitting ? '' : undefined}
            className="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors outline-none select-none hover:bg-accent/30 focus-visible:border-ring/50 data-dragging:border-primary/30 data-dragging:bg-accent/30 data-invalid:border-destructive data-invalid:ring-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50"
          >
            <input {...dropzone.getInputProps()} />
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="flex items-center justify-center rounded-full border p-2.5">
                <UploadIcon className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Drag & drop files here</p>
              <p className="text-xs text-muted-foreground">
                Or click to browse (max 10 files, up to 500MB each)
              </p>
            </div>
            <Button variant="outline" size="sm" className="mt-2 w-fit" type="button">
              Browse files
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent className="[scrollbar-width:thin]">
          <SidebarGroup className="py-0">
            <SidebarGroupContent>
              <div
                role="list"
                className={cn(
                  'flex flex-col gap-2 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-top-2 data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=inactive]:slide-out-to-top-2'
                )}
              >
                {Object.entries(files).map(([fileRef, file]) => (
                  <div
                    key={fileRef}
                    className="relative flex flex-col items-center gap-2.5 rounded-md border p-3"
                  >
                    <div className="flex w-full items-center gap-2">
                      <FileUploadItemPreview file={file.data} />
                      <FileUploadItemMetadata file={file.data} />
                      {file.status === 'ready' && (
                        <Button
                          type="button"
                          tooltip="Remove"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => handleRemoveFile(fileRef)}
                        >
                          <XIcon />
                        </Button>
                      )}
                    </div>
                    <FileUploadItemProgress progress={file.progress} status={file.status} />
                  </div>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {Object.keys(files).length > 0 && (
          <SidebarFooter>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild disabled={form.formState.isSubmitting}>
                  <Button size="icon" variant="outline" tooltip="Remove all" type="button">
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
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleClearFiles}
                      disabled={form.formState.isSubmitting}
                    >
                      Yes, remove all
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button className="flex-1" type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Spinner />}
                Upload
              </Button>
            </div>
          </SidebarFooter>
        )}
      </form>
    </Sidebar>
  )
}
