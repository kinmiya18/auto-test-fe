import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchSessions, type SessionSummary } from './api'

const PAGE_SIZE = 20

function fmtDate(d?: string) {
  if (!d) return '—'
  try { return new Date(d).toLocaleString() } catch { return d }
}

export default function SessionsPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = useCallback((p: number) => {
    setLoading(true)
    setError(null)
    fetchSessions(p, PAGE_SIZE)
      .then((res) => {
        setSessions(res.data)
        setTotal(res.total)
        setPage(p)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(0) }, [load]) // eslint-disable-line react-hooks/set-state-in-effect

  return (
    <div className="page">
      <div className="page-header">
        <h1>Lịch sử test</h1>
        <p className="page-sub">All test sessions ordered by newest first</p>
      </div>

      {loading && <div className="loading">Loading sessions…</div>}
      {error && <div className="error-box">{error}</div>}

      {!loading && !error && sessions.length === 0 && (
        <div className="empty">No sessions found.</div>
      )}

      {sessions.length > 0 && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Scenario</th>
                  <th>Profile</th>
                  <th>Started</th>
                  <th>Ended</th>
                  <th className="th-action">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td><span className={`badge badge-${(s.status ?? 'unknown').toLowerCase()}`}>{s.status ?? '—'}</span></td>
                    <td>{s.scenarioName ?? '—'}</td>
                    <td>{s.profileName ?? '—'}</td>
                    <td className="cell-date">{fmtDate(s.startedAt ?? s.createdAt)}</td>
                    <td className="cell-date">{fmtDate(s.endedAt)}</td>
                    <td>
                      <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/sessions/${s.id}`)}>
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button className="btn btn-sm btn-ghost" disabled={page === 0} onClick={() => load(page - 1)}>
              ← Prev
            </button>
            <span className="pagination-info">
              Page {page + 1} / {totalPages} ({total} total)
            </span>
            <button className="btn btn-sm btn-ghost" disabled={page + 1 >= totalPages} onClick={() => load(page + 1)}>
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
