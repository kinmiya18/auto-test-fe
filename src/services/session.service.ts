import type { ApiResponse, RunSessionResult, SessionDetail, SessionSummary } from '../types'
import { buildUrl, parseJson } from './api-client'

export async function fetchSessions(
  page = 0,
  size = 20,
): Promise<{ data: SessionSummary[]; total: number }> {
  const res = await fetch(
    buildUrl(`/v1/sessions?page=${page}&size=${size}&sortBy=createdDate&sortDir=desc`),
  )
  const body = await parseJson<SessionSummary[]>(res)

  if (!res.ok) throw new Error(body.message ?? `Failed (${res.status})`)

  return {
    data: Array.isArray(body.data) ? body.data : [],
    total: body.metadata?.total ?? 0,
  }
}

export async function fetchSessionById(id: string): Promise<SessionDetail> {
  const res = await fetch(buildUrl(`/v1/sessions/${id}`))
  const body = await parseJson<SessionDetail>(res)

  if (!res.ok) throw new Error(body.message ?? `Failed (${res.status})`)
  if (!body.data) throw new Error('Session not found')

  return body.data
}

export async function runSession(form: FormData): Promise<ApiResponse<RunSessionResult>> {
  const res = await fetch(buildUrl('/v1/sessions/run'), { method: 'POST', body: form })
  const body = await parseJson<RunSessionResult>(res)

  if (!res.ok) throw new Error(body.message ?? `Request failed (${res.status})`)

  return body
}
