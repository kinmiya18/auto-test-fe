import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchSessions, fetchProfiles } from '../services'
import { StatusBadge, Pagination } from '../components'
import { formatDate } from '../utils'
import { PAGE_SIZE } from '../constants'
import type { Profile, SessionSummary } from '../types'

export default function SessionsPage() {
  const navigate = useNavigate()

  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ── Profiles lookup ─────────────────────────── */
  const [profiles, setProfiles] = useState<Profile[]>([])

  useEffect(() => {
    fetchProfiles()
      .then(setProfiles)
      .catch(() => setProfiles([]))
  }, [])

  const profileMap = useMemo(
    () => new Map(profiles.map((p) => [p.id, p.name ?? p.browser ?? p.id])),
    [profiles],
  )

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  /* Fetch sessions for a given page */
  function loadPage(p: number) {
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
  }

  /* Initial load — state defaults already match (loading=true, error=null) */
  useEffect(() => {
    fetchSessions(0, PAGE_SIZE)
      .then((res) => {
        setSessions(res.data)
        setTotal(res.total)
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Session History</h1>
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
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td>{s.scenarioName ?? '—'}</td>
                    <td>
                      {s.profileName
                        ?? (s.profileId ? profileMap.get(s.profileId) : undefined)
                        ?? '—'}
                    </td>
                    <td className="cell-date">{formatDate(s.startedAt ?? s.createdAt)}</td>
                    <td className="cell-date">{formatDate(s.endedAt)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => navigate(`/sessions/${s.id}`)}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={loadPage}
          />
        </>
      )}
    </div>
  )
}
