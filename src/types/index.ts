/* ── Generic API response wrapper ─────────────────────── */

export interface ApiResponse<T = unknown> {
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

/* ── Domain models ────────────────────────────────────── */

export interface Profile {
  id: string
  name?: string
  browser: string
  viewportWidth: number
  viewportHeight: number
  networkLatencyMs?: number
}

export interface SessionSummary {
  id: string
  status?: string
  startedAt?: string
  endedAt?: string
  createdAt?: string
  scenarioName?: string
  profileName?: string
}

export interface SessionDetail extends SessionSummary {
  profileId?: string
  scenarioId?: string
  dataId?: string
  url?: string
  name?: string
}

export interface Log {
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

export interface SessionRunResult {
  sessionId: string
  rowIndex: number
  ok: boolean
  message: string
}

export interface RunSessionResult {
  totalSessions?: number
  passedSessions?: number
  failedSessions?: number
  startedAt?: string
  endedAt?: string
  results?: SessionRunResult[]
  /* legacy / fallback fields */
  sessionIds?: string[]
  id?: string
  url?: string
  name?: string
}

/* ── Aggregated test result for UI ────────────────────── */

export interface TestResultData {
  total: number
  passed: number
  failed: number
  none: number
  /** rowIndex → { resultTestAuto, messageAuto } */
  resultsByRow: Map<number, { result: string; message: string }>
}
