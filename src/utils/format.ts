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

/**
 * Format a profile into a readable string: "Chrome • 1920×1080"
 */
export function formatProfile(profile: {
  name?: string
  browser: string
  viewportWidth: number
  viewportHeight: number
}): string {
  const label = profile.name ? `${profile.name} (${profile.browser})` : profile.browser
  return `${label} • ${profile.viewportWidth}×${profile.viewportHeight}`
}
