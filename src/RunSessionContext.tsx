import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { runSession as apiRunSession, type BaseResponse, type RunSessionResult } from './api'

export interface RunSessionState {
  submitting: boolean
  logs: string[]
  startRun: (form: FormData) => void
  clearLogs: () => void
}

const Ctx = createContext<RunSessionState | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useRunSession(): RunSessionState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRunSession must be used within RunSessionProvider')
  return ctx
}

export function RunSessionProvider({ children }: { children: ReactNode }) {
  const [submitting, setSubmitting] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  /* keep a ref so the async callback always writes to the latest state */
  const pushLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }, [])

  /* guard against overlapping runs */
  const runningRef = useRef(false)

  const startRun = useCallback(
    (form: FormData) => {
      if (runningRef.current) return
      runningRef.current = true

      setLogs([])
      pushLog('Uploading files and executing command… Please wait.')
      setSubmitting(true)

      apiRunSession(form)
        .then((res: BaseResponse<RunSessionResult>) => {
          if (res.status === 'SUCCESS' || res.data) {
            pushLog('✅ Session created successfully!')
            if (res.data?.sessionIds?.length) {
              pushLog(`Session IDs: ${res.data.sessionIds.join(', ')}`)
            } else if (res.data?.id) {
              pushLog(`Session ID: ${res.data.id}`)
            }
            pushLog(JSON.stringify(res.data ?? res, null, 2))
          } else {
            pushLog(`⚠️ ${res.message ?? 'Unexpected response'}`)
            pushLog(JSON.stringify(res, null, 2))
          }
        })
        .catch((err: unknown) => {
          pushLog(`❌ ${err instanceof Error ? err.message : 'Unknown error'}`)
        })
        .finally(() => {
          setSubmitting(false)
          runningRef.current = false
        })
    },
    [pushLog],
  )

  const clearLogs = useCallback(() => setLogs([]), [])

  return <Ctx value={{ submitting, logs, startRun, clearLogs }}>{children}</Ctx>
}
