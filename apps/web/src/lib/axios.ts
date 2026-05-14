import axios from 'axios'

export const HTTP_REQUESTS_TIMEOUT = 20 * 1000

const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/
function transformResponseDates(data: any): any {
  try {
    if (typeof data !== 'string') return data
    return JSON.parse(data, (_key, value) =>
      typeof value === 'string' && isoDateRegex.test(value) ? new Date(value) : value
    )
  } catch {
    return data
  }
}

export const http = axios.create({
  timeout: HTTP_REQUESTS_TIMEOUT,
  baseURL: import.meta.env.VITE_SERVER_URL,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  transformResponse: [transformResponseDates]
})
