import { FileIcon } from '@/components/file-icon'
import { getFileExtension } from '@filebox/shared/utils/file'

export function renderPreview(file: File) {
  if (file.type.startsWith('image/')) {
    const url = URL.createObjectURL(file)

    return (
      // biome-ignore lint/performance/noImgElement: dynamic file URLs from user uploads don't work well with Next.js Image optimization
      <img src={url} alt={file.name} className="size-full object-cover" />
    )
  }

  return <FileIcon type={file.type} ext={getFileExtension(file.name)} />
}
