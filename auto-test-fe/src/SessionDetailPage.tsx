import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchSessionById, fetchLogs, type SessionDetail, type Log } from './api'

function fmtDate(d?: string) {
  if (!d) return '—'
  try { return new Date(d).toLocaleString() } catch { return d }
}

/** Convert file:///C:/... or raw Windows paths (C:\...) to /local-file/C:/... so the Vite proxy can serve them */
function toViewableUrl(rawUrl: string): string {
  if (rawUrl.startsWith('file:///')) {
    return '/local-file/' + rawUrl.slice('file:///'.length)
  }
  // Raw Windows path like C:\Users\... or C:/Users/...
  if (/^[A-Za-z]:[/\\]/.test(rawUrl)) {
    return '/local-file/' + rawUrl.replace(/\\/g, '/')
  }
  return rawUrl
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<SessionDetail | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    Promise.all([fetchSessionById(id), fetchLogs(id)])
      .then(([sess, logList]) => {
        if (cancelled) return
        setSession(sess)
        setLogs(logList.filter((l) => l.no !== 0))
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed')
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [id])

  if (loading) return <div className="page"><div className="loading">Loading…</div></div>
  if (error) return <div className="page"><div className="error-box">{error}</div></div>
  if (!session) return <div className="page"><div className="empty">Session not found</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-sm btn-ghost" onClick={() => navigate('/sessions')} style={{ marginBottom: 8 }}>
          ← Back
        </button>
        <h1>Session Detail</h1>
      </div>

      {/* Session info */}
      <div className="card detail-grid">
        <div className="detail-item">
          <span className="detail-label">Status</span>
          <span className={`badge badge-${(session.status ?? 'unknown').toLowerCase()}`}>{session.status ?? '—'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Started</span>
          <span className="detail-value">{fmtDate(session.startedAt ?? session.createdAt)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Ended</span>
          <span className="detail-value">{fmtDate(session.endedAt)}</span>
        </div>
      </div>

      {/* Logs */}
      <h2 style={{ marginTop: 24, marginBottom: 12 }}>Logs ({logs.length})</h2>

      {logs.length === 0 ? (
        <div className="empty">No logs recorded for this session.</div>
      ) : (
        <div className="table-wrap">
          <table className="table-logs">
            <thead>
              <tr>
                <th>#</th>
                <th>Action</th>
                <th>Element</th>
                <th>Value</th>
                <th>Message</th>
                <th>Status</th>
                <th>URL</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={log.id ?? idx}>
                  <td>{log.no ?? idx + 1}</td>
                  <td><code>{log.action ?? '—'}</code></td>
                  <td className="cell-element"><code>{log.element ?? '—'}</code></td>
                  <td>{log.value ?? '—'}</td>
                  <td>{log.message ?? '—'}</td>
                  <td><span className={`badge badge-${(log.status ?? 'unknown').toLowerCase()}`}>{log.status ?? '—'}</span></td>
                  <td>
                    {log.url ? (
                      <a href={toViewableUrl(log.url)} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost">
                        🖼 Xem ảnh
                      </a>
                    ) : '—'}
                  </td>
                  <td className="cell-date">{fmtDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
