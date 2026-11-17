export type CheckState = 'todo' | 'partial' | 'done' | 'na'
export type ModuleState = {
  key: string; scenarioId: string; componentId: string; campaignIds: string[];
  order: number; campaignOrder: Record<string, number>; title: string;
  checklist: Record<string, CheckState>; progress: 'todo' | 'started' | 'done';
  ready: boolean; hasTemplate: boolean;
}
export const moduleKey = (scenarioId: string, componentId = '') => JSON.stringify([scenarioId, componentId])
export const checklistCount = (m: ModuleState) => Object.values(m.checklist).filter(v => v === 'done' || v === 'na').length
export const moduleReady = (m: ModuleState) => m.ready && (m.hasTemplate || m.checklist.template === 'na')
export function moduleStateLabel(m: ModuleState, played = false): string {
  if (played || m.progress === 'done') return 'Joué'
  if (moduleReady(m)) return 'Prêt à jouer'
  return m.hasTemplate || m.progress === 'started' || Object.values(m.checklist).some(v => v !== 'todo') ? 'En préparation' : 'À préparer'
}
export function upcomingReadiness(modules: ModuleState[], workId: string, isPlayed: (m: ModuleState) => boolean, allowedScenarioIds?: Set<string>) {
  const upcoming = modules.filter(m => m.campaignIds.includes(workId) && (!allowedScenarioIds || allowedScenarioIds.has(m.scenarioId)) && m.progress !== 'done' && !isPlayed(m))
    .sort((a,b) => (a.campaignOrder[workId] ?? a.order) - (b.campaignOrder[workId] ?? b.order))
  const count = upcoming.filter(moduleReady).length
  return { count, total: upcoming.length, label: count > 3 ? '3+/3' : count + '/3', nextReady: upcoming.length > 0 && moduleReady(upcoming[0]) }
}
