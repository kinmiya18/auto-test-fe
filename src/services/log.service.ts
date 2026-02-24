import type { Log } from '../types'
import { buildUrl, parseJson } from './api-client'

export async function fetchLogs(sessionId: string): Promise<Log[]> {
  const res = await fetch(
    buildUrl(`/v1/logs?sessionId=${sessionId}&page=0&size=500&sortBy=createdDate&sortDir=asc`),
  )
  const body = await parseJson<Log[]>(res)

  if (!res.ok) throw new Error(body.message ?? `Failed (${res.status})`)

  return Array.isArray(body.data) ? body.data : []
}
