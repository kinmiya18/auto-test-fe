import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { runSession } from '../services'
import type { ApiResponse, RunSessionResult, TestResultData } from '../types'
import type { RunMode } from '../constants'
import { FILE_FIELDS } from '../constants'
import { parseExcelFile, type ParsedSheet } from '../utils'

/* ── Context shape ────────────────────────────────────── */

export interface RunSessionState {
  /* run state */
  submitting: boolean
  logs: string[]
  testResults: TestResultData | null
  startRun: (form: FormData) => void
  clearLogs: () => void

  /* form state (persisted across navigation) */
  mode: RunMode
  setMode: (m: RunMode) => void
  files: Record<string, File | null>
  handleFileChange: (key: string, file: File | null) => void
  sheetName: string
  setSheetName: (v: string) => void
  handleSheetNameChange: (v: string) => void
  startRow: string
  setStartRow: (v: string) => void
  endRow: string
  setEndRow: (v: string) => void
  profileId: string
  setProfileId: (v: string) => void
  profileSearch: string
  setProfileSearch: (v: string) => void
  dataPreview: ParsedSheet | null
  previewError: string | null
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
  /* Run state */
  const [submitting, setSubmitting] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [testResults, setTestResults] = useState<TestResultData | null>(null)
  const runningRef = useRef(false)

  /* Form state (preserved across navigation) */
  const [mode, setMode] = useState<RunMode>('sequential')
  const [files, setFiles] = useState<Record<string, File | null>>(
    Object.fromEntries(FILE_FIELDS.map((f) => [f.key, null])),
  )
  const [sheetName, setSheetName] = useState('')
  const [startRow, setStartRow] = useState('')
  const [endRow, setEndRow] = useState('')
  const [profileId, setProfileId] = useState('')
  const [profileSearch, setProfileSearch] = useState('')
  const [dataPreview, setDataPreview] = useState<ParsedSheet | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

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

  /* File change handler */
  const handleFileChange = useCallback((key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }))

    if (key === 'dataTestFile') {
      if (!file) {
        setDataPreview(null)
        setPreviewError(null)
        return
      }
      parseExcelFile(file)
        .then((parsed) => {
          setDataPreview(parsed)
          setPreviewError(null)
        })
        .catch(() => {
          setDataPreview(null)
          setPreviewError('Cannot read Excel file')
        })
    }
  }, [])

  /* Sheet name change handler */
  const handleSheetNameChange = useCallback((value: string) => {
    setSheetName(value)

    setFiles((prev) => {
      const dataFile = prev['dataTestFile']
      if (!dataFile) return prev

      parseExcelFile(dataFile, value.trim() || undefined)
        .then((parsed) => {
          setDataPreview(parsed)
          setPreviewError(null)
        })
        .catch(() => {
          setDataPreview(null)
          setPreviewError('Cannot read Excel file')
        })

      return prev
    })
  }, [])

  return (
    <RunSessionCtx value={{
      submitting, logs, testResults, startRun, clearLogs,
      mode, setMode,
      files, handleFileChange,
      sheetName, setSheetName, handleSheetNameChange,
      startRow, setStartRow,
      endRow, setEndRow,
      profileId, setProfileId,
      profileSearch, setProfileSearch,
      dataPreview, previewError,
    }}>
      {children}
    </RunSessionCtx>
  )
}
