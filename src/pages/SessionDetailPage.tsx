import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchSessionById, fetchLogs, fetchProfiles } from '../services'
import { StatusBadge } from '../components'
import { formatDate, toViewableUrl, formatProfile } from '../utils'
import type { SessionDetail, Log, Profile } from '../types'

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<SessionDetail | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [matchedProfile, setMatchedProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    Promise.all([fetchSessionById(id), fetchLogs(id), fetchProfiles()])
      .then(([sess, logList, profiles]) => {
        if (cancelled) return
        setSession(sess)
        setLogs(logList.filter((l) => l.no !== 0))

        /* Resolve profile from profileId */
        if (sess.profileId) {
          const match = profiles.find((p: Profile) => p.id === sess.profileId)
          setMatchedProfile(match ?? null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  /* ── Loading / Error / Empty states ─────────── */

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Loading…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-box">{error}</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="page">
        <div className="empty">Session not found</div>
      </div>
    )
  }

  /* ── Main render ────────────────────────────── */

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-sm btn-ghost mb-sm" onClick={() => navigate('/sessions')}>
          ← Back
        </button>
        <h1>Session Detail</h1>
      </div>

      {/* Session info */}
      <div className="card detail-grid">
        <div className="detail-item">
          <span className="detail-label">Status</span>
          <StatusBadge status={session.status} />
        </div>
        <div className="detail-item">
          <span className="detail-label">Profile</span>
          <span className="detail-value">
            {matchedProfile
              ? formatProfile(matchedProfile)
              : (session.profileName ?? '—')}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Started</span>
          <span className="detail-value">{formatDate(session.startedAt ?? session.createdAt)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Ended</span>
          <span className="detail-value">{formatDate(session.endedAt)}</span>
        </div>
      </div>

      {/* Logs */}
      <h2 className="mt-lg mb-md">Logs ({logs.length})</h2>

      {logs.length === 0 ? (
        <div className="empty">No logs recorded for this session.</div>
      ) : (
        <div className="table-wrap table-wrap-scroll">
          <table className="table-logs">
            <thead>
              <tr>
                <th>#</th>
                <th>Action</th>
                <th>Duration</th>
                <th>Element</th>
                <th>Value</th>
                <th>Message</th>
                <th>Status</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={log.id ?? idx}>
                  <td>{log.no ?? idx + 1}</td>
                  <td className="cell-action">
                    {log.url ? (
                      <a
                        href={toViewableUrl(log.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-link"
                        title="Click to view screenshot"
                      >
                        <code>{log.action ?? '—'}</code>
                      </a>
                    ) : (
                      <code>{log.action ?? '—'}</code>
                    )}
                  </td>
                  <td>{log.durationSeconds != null ? `${log.durationSeconds}s` : '—'}</td>
                  <td className="cell-element">
                    <code>{log.element ?? '—'}</code>
                  </td>
                  <td>{log.value ?? '—'}</td>
                  <td>{log.message ?? '—'}</td>
                  <td>
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="cell-location">
                    {log.page ? (
                      <a href={log.page} target="_blank" rel="noopener noreferrer">
                        {log.page}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
