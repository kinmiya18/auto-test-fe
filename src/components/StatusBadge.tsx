interface StatusBadgeProps {
  status?: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = (status ?? 'unknown').toLowerCase()

  return (
    <span className={`badge badge-${normalized}`}>
      {status ?? '—'}
    </span>
  )
}
