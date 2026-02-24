import { buildUrl } from '../services/api-client'

/**
 * Convert file:///... or raw OS paths to a backend API URL
 * so that any client (even on a different machine) can fetch the artifact
 * via the server's /v1/files endpoint.
 *
 * Backend contract:
 *   GET /v1/files?path=<url-encoded-absolute-path>
 *   → streams the file with the correct Content-Type
 */
export function toViewableUrl(rawUrl: string): string {
  let filePath = rawUrl

  if (filePath.startsWith('file:///')) {
    filePath = filePath.slice('file:///'.length)
  }

  // Normalise Windows backslashes → forward slashes
  filePath = filePath.replace(/\\/g, '/')

  return buildUrl(`/v1/files?path=${encodeURIComponent(filePath)}`)
}
