import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProfiles, type Profile } from './api'
import { useRunSession } from './RunSessionContext'

type RunMode = 'sequential' | 'limited' | 'limited-login'

const RUN_MODES: { key: RunMode; label: string }[] = [
  { key: 'sequential', label: 'Run Sequential Test Cases' },
  { key: 'limited', label: 'Run Sequential Test Cases (Limited Rows)' },
  { key: 'limited-login', label: 'Run Sequential Test Cases (Limited Rows) – Login One Time' },
]

const FILE_FIELDS = [
  { key: 'dictionaryFile', label: 'Upload Dictionary File' },
  { key: 'actionFile', label: 'Upload Action File' },
  { key: 'dataTestFile', label: 'Upload Data File' },
] as const

export default function RunSessionPage() {
  const navigate = useNavigate()
  const { submitting, logs, startRun } = useRunSession()

  /* ── profiles ─────────────────────────────── */
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [profileId, setProfileId] = useState('')

  /* ── mode ──────────────────────────────────── */
  const [mode, setMode] = useState<RunMode>('sequential')
  const showRows = mode === 'limited' || mode === 'limited-login'

  /* ── form fields ──────────────────────────── */
  const [files, setFiles] = useState<Record<string, File | null>>(
    Object.fromEntries(FILE_FIELDS.map((f) => [f.key, null])),
  )
  const [sheetName, setSheetName] = useState('')
  const [startRow, setStartRow] = useState('')
  const [endRow, setEndRow] = useState('')

  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProfiles()
      .then((data) => {
        setProfiles(data)
        if (data.length > 0) setProfileId(data[0].id)
      })
      .catch(() => setProfiles([]))
      .finally(() => setProfilesLoading(false))
  }, [])

  /* auto‑scroll log console */
  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight)
  }, [logs])

  function setFile(key: string, file: File | null) {
    setFiles((prev) => ({ ...prev, [key]: file }))
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!profileId) return
    const missing = FILE_FIELDS.filter((f) => !files[f.key])
    if (missing.length > 0) return

    const trimmedSheet = sheetName.trim()
    if (!trimmedSheet) return

    const form = new FormData()
    form.append('profileId', profileId)
    for (const f of FILE_FIELDS) form.append(f.key, files[f.key]!)
    form.append('sheetName', trimmedSheet)

    if (showRows) {
      if (startRow.trim()) form.append('startRow', startRow.trim())
      if (endRow.trim()) form.append('endRow', endRow.trim())
    }
    if (mode === 'limited-login') form.append('loginOneTime', 'true')

    startRun(form)
  }

  return (
    <div className="page">
      {/* ── Select Test Case Type ────────────── */}
      <section className="section">
        <h2 className="section-title">Select Test Case Type:</h2>
        <div className="mode-buttons">
          {RUN_MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              className={`btn btn-mode${mode === m.key ? ' btn-mode-active' : ''}`}
              onClick={() => setMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Enter Parameters ─────────────────── */}
      <section className="section">
        <h2 className="section-title">Enter Parameters:</h2>

        <form onSubmit={onSubmit}>
          <fieldset disabled={submitting} className="param-fields">
            {/* Profile */}
            <div className="field">
              <label className="field-label">Profile:</label>
              {profilesLoading ? (
                <span className="field-hint">Loading profiles…</span>
              ) : profiles.length === 0 ? (
                <span className="field-hint field-hint-error">No profiles found</span>
              ) : (
                <select
                  className="field-input"
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.browser} – {p.viewportWidth} × {p.viewportHeight}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* File uploads */}
            {FILE_FIELDS.map((f) => (
              <div className="field" key={f.key}>
                <label className="field-label">{f.label}:</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(f.key, e.target.files?.[0] ?? null)}
                />
              </div>
            ))}

            {/* Sheet + rows */}
            <div className="field">
              <label className="field-label">Sheet Data:</label>
              <input
                className="field-input"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="e.g. NEW"
              />
            </div>

            {showRows && (
              <>
                <div className="field">
                  <label className="field-label">Start Row:</label>
                  <input
                    className="field-input"
                    inputMode="numeric"
                    value={startRow}
                    onChange={(e) => setStartRow(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="field">
                  <label className="field-label">End Row:</label>
                  <input
                    className="field-input"
                    inputMode="numeric"
                    value={endRow}
                    onChange={(e) => setEndRow(e.target.value)}
                    placeholder="200"
                  />
                </div>
              </>
            )}

            <div className="field-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Running…' : 'Run'}
              </button>
              <button type="button" className="btn btn-ghost" disabled={submitting} onClick={() => navigate('/sessions')}>
                Lịch sử test
              </button>
            </div>
          </fieldset>
        </form>
      </section>

      {/* ── Log Console ──────────────────────── */}
      <section className="section">
        <h2 className="section-title log-title">Log Console:</h2>
        <div className="log-console" ref={logRef}>
          {logs.length === 0
            ? <span className="log-placeholder">Logs will appear here after you run</span>
            : logs.map((line, i) => <div key={i} className="log-line">{line}</div>)}
        </div>
      </section>
    </div>
  )
}
