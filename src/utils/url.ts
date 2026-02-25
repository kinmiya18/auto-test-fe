import { buildUrl } from '../services/api-client'

/**
 * Convert various URL formats to a viewable backend URL.
 *
 * Supported input formats:
 *   - Full HTTP(S) URL: returned as-is
 *   - Relative API path (e.g., /v1/ftps/view/...): prepend BASE_URL
 *   - file:/// URLs or OS paths: extract date/filename for /v1/ftps/view endpoint
 */
export function toViewableUrl(rawUrl: string): string {
  // Already a full HTTP(S) URL → return as-is
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl
  }

  // Already a relative API path → prepend base URL
  if (rawUrl.startsWith('/v1/')) {
    return buildUrl(rawUrl)
  }

  // Handle file:/// URLs
  let filePath = rawUrl
  if (filePath.startsWith('file:///')) {
    filePath = filePath.slice('file:///'.length)
  }

  // Normalise Windows backslashes → forward slashes
  filePath = filePath.replace(/\\/g, '/')

  // Try to extract date folder and filename from path
  // Expected format: .../YYYY-MM-DD/filename.png
  const match = filePath.match(/(\d{4}-\d{2}-\d{2})\/([^/]+)$/)
  if (match) {
    const [, date, filename] = match
    return buildUrl(`/v1/ftps/view/${date}/${filename}`)
  }

  // Fallback: just use the filename
  const parts = filePath.split('/')
  const filename = parts[parts.length - 1]
  return buildUrl(`/v1/ftps/view/${filename}`)
}
