const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

function url(path: string): string {
  return BASE ? `${BASE}${path}` : path
}

/* ── Generic response wrapper ─────────────────────────── */

export type BaseResponse<T = unknown> = {
  status?: 'SUCCESS' | 'FAILED' | string
  message?: string
  data?: T
  metadata?: {
    code?: number
    requestId?: string
    timestamp?: string
    page?: number
    size?: number
    total?: number
  }
}

/* ── Domain types ─────────────────────────────────────── */

export type Profile = {
  id: string
  name?: string
  browser: string
  viewportWidth: number
  viewportHeight: number
  networkLatencyMs?: number
}

export type SessionSummary = {
  id: string
  status?: string
  startedAt?: string
  endedAt?: string
  createdAt?: string
  scenarioName?: string
  profileName?: string
}

export type SessionDetail = SessionSummary & {
  profileId?: string
  scenarioId?: string
  dataId?: string
  url?: string
  name?: string
}

export type Log = {
  id?: string
  no?: number
  action?: string
  element?: string
  value?: string
  message?: string
  status?: string
  createdAt?: string
  url?: string
}

export type RunSessionResult = {
  scenarioId?: string
  dataId?: string
  createdSessions?: number
  sessionIds?: string[]
  // fallback fields from the old single-session response
  id?: string
  url?: string
  name?: string
}

/* ── API helpers ──────────────────────────────────────── */

async function parseJson<T>(res: Response): Promise<BaseResponse<T>> {
  const ct = res.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    return (await res.json()) as BaseResponse<T>
  }
  const text = await res.text()
  return { status: 'FAILED', message: text || `HTTP ${res.status}` } as BaseResponse<T>
}

export async function fetchProfiles(): Promise<Profile[]> {
  const res = await fetch(url('/v1/profiles'))
  const body = await parseJson<Profile[]>(res)
  if (!res.ok) throw new Error(body.message ?? `Failed (${res.status})`)
  return Array.isArray(body.data) ? body.data : []
}

export async function fetchSessions(page = 0, size = 20): Promise<{ data: SessionSummary[]; total: number }> {
  const res = await fetch(url(`/v1/sessions?page=${page}&size=${size}&sortBy=createdDate&sortDir=desc`))
  const body = await parseJson<SessionSummary[]>(res)
  if (!res.ok) throw new Error(body.message ?? `Failed (${res.status})`)
  return {
    data: Array.isArray(body.data) ? body.data : [],
    total: body.metadata?.total ?? 0,
  }
}

export async function fetchSessionById(id: string): Promise<SessionDetail> {
  const res = await fetch(url(`/v1/sessions/${id}`))
  const body = await parseJson<SessionDetail>(res)
  if (!res.ok) throw new Error(body.message ?? `Failed (${res.status})`)
  if (!body.data) throw new Error('Session not found')
  return body.data
}

export async function fetchLogs(sessionId: string): Promise<Log[]> {
  const res = await fetch(url(`/v1/logs?sessionId=${sessionId}&page=0&size=500&sortBy=createdDate&sortDir=asc`))
  const body = await parseJson<Log[]>(res)
  if (!res.ok) throw new Error(body.message ?? `Failed (${res.status})`)
  return Array.isArray(body.data) ? body.data : []
}

export async function runSession(form: FormData): Promise<BaseResponse<RunSessionResult>> {
  const res = await fetch(url('/v1/sessions/run'), { method: 'POST', body: form })
  const body = await parseJson<RunSessionResult>(res)
  if (!res.ok) throw new Error(body.message ?? `Request failed (${res.status})`)
  return body
}
