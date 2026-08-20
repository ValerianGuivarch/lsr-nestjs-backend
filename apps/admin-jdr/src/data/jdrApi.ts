import { DiceRollEntity, JdrAggregate, JdrSummary } from './types'

const API_BASE = '/api/v1/jdr'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers }
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${res.status} ${res.statusText} ${body}`)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}

const post = <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined })
const put = <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined })
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' })

// Every mutation below returns the freshly recomposed JdrAggregate (backend contract), so all
// callers can simply replace their cached aggregate with the response.
export const jdrApi = {
  findAll: () => request<JdrSummary[]>(''),
  findOne: (jdrSlug: string) => request<JdrAggregate>(`/${jdrSlug}`),
  createJdr: (p: { name: string; text?: string }) => post<JdrAggregate>('', p),
  updateJdr: (jdrSlug: string, p: { name?: string; text?: string }) => put<JdrAggregate>(`/${jdrSlug}`, p),
  deleteJdr: (jdrSlug: string) => del<void>(`/${jdrSlug}`),

  getLastRolls: (jdrSlug: string, size = 100) => request<DiceRollEntity[]>(`/${jdrSlug}/rolls?size=${size}`),

  addStat: (jdrSlug: string, p: { name: string }) => post<JdrAggregate>(`/${jdrSlug}/stats`, p),
  updateStat: (jdrSlug: string, statSlug: string, p: { name: string }) => put<JdrAggregate>(`/${jdrSlug}/stats/${statSlug}`, p),
  removeStat: (jdrSlug: string, statSlug: string) => del<JdrAggregate>(`/${jdrSlug}/stats/${statSlug}`),

  addTrait: (jdrSlug: string, p: { name: string; type: string; level?: number; data?: Record<string, unknown>; modifiers?: { statSlug: string; value: number }[] }) =>
    post<JdrAggregate>(`/${jdrSlug}/traits`, p),
  updateTrait: (
    jdrSlug: string,
    traitSlug: string,
    p: { name?: string; type?: string; level?: number | null; data?: Record<string, unknown> | null; modifiers?: { statSlug: string; value: number }[] }
  ) => put<JdrAggregate>(`/${jdrSlug}/traits/${traitSlug}`, p),
  removeTrait: (jdrSlug: string, traitSlug: string) => del<JdrAggregate>(`/${jdrSlug}/traits/${traitSlug}`),

  addResource: (jdrSlug: string, p: { name: string; type: string }) => post<JdrAggregate>(`/${jdrSlug}/resources`, p),
  updateResource: (jdrSlug: string, resourceSlug: string, p: { name?: string; type?: string }) => put<JdrAggregate>(`/${jdrSlug}/resources/${resourceSlug}`, p),
  removeResource: (jdrSlug: string, resourceSlug: string) => del<JdrAggregate>(`/${jdrSlug}/resources/${resourceSlug}`),
  updateGroupResource: (jdrSlug: string, resourceSlug: string, value: number) => put<JdrAggregate>(`/${jdrSlug}/group-resources/${resourceSlug}`, { value }),

  addItem: (jdrSlug: string, p: { name: string; description?: string; unique?: boolean; modifiers?: { statSlug: string; value: number }[] }) =>
    post<JdrAggregate>(`/${jdrSlug}/items`, p),
  updateItem: (jdrSlug: string, itemSlug: string, p: { name?: string; description?: string; unique?: boolean; modifiers?: { statSlug: string; value: number }[] }) =>
    put<JdrAggregate>(`/${jdrSlug}/items/${itemSlug}`, p),
  removeItem: (jdrSlug: string, itemSlug: string) => del<JdrAggregate>(`/${jdrSlug}/items/${itemSlug}`),
  addGroupItem: (jdrSlug: string, itemSlug: string, quantity?: number) => post<JdrAggregate>(`/${jdrSlug}/group-items`, { itemSlug, quantity }),
  removeGroupItem: (jdrSlug: string, itemSlug: string) => del<JdrAggregate>(`/${jdrSlug}/group-items/${itemSlug}`),

  addClass: (jdrSlug: string, p: { name: string; level: number; text?: string }) => post<JdrAggregate>(`/${jdrSlug}/classes`, p),
  updateClass: (jdrSlug: string, classSlug: string, p: { name?: string; level?: number; text?: string }) => put<JdrAggregate>(`/${jdrSlug}/classes/${classSlug}`, p),
  removeClass: (jdrSlug: string, classSlug: string) => del<JdrAggregate>(`/${jdrSlug}/classes/${classSlug}`),
  addClassResource: (jdrSlug: string, classSlug: string, p: { resourceSlug: string; resourceType: string; defaultValue?: number; behavior?: string }) =>
    post<JdrAggregate>(`/${jdrSlug}/classes/${classSlug}/resources`, p),
  removeClassResource: (jdrSlug: string, classSlug: string, resourceSlug: string) => del<JdrAggregate>(`/${jdrSlug}/classes/${classSlug}/resources/${resourceSlug}`),

  addGroup: (jdrSlug: string, p: { name: string; text?: string }) => post<JdrAggregate>(`/${jdrSlug}/groups`, p),
  updateGroup: (jdrSlug: string, groupSlug: string, p: { name?: string; text?: string }) => put<JdrAggregate>(`/${jdrSlug}/groups/${groupSlug}`, p),
  removeGroup: (jdrSlug: string, groupSlug: string) => del<JdrAggregate>(`/${jdrSlug}/groups/${groupSlug}`),

  addCharacter: (jdrSlug: string, p: { name: string; classSlug?: string; classLevel?: number; isPlayable?: boolean; text?: string }) =>
    post<JdrAggregate>(`/${jdrSlug}/characters`, p),
  updateCharacter: (jdrSlug: string, characterSlug: string, p: { name?: string; classSlug?: string; classLevel?: number; isPlayable?: boolean; text?: string }) =>
    put<JdrAggregate>(`/${jdrSlug}/characters/${characterSlug}`, p),
  removeCharacter: (jdrSlug: string, characterSlug: string) => del<JdrAggregate>(`/${jdrSlug}/characters/${characterSlug}`),

  addCharacterGroup: (jdrSlug: string, characterSlug: string, groupSlug: string) => post<JdrAggregate>(`/${jdrSlug}/characters/${characterSlug}/groups/${groupSlug}`),
  removeCharacterGroup: (jdrSlug: string, characterSlug: string, groupSlug: string) => del<JdrAggregate>(`/${jdrSlug}/characters/${characterSlug}/groups/${groupSlug}`),

  addCharacterTrait: (jdrSlug: string, characterSlug: string, traitSlug: string) => post<JdrAggregate>(`/${jdrSlug}/characters/${characterSlug}/traits/${traitSlug}`),
  removeCharacterTrait: (jdrSlug: string, characterSlug: string, traitSlug: string) => del<JdrAggregate>(`/${jdrSlug}/characters/${characterSlug}/traits/${traitSlug}`),

  addCharacterItem: (jdrSlug: string, characterSlug: string, itemSlug: string, quantity?: number) =>
    post<JdrAggregate>(`/${jdrSlug}/characters/${characterSlug}/items`, { itemSlug, quantity }),
  removeCharacterItem: (jdrSlug: string, characterSlug: string, itemSlug: string) => del<JdrAggregate>(`/${jdrSlug}/characters/${characterSlug}/items/${itemSlug}`),

  updateCharacterStat: (jdrSlug: string, characterSlug: string, statSlug: string, value: number) =>
    put<JdrAggregate>(`/${jdrSlug}/characters/${characterSlug}/stats/${statSlug}`, { value }),

  updateCharacterResource: (jdrSlug: string, characterSlug: string, resourceSlug: string, value: number) =>
    put<JdrAggregate>(`/${jdrSlug}/characters/${characterSlug}/resources/${resourceSlug}`, { value }),
  removeCharacterResource: (jdrSlug: string, characterSlug: string, resourceSlug: string) =>
    del<JdrAggregate>(`/${jdrSlug}/characters/${characterSlug}/resources/${resourceSlug}`)
}
