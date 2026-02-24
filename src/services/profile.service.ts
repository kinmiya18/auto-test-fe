import type { Profile } from '../types'
import { buildUrl, parseJson } from './api-client'

export async function fetchProfiles(): Promise<Profile[]> {
  const res = await fetch(buildUrl('/v1/profiles'))
  const body = await parseJson<Profile[]>(res)

  if (!res.ok) throw new Error(body.message ?? `Failed (${res.status})`)

  return Array.isArray(body.data) ? body.data : []
}
