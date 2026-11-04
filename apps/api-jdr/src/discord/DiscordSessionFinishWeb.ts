import {
  finishInt, finishReport, finishReportParts, sortedFinishReputations,
  type SessionFinishDraft, type SessionFinishChange,
} from './SessionFinishFlow'

export type SessionFinishWebInput = {
  number: number
  days: number
  xpTotal: number
  xpPerPlayer: number
  gp: number
  sp: number
  cp: number
  actions: string
  loot: string
  reputations: Array<{ id: number; delta: number }>
}

function number(value: unknown, label: string, maximum: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) throw new Error(label + ' : entier obligatoire.')
  return finishInt(String(value), label, maximum)
}

export function parseSessionFinishWebInput(
  body: unknown, draft: SessionFinishDraft,
): Pick<SessionFinishDraft,'number'|'days'|'xpTotal'|'xpPerPlayer'|'activities'|'coins'|'loot'|'changes'> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Formulaire invalide.')
  const input = body as Record<string,unknown>
  const numberValue = number(input.number, 'Numéro de séance', 999999)
  if (!numberValue) throw new Error('Le numéro de séance doit être supérieur à zéro.')
  const days = number(input.days,'Jours écoulés',3650)
  const xpTotal = number(input.xpTotal,'XP du groupe',10_000_000)
  const xpPerPlayer = number(input.xpPerPlayer,'XP par PJ',10_000_000)
  const gp = number(input.gp,'Pièces d’or',1_000_000)
  const sp = number(input.sp,'Pièces d’argent',1_000_000)
  const cp = number(input.cp,'Pièces de cuivre',1_000_000)
  if (typeof input.actions !== 'string' || input.actions.length > 12000 ||
    typeof input.loot !== 'string' || input.loot.length > 12000) throw new Error('Texte des actions ou objets trop long.')
  if (!Array.isArray(input.reputations)) throw new Error('Liste des réputations manquante.')
  const factionIds = new Map(draft.groups.flatMap(group => group.entries.map(entry => [
    entry.id, { name:entry.name, group:group.name },
  ] as const)))
  const seen = new Set<number>()
  const changes: SessionFinishChange[] = []
  for (const item of input.reputations) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Réputation invalide.')
    const rep = item as Record<string,unknown>
    const id = number(rep.id,'ID de réputation',2147483647)
    const info = factionIds.get(id)
    if (!info || seen.has(id)) throw new Error('Réputation absente, inconnue ou répétée.')
    seen.add(id)
    if (typeof rep.delta !== 'number' || !Number.isInteger(rep.delta) || Math.abs(rep.delta) > 50) {
      throw new Error(info.name + ' : variation attendue entre -50 et +50.')
    }
    if (rep.delta !== 0) changes.push({ id, name:info.name, group:info.group,delta:rep.delta })
  }
  if (seen.size !== factionIds.size) throw new Error('Liste de réputations incomplète : actualise le formulaire.')
  const parsed = {
    number: numberValue, days, xpTotal,xpPerPlayer,
    activities: input.actions.trim(), coins:{gp,sp,cp},loot:input.loot.trim(),
    changes:sortedFinishReputations(changes),
  }
  // Refuse overly long individual lines now, before any real money changes.
  finishReportParts(finishReport({ ...draft,...parsed }))
  return parsed
}
