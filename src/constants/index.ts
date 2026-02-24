/* ── Run session modes ────────────────────────────────── */

export type RunMode = 'sequential' | 'limited' | 'limited-login'

export const RUN_MODES: { key: RunMode; label: string }[] = [
  { key: 'sequential', label: 'Run Sequential Test Cases' },
  { key: 'limited', label: 'Run Sequential Test Cases (Limited Rows)' },
  { key: 'limited-login', label: 'Run Sequential Test Cases (Limited Rows) – Login One Time' },
]

/* ── File upload fields ───────────────────────────────── */

export const FILE_FIELDS = [
  { key: 'dictionaryFile', label: 'Upload Dictionary File' },
  { key: 'actionFile', label: 'Upload Action File' },
  { key: 'dataTestFile', label: 'Upload Data File' },
] as const

/* ── Pagination ───────────────────────────────────────── */

export const PAGE_SIZE = 20
