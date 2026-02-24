/**
 * Format an ISO date string to a locale-friendly display string.
 * Returns '—' for falsy values.
 */
export function formatDate(value?: string): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}
