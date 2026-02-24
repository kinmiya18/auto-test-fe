import type { ApiResponse } from '../types'

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export function buildUrl(path: string): string {
  return BASE_URL ? `${BASE_URL}${path}` : path
}

export async function parseJson<T>(res: Response): Promise<ApiResponse<T>> {
  const contentType = res.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return (await res.json()) as ApiResponse<T>
  }

  const text = await res.text()
  return { status: 'FAILED', message: text || `HTTP ${res.status}` } as ApiResponse<T>
}
