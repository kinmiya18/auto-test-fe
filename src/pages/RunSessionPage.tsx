import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProfiles } from '../services'
import { useRunSession } from '../contexts/RunSessionContext'
import { LogConsole, TestResultPanel, ExcelPreview } from '../components'
import { RUN_MODES, FILE_FIELDS } from '../constants'
import type { ParsedSheet } from '../utils'
import type { Profile } from '../types'

/** Columns that get filled by the test runner */
const RESULT_COLUMNS = ['resultTestAuto', 'messageAuto'] as const

export default function RunSessionPage() {
  const navigate = useNavigate()
  const {
    submitting, logs, testResults, startRun,
    mode, setMode,
    files, handleFileChange,
    sheetName, handleSheetNameChange,
    startRow, setStartRow,
    endRow, setEndRow,
    profileId, setProfileId,
    profileSearch, setProfileSearch,
    dataPreview, previewError,
  } = useRunSession()

  const showRows = mode === 'limited' || mode === 'limited-login'

  /* ── Profiles (local UI state) ──────────────── */
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  function profileLabel(p: Profile) {
    return `${p.name ? `${p.name} – ` : ''}${p.browser} – ${p.viewportWidth}×${p.viewportHeight}`
  }

  const filteredProfiles = useMemo(() => {
    const q = profileSearch.toLowerCase()
    return q ? profiles.filter((p) => profileLabel(p).toLowerCase().includes(q)) : profiles
  }, [profiles, profileSearch])

  /* Close dropdown when clicking outside */
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  /* ── Merged preview ─────────────────────────── */

  /**
   * Merge uploaded Excel rows with test results from the API.
   * After a run, `resultTestAuto` and `messageAuto` columns get filled
   * using the `rowIndex` from the API response.
   */
  const mergedPreview = useMemo<ParsedSheet | null>(() => {
    if (!dataPreview) return null

    /* Ensure result columns exist in header list */
    const headers = [...dataPreview.headers]
    for (const col of RESULT_COLUMNS) {
      if (!headers.includes(col)) headers.push(col)
    }

    const resultsByRow = testResults?.resultsByRow
    const rows = dataPreview.rows.map((row, idx) => {
      const merged = { ...row }
      /* rowIndex from API is 1-based, matching Excel row order */
      const rowResult = resultsByRow?.get(idx + 1)
      if (rowResult) {
        merged['resultTestAuto'] = rowResult.result
        merged['messageAuto'] = rowResult.message
      } else {
        /* Keep original values (or empty) */
        merged['resultTestAuto'] = row['resultTestAuto'] ?? ''
        merged['messageAuto'] = row['messageAuto'] ?? ''
      }
      return merged
    })

    return { headers, rows }
  }, [dataPreview, testResults])

  /* ── Load profiles on mount ─────────────────── */
  useEffect(() => {
    fetchProfiles()
      .then((data) => {
        setProfiles(data)
      })
      .catch(() => setProfiles([]))
      .finally(() => setProfilesLoading(false))
  }, [])

  /* ── Handlers ───────────────────────────────── */

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!profileId) return

    const missingFiles = FILE_FIELDS.filter((f) => !files[f.key])
    if (missingFiles.length > 0) return

    const trimmedSheet = sheetName.trim()
    if (!trimmedSheet) return

    const form = new FormData()
    form.append('profileId', profileId)

    for (const f of FILE_FIELDS) {
      form.append(f.key, files[f.key]!)
    }

    form.append('sheetName', trimmedSheet)

    if (showRows) {
      if (startRow.trim()) form.append('startRow', startRow.trim())
      if (endRow.trim()) form.append('endRow', endRow.trim())
    }

    if (mode === 'limited-login') {
      form.append('loginOneTime', 'true')
    }

    startRun(form)
  }

  /* ── Render ─────────────────────────────────── */

  return (
    <div className="page">
      {/* Select Test Case Type */}
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

      {/* Enter Parameters */}
      <section className="section">
        <h2 className="section-title">Enter Parameters:</h2>

        <form onSubmit={handleSubmit}>
          <fieldset disabled={submitting} className="param-fields">
            {/* Profile */}
            <div className="field" ref={profileRef}>
              <label className="field-label">Profile:</label>
              {profilesLoading ? (
                <span className="field-hint">Loading profiles…</span>
              ) : profiles.length === 0 ? (
                <span className="field-hint field-hint-error">No profiles found</span>
              ) : (
                <div className="profile-combobox">
                  <input
                    className="field-input"
                    value={profileSearch}
                    onChange={(e) => {
                      setProfileSearch(e.target.value)
                      setProfileOpen(true)
                    }}
                    onFocus={() => setProfileOpen(true)}
                    placeholder="Search profile…"
                    autoComplete="off"
                  />
                  {profileOpen && filteredProfiles.length > 0 && (
                    <ul className="profile-dropdown">
                      {filteredProfiles.map((p) => (
                        <li
                          key={p.id}
                          className={`profile-option${p.id === profileId ? ' profile-option-active' : ''}`}
                          onMouseDown={() => {
                            setProfileId(p.id)
                            setProfileSearch(profileLabel(p))
                            setProfileOpen(false)
                          }}
                        >
                          {profileLabel(p)}
                        </li>
                      ))}
                    </ul>
                  )}
                  {profileOpen && filteredProfiles.length === 0 && (
                    <ul className="profile-dropdown">
                      <li className="profile-option profile-option-empty">No results</li>
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* File uploads */}
            {FILE_FIELDS.map((f) => (
              <div className="field" key={f.key}>
                <label className="field-label">{f.label}:</label>
                {files[f.key] ? (
                  <span className="file-chip">
                    <span className="file-chip-name">{files[f.key]!.name}</span>
                    <button
                      type="button"
                      className="file-chip-remove"
                      onClick={() => handleFileChange(f.key, null)}
                      title="Xoá file"
                    >×</button>
                  </span>
                ) : (
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => handleFileChange(f.key, e.target.files?.[0] ?? null)}
                  />
                )}
              </div>
            ))}

            {/* Sheet name */}
            <div className="field">
              <label className="field-label">Sheet Data:</label>
              <input
                className="field-input"
                value={sheetName}
                onChange={(e) => handleSheetNameChange(e.target.value)}
                placeholder="e.g. NEW"
              />
            </div>

            {/* Row range (conditional) */}
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

            {/* Actions */}
            <div className="field-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Running…' : 'Run'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={submitting}
                onClick={() => navigate('/history')}
              >
                Session History
              </button>
            </div>
          </fieldset>
        </form>
      </section>

      {/* Log Console */}
      <section className="section">
        <h2 className="section-title log-title">Log Console:</h2>
        <LogConsole logs={logs} />
      </section>

      {/* Test Summary (after run) */}
      {testResults && (
        <section className="section">
          <TestResultPanel data={testResults} />
        </section>
      )}

      {/* Data File Preview — merged with test results when available */}
      {previewError && (
        <section className="section">
          <div className="error-box">{previewError}</div>
        </section>
      )}
      {mergedPreview && mergedPreview.rows.length > 0 && (
        <section className="section">
          <ExcelPreview
            headers={mergedPreview.headers}
            rows={mergedPreview.rows}
            title="Excel Content Preview:"
          />
        </section>
      )}
    </div>
  )
}
