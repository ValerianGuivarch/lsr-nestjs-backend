import type { Container, PlayableUnit } from './catalogue'

export type View = 'journal' | 'find' | 'library' | 'prepare' | 'maintenance' | 'documents' | 'chronology' | 'excluded' | 'settings' | 'pnj' | 'factions' | 'lieux' | 'regions' | 'evenements'
export type ReferenceView = 'pnj' | 'factions' | 'lieux' | 'regions' | 'evenements'

export const viewPaths: Record<View, string> = {
  journal: '/pf2-mj/journal',
  find: '/pf2-mj/find',
  library: '/pf2-mj/catalogue',
  prepare: '/pf2-mj/prepare',
  maintenance: '/pf2-mj/maintenance',
  documents: '/pf2-mj/resources',
  chronology: '/pf2-mj/chronology',
  excluded: '/pf2-mj/excluded',
  settings: '/pf2-mj/settings',
  pnj: '/pf2-mj/npcs',
  factions: '/pf2-mj/factions',
  lieux: '/pf2-mj/places',
  regions: '/pf2-mj/regions',
  evenements: '/pf2-mj/events',
}

const referencePaths: Record<ReferenceView, string> = {
  pnj: viewPaths.pnj,
  factions: viewPaths.factions,
  lieux: viewPaths.lieux,
  regions: viewPaths.regions,
  evenements: viewPaths.evenements,
}

export function playableHref(unit: Pick<PlayableUnit, 'id'>): string {
  return `/pf2-mj/scenarios/${encodeURIComponent(unit.id)}`
}

export function containerHref(container: Pick<Container, 'id' | 'containerType'>): string {
  const family = container.containerType === 'campaign' ? 'campaigns' : 'containers'
  return `/pf2-mj/${family}/${encodeURIComponent(container.id)}`
}

export function referenceHref(view: ReferenceView, id?: string): string {
  return id ? `${referencePaths[view]}/${encodeURIComponent(id)}` : referencePaths[view]
}

export type Pf2Route =
  | { kind: 'redirect'; to?: string }
  | { kind: 'view'; view: View }
  | { kind: 'reference'; view: ReferenceView; id: string }
  | { kind: 'playable'; id: string }
  | { kind: 'container'; id: string }
  | { kind: 'not-found' }

function decodedRouteId(value?: string): string | null {
  if (!value) return null
  try { return decodeURIComponent(value) } catch { return value }
}

export function resolvePf2Route(pathname: string): Pf2Route {
  const relative = pathname.replace(/^\/pf2-mj\/?/, '').replace(/\/+$/, '')
  if (!relative) return { kind: 'redirect', to: viewPaths.journal }
  if (relative === 'playable-components') return { kind: 'redirect', to: viewPaths.journal }
  const [segment, rawId] = relative.split('/')
  const id = decodedRouteId(rawId)

  if (segment === 'scenarios' && id) return { kind: 'playable', id }
  if ((segment === 'campaigns' || segment === 'containers') && id) return { kind: 'container', id }

  const view = (Object.entries(viewPaths).find(([, path]) => path === `/pf2-mj/${segment}`)?.[0] ?? null) as View | null
  if (!view) return { kind: 'not-found' }
  if (['pnj', 'factions', 'lieux', 'regions', 'evenements'].includes(view) && id) return { kind: 'reference', view: view as ReferenceView, id }
  return { kind: 'view', view }
}
