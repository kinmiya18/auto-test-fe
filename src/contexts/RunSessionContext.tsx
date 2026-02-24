import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { runSession } from '../services'
import type { ApiResponse, RunSessionResult, TestResultData } from '../types'

/* ── Context shape ────────────────────────────────────── */

export interface RunSessionState {
  submitting: boolean
  logs: string[]
  testResults: TestResultData | null
  startRun: (form: FormData) => void
  clearLogs: () => void
}

const RunSessionCtx = createContext<RunSessionState | null>(null)

/* ── Hook ─────────────────────────────────────────────── */

// eslint-disable-next-line react-refresh/only-export-components
export function useRunSession(): RunSessionState {
  const ctx = useContext(RunSessionCtx)
  if (!ctx) throw new Error('useRunSession must be used within RunSessionProvider')
  return ctx
}

/* ── Helpers ──────────────────────────────────────────── */

function extractTestResults(data: RunSessionResult): TestResultData | null {
  if (!data.results?.length && data.totalSessions == null) return null

  const total = data.totalSessions ?? 0
  const passed = data.passedSessions ?? 0
  const failed = data.failedSessions ?? 0
  const none = total - passed - failed

  /* Build a map: rowIndex → { result, message } */
  const resultsByRow = new Map<number, { result: string; message: string }>()
  for (const r of data.results ?? []) {
    resultsByRow.set(r.rowIndex, {
      result: r.ok ? 'PASS' : 'FAIL',
      message: r.message,
    })
  }

  return { total, passed, failed, none, resultsByRow }
}

/* ── Provider ─────────────────────────────────────────── */

export function RunSessionProvider({ children }: { children: ReactNode }) {
  const [submitting, setSubmitting] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [testResults, setTestResults] = useState<TestResultData | null>(null)
  const runningRef = useRef(false)

  const pushLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }, [])

  const startRun = useCallback(
    (form: FormData) => {
      if (runningRef.current) return
      runningRef.current = true

      setLogs([])
      setTestResults(null)
      pushLog('Uploading file and executing command... Please wait.')
      setSubmitting(true)

      runSession(form)
        .then((res: ApiResponse<RunSessionResult>) => {
          const ok = res.status?.toLowerCase() === 'success'
          if (ok || res.data) {
            pushLog('Run completed!')

            /* Extract and display test results */
            if (res.data) {
              const results = extractTestResults(res.data)
              if (results) setTestResults(results)
            }
          } else {
            pushLog(`⚠️ ${res.message ?? 'Unexpected response'}`)
          }
        })
        .catch((err: unknown) => {
          pushLog(`${err instanceof Error ? err.message : 'Unknown error'}`)
        })
        .finally(() => {
          setSubmitting(false)
          runningRef.current = false
        })
    },
    [pushLog],
  )

  const clearLogs = useCallback(() => {
    setLogs([])
    setTestResults(null)
  }, [])

  return (
    <RunSessionCtx value={{ submitting, logs, testResults, startRun, clearLogs }}>
      {children}
    </RunSessionCtx>
  )
}
