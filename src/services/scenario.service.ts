import type { Scenario } from '../types'
import { buildUrl, parseJson } from './api-client'

export async function fetchScenarioById(id: string): Promise<Scenario> {
  const res = await fetch(buildUrl(`/v1/scenarios/${id}`))
  const body = await parseJson<Scenario>(res)

  if (!res.ok) throw new Error(body.message ?? `Failed (${res.status})`)
  if (!body.data) throw new Error('Scenario not found')

  return body.data
}
