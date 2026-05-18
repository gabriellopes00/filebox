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
import { computeFileChecksum } from '@/lib/checksum'
import { FileUploadItemPreview } from './file-upload-item-preview'
import { FileUploadItemMetadata } from './file-upload-item-metadata'
import { FileUploadItemProgress } from './file-upload-item-progress'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import pLimit from 'p-limit'
import { Separator } from '@/components/ui/separator'
import { Field, FieldDescription } from '@/components/ui/field'
import { InputGroup, InputGroupInput, InputGroupAddon } from '@/components/ui/input-group'
import { ButtonGroup } from '@/components/ui/button-group'
import { Kbd } from '@/components/ui/kbd'

const hashLimit = pLimit(3)
const hashAbortControllers = new Map<string, AbortController>()

type FormFile = { data: File; progress: number; status: FileUploadStatus; checksum?: string }
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
          contentType: file.data.type,
          checksum: file.checksum!
        }))
      }

      const result = await FileApi.getUploadUrls(params)
      // await queryClient.setQueryData // use optimistic update to set files data into cache of query key = "files "

      await Promise.allSettled(
        Array.from(result.entries()).map(([fileRef, uploadUrl]) =>
          FileApi.upload(
            uploadUrl,
            files[fileRef].data,
            files[fileRef].checksum!,
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
    const currentFiles = form.getValues('files')

    Object.keys(currentFiles).forEach((fileRef) => {
      hashAbortControllers.get(fileRef)?.abort()
      hashAbortControllers.delete(fileRef)
    })

    form.setValue('files', {})
  }

  function handleRemoveFile(fileRef: string) {
    hashAbortControllers.get(fileRef)?.abort()
    hashAbortControllers.delete(fileRef)

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
          acc[ref] = { data: file, status: 'waiting', progress: 0 }
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
  const isReady = Object.values(files).every(
    (file) => file.status !== 'waiting' && file.status !== 'hashing'
  )

  useEffect(() => {
    if (form.formState.isSubmitSuccessful) form.reset()
  }, [form.formState.isSubmitSuccessful, form.reset])

  useEffect(() => {
    const waitingFiles = Object.entries(files).filter(([, file]) => file.status === 'waiting')
    if (waitingFiles.length === 0) return

    for (const [fileRef, file] of waitingFiles) {
      form.setValue(`files.${fileRef}.status`, 'queued')
      const controller = new AbortController()
      hashAbortControllers.set(fileRef, controller)

      hashLimit(async () => {
        try {
          if (controller.signal.aborted) return

          form.setValue(`files.${fileRef}.status`, 'hashing')

          const checksum = await computeFileChecksum(file.data, {
            signal: controller.signal,
            onProgress: (progress) => {
              if (controller.signal.aborted) return

              form.setValue(`files.${fileRef}.progress`, progress)
              if (progress === 100) form.setValue(`files.${fileRef}.status`, 'ready')
            }
          })

          if (controller.signal.aborted) return

          form.setValue(`files.${fileRef}.checksum`, checksum)
          form.setValue(`files.${fileRef}.progress`, 0)
        } catch (error) {
          if (controller.signal.aborted) return
          console.error('Failed to hash file:', file.data.name, error)
        } finally {
          hashAbortControllers.delete(fileRef)
        }
      })
    }
  }, [files, form])

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

          {Object.keys(files).length === 0 && (
            <>
              <div className="relative my-5 flex w-full items-center">
                <Separator className="flex-1" />
                <span className="shrink-0 px-4 text-xs font-medium text-muted-foreground">
                  Or import from URL
                </span>
                <Separator className="flex-1" />
              </div>
              <Field>
                <ButtonGroup>
                  <InputGroup>
                    <InputGroupInput id="input-group-url" placeholder="https://myfile.pdf" />
                    <InputGroupAddon align="inline-end">
                      <Kbd className="ml-1">Ctrl + v</Kbd>
                    </InputGroupAddon>
                  </InputGroup>
                  <Button variant="outline">Import</Button>
                </ButtonGroup>
                <FieldDescription className="px-2 text-xs">
                  The file will be fetched from the provided URL, so make sure it is{' '}
                  <b>publicly accessible</b> and supports CORS. <br />
                  Unallowed file types or files larger than 500MB will be rejected.
                </FieldDescription>
              </Field>
            </>
          )}
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
                      {(file.status === 'ready' ||
                        file.status === 'hashing' ||
                        file.status === 'waiting' ||
                        file.status === 'queued') && (
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

              <Button
                className="flex-1"
                type="submit"
                disabled={form.formState.isSubmitting || !isReady}
              >
                {(form.formState.isSubmitting || !isReady) && <Spinner />}
                {isReady
                  ? form.formState.isSubmitting
                    ? 'Uploading...'
                    : 'Upload'
                  : 'Preparing...'}
              </Button>
            </div>
          </SidebarFooter>
        )}
      </form>
    </Sidebar>
  )
}
