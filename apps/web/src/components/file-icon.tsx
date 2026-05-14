import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export function FileAudioIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 40 40" {...props}>
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        d="M4.75 4A3.25 3.25 0 0 1 8 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 32 39.25H8A3.25 3.25 0 0 1 4.75 36z"
      />
      <path stroke="currentColor" strokeWidth={1.5} d="M24 .5V8a4 4 0 0 0 4 4h7.5" />
      <path
        stroke="#DD2590"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M16.85 28.5v-8.733c0-.362 0-.542.066-.689a.75.75 0 0 1 .269-.317c.133-.089.312-.119.668-.178l6.6-1.1c.48-.08.72-.12.908-.05a.75.75 0 0 1 .39.33c.099.172.099.416.099.904V27m-9 1.5a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0m9-1.5a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0"
      />
    </svg>
  )
}

export function FileVideoIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 40 40" {...props}>
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        d="M4.75 4A3.25 3.25 0 0 1 8 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 32 39.25H8A3.25 3.25 0 0 1 4.75 36z"
      />
      <path stroke="currentColor" strokeWidth={1.5} d="M24 .5V8a4 4 0 0 0 4 4h7.5" />
      <g clipPath="url(#video_svg__a)">
        <path
          stroke="#155EEF"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12.5 24h15m-15-3.75h3.75m7.5 0h3.75m-15 7.5h3.75m7.5 0h3.75M16.25 31.5v-15m7.5 15v-15m-7.65 15h7.8c1.26 0 1.89 0 2.372-.245.423-.216.767-.56.983-.983.245-.482.245-1.112.245-2.372v-7.8c0-1.26 0-1.89-.245-2.372a2.25 2.25 0 0 0-.983-.983C25.79 16.5 25.16 16.5 23.9 16.5h-7.8c-1.26 0-1.89 0-2.372.245-.423.216-.767.56-.983.983-.245.482-.245 1.112-.245 2.372v7.8c0 1.26 0 1.89.245 2.372.216.423.56.767.984.983.48.245 1.11.245 2.371.245"
        />
      </g>
      <defs>
        <clipPath id="video_svg__a">
          <path fill="#fff" d="M11 15h18v18H11z" />
        </clipPath>
      </defs>
    </svg>
  )
}

export function FileImageIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 40 40" {...props}>
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        d="M4.75 4A3.25 3.25 0 0 1 8 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 32 39.25H8A3.25 3.25 0 0 1 4.75 36z"
      />
      <path stroke="currentColor" strokeWidth={1.5} d="M24 .5V8a4 4 0 0 0 4 4h7.5" />
      <path
        stroke="#7F56D9"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M25.25 30.75h.758c.728 0 1.092 0 1.293-.152a.75.75 0 0 0 .296-.553c.015-.252-.187-.555-.59-1.16l-2.259-3.387c-.333-.501-.5-.751-.71-.839a.75.75 0 0 0-.575 0c-.21.088-.378.338-.712.839l-.558.837m3.057 4.415-5.763-8.325c-.332-.479-.498-.718-.705-.802a.75.75 0 0 0-.564 0c-.207.084-.373.323-.705.802l-4.46 6.442c-.422.61-.633.915-.62 1.168a.75.75 0 0 0 .293.56c.201.155.572.155 1.314.155zm1.5-11.25a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0"
      />
    </svg>
  )
}

export function FileCodeIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 40 40" {...props}>
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        d="M4.75 4A3.25 3.25 0 0 1 8 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 32 39.25H8A3.25 3.25 0 0 1 4.75 36z"
      />
      <path stroke="currentColor" strokeWidth={1.5} d="M24 .5V8a4 4 0 0 0 4 4h7.5" />
      <path
        stroke="#444CE7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M23.75 27.75 27.5 24l-3.75-3.75m-7.5 0L12.5 24l3.75 3.75m5.25-10.5-3 13.5"
      />
    </svg>
  )
}

export function FileTextIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 40 40" {...props}>
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        d="M4.75 4A3.25 3.25 0 0 1 8 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 32 39.25H8A3.25 3.25 0 0 1 4.75 36z"
      />
      <path stroke="currentColor" strokeWidth={1.5} d="M24 .5V8a4 4 0 0 0 4 4h7.5" />
      <path
        stroke="#155EEF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11.9 19.5h16.2m-16.2 3.6h16.2m-16.2 3.6h16.2m-16.2 3.6h12.6"
      />
    </svg>
  )
}

export function FileSheetIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 40 40" {...props}>
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        d="M4.75 4A3.25 3.25 0 0 1 8 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 32 39.25H8A3.25 3.25 0 0 1 4.75 36z"
      />
      <path stroke="currentColor" strokeWidth={1.5} d="M24 .5V8a4 4 0 0 0 4 4h7.5" />
      <path
        stroke="#079455"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M11.9 24.9h16.2m-16.2 0v-3.6a1.8 1.8 0 0 1 1.8-1.8h3.6m-5.4 5.4v3.6a1.8 1.8 0 0 0 1.8 1.8h3.6m10.8-5.4v3.6a1.8 1.8 0 0 1-1.8 1.8h-9m10.8-5.4v-3.6a1.8 1.8 0 0 0-1.8-1.8h-9m0 0v10.8"
      />
    </svg>
  )
}

export function FileGenericIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 40 40" {...props}>
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        d="M4.75 4A3.25 3.25 0 0 1 8 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 32 39.25H8A3.25 3.25 0 0 1 4.75 36z"
      />
      <path stroke="currentColor" strokeWidth={1.5} d="M24 .5V8a4 4 0 0 0 4 4h7.5" />
    </svg>
  )
}

export function FilePdfIcon(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 40 40" {...props}>
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        d="M4.75 4A3.25 3.25 0 0 1 8 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 32 39.25H8A3.25 3.25 0 0 1 4.75 36z"
      />
      <path stroke="currentColor" strokeWidth={1.5} d="M24 .5V8a4 4 0 0 0 4 4h7.5" />
      <path
        fill="#D92D20"
        d="M25.709 25.344c-1.123 0-2.528.196-2.988.265-1.903-1.987-2.444-3.117-2.566-3.418.165-.424.74-2.034.821-4.103.04-1.036-.178-1.81-.65-2.3a1.7 1.7 0 0 0-1.205-.528c-.573 0-1.535.29-1.535 2.231 0 1.685.785 3.472 1.002 3.934-1.144 3.33-2.372 5.61-2.632 6.08C11.359 29.234 11 30.907 11 31.381c0 .852.607 1.361 1.623 1.361 2.47 0 4.724-4.146 5.097-4.866 1.754-.7 4.102-1.132 4.698-1.235 1.712 1.63 3.692 2.066 4.515 2.066.618 0 2.067 0 2.067-1.49 0-1.383-1.773-1.874-3.291-1.874m-.12.978c1.335 0 1.687.441 1.687.674 0 .147-.055.624-.77.624-.641 0-1.748-.37-2.838-1.174.454-.06 1.127-.124 1.922-.124m-6.538-10.114c.121 0 .202.039.268.13.383.533.074 2.272-.303 3.634-.363-1.167-.636-2.959-.252-3.589.075-.123.16-.175.287-.175m-.648 10.42c.483-.976 1.024-2.398 1.319-3.202.59.987 1.384 1.904 1.843 2.402-1.43.3-2.51.602-3.162.8m-6.444 4.884c-.031-.037-.036-.117-.012-.212.05-.2.434-1.193 3.214-2.436-.398.627-1.02 1.523-1.704 2.192-.48.45-.856.678-1.113.678-.092 0-.22-.025-.385-.222"
      />
    </svg>
  )
}

export function FileIcon({
  type,
  ext,
  ...props
}: IconProps & {
  type: string
  ext: string
}) {
  if (type.startsWith('video/')) return <FileVideoIcon {...props} />
  else if (type.startsWith('audio/')) return <FileAudioIcon {...props} />
  else if (type.startsWith('image/')) return <FileImageIcon {...props} />

  if (ext === 'pdf') return <FilePdfIcon {...props} />
  else if (ext === 'xlsx' || ext === 'xls') return <FileSheetIcon {...props} />

  if (type.startsWith('text/') || ['txt', 'md', 'rtf', 'doc', 'docx'].includes(ext)) {
    return <FileTextIcon {...props} />
  }
  if (
    [
      'html',
      'css',
      'js',
      'jsx',
      'ts',
      'tsx',
      'json',
      'xml',
      'php',
      'py',
      'rb',
      'java',
      'c',
      'cpp',
      'cs'
    ].includes(ext)
  ) {
    return <FileCodeIcon {...props} />
  }

  return <FileGenericIcon {...props} />
}
