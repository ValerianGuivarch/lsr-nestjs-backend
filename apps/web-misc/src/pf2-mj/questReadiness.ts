import { moduleReady, type ModuleState } from './moduleReadiness'

export type QuestNature = 'unassigned' | 'mission' | 'rp' | 'dependent'
export type QuestState = {
  nature: QuestNature; blocked: boolean; personal: boolean; characterIds: string[];
  dependsOnQuestId: string; dependencyBlocked: boolean; dependencyCompleted: boolean;
  moduleKey: string;
}

export const natureLabels: Record<QuestNature,string> = {
  unassigned: 'À qualifier', mission: 'Mission', rp: 'Piste RP', dependent: 'Quête dépendante',
}
export const questBlocked = (q: QuestState) => q.blocked || (q.nature === 'dependent' && q.dependencyBlocked)
export const questPlayable = (q: QuestState, m?: ModuleState) =>
  (q.nature === 'mission' || q.nature === 'rp') && !questBlocked(q) && !!m && m.progress !== 'done' && moduleReady(m)
export const questNeedsPreparation = (q: QuestState, m?: ModuleState) =>
  !questBlocked(q) && (q.nature === 'mission' || (q.nature === 'rp' && !!q.moduleKey)) && !questPlayable(q, m)
export function questPreparationLabel(q: QuestState, m?: ModuleState) {
  if (q.nature === 'dependent') return 'Pas de module autonome'
  if (q.nature === 'unassigned') return 'À qualifier'
  if (!q.moduleKey && q.nature === 'rp') return 'Sans module (facultatif)'
  if (!m) return 'Module à définir'
  if (m.progress === 'done') return 'Module joué — choisir la suite'
  return moduleReady(m) ? 'Prêt à jouer' : moduleState(m)
}
function moduleState(m: ModuleState) {
  return m.hasTemplate || Object.values(m.checklist).some(v => v !== 'todo') ? 'En préparation' : 'À préparer'
}
