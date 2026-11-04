/** Interactive, administrator-only /fin-seance wizard. No Discord SDK dependency. */
export type SessionFinishCoins = { gp: number; sp: number; cp: number }
export type SessionFinishGroup = { id: number; name: string; entries: Array<{ id: number; name: string; score: number }> }
export type SessionFinishChange = { id: number; name: string; delta: number; group: string }
export type SessionFinishDraft = {
  token: string; requesterId: string; channelId: string; guildId: string
  mock: boolean; sessionId: string | null; number: number; createdAt: number
  days: number; xpPerPlayer: number; xpTotal: number; activities: string
  coins: SessionFinishCoins; loot: string
  groups: SessionFinishGroup[]; changes: SessionFinishChange[]; reputationPage?: number
  step: 'form' | 'review' | 'committing' | 'completed'
  formValues?: { number: string; days: string; xp: string; treasure: string; reputation: string }
}

export const FINISH_TTL_MS = 30 * 60 * 1000
export const finishInt = (text: string, field: string, max = 1_000_000): number => {
  if (!/^(?:0|[1-9]\d*)$/.test(text.trim())) throw new Error(`${field} : saisis un entier positif ou zéro.`)
  const result = Number(text.trim())
  if (!Number.isSafeInteger(result) || result > max) throw new Error(`${field} : valeur trop élevée.`)
  return result
}

export function finishReputationDefaults(group: SessionFinishGroup): string {
  return group.entries.map(entry => `${entry.name}: 0`).join('\n')
}

export function parseFinishReputationGroup(group: SessionFinishGroup, text: string): SessionFinishChange[] {
  const byName = new Map(group.entries.map(entry => [entry.name.normalize('NFC').toLowerCase(), entry]))
  const changed: SessionFinishChange[] = []
  const visited = new Set<number>()
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const colon = line.lastIndexOf(':')
    if (colon < 1) throw new Error(`${group.name} : utilise « Faction: 0 » sur chaque ligne.`)
    const label = line.slice(0, colon).trim()
    const entry = byName.get(label.normalize('NFC').toLowerCase())
    if (!entry) throw new Error(`${group.name} : faction inconnue « ${label} ».`)
    if (visited.has(entry.id)) throw new Error(`${group.name} : « ${label} » apparaît plusieurs fois.`)
    visited.add(entry.id)
    const value = line.slice(colon + 1).trim()
    if (!/^[+-]?\d{1,2}$/.test(value) || Math.abs(Number(value)) > 50) {
      throw new Error(`${entry.name} : variation invalide (entier de -50 à +50).`)
    }
    const delta = Number(value)
    if (delta) changed.push({ id: entry.id, name: entry.name, delta, group: group.name })
  }
  // A missing line is allowed: it represents no reputation change.
  return changed
}

/** A single Discord modal has five inputs, so numeric XP shares one text area
 * with actions and numeric coinage shares one with item notes. The markers
 * are prefixed and editable; no XP values are inferred from free-form text. */
export function finishXpForm(draft: Pick<SessionFinishDraft, 'xpTotal' | 'xpPerPlayer' | 'activities'>): string {
  return `Total XP: ${draft.xpTotal}\nXP par PJ: ${draft.xpPerPlayer}\n\nActions:\n${draft.activities}`.trimEnd()
}

export function parseFinishXpForm(text: string): Pick<SessionFinishDraft, 'xpTotal' | 'xpPerPlayer' | 'activities'> {
  const lines = text.split(/\r?\n/)
  const total = /^Total XP\s*:\s*(.+)\s*$/i.exec(lines[0]?.trim() ?? '')
  const perPlayer = /^XP par PJ\s*:\s*(.+)\s*$/i.exec(lines[1]?.trim() ?? '')
  const separator = lines.findIndex((line, index) => index >= 2 && /^Actions\s*:\s*$/i.test(line.trim()))
  if (!total || !perPlayer || separator < 0 || lines.slice(2, separator).some(line => line.trim())) {
    throw new Error('XP : garde « Total XP: 0 », « XP par PJ: 0 » puis « Actions: » ; ajoute tes lignes après Actions.')
  }
  return {
    xpTotal: finishInt(total[1].trim(), 'XP total du groupe', 10_000_000),
    xpPerPlayer: finishInt(perPlayer[1].trim(), 'XP par PJ', 10_000_000),
    activities: lines.slice(separator+1).join('\n').trim(),
  }
}

export function finishTreasureForm(draft: Pick<SessionFinishDraft, 'coins' | 'loot'>): string {
  return `Or (po): ${draft.coins.gp}\nArgent (pa): ${draft.coins.sp}\nCuivre (pc): ${draft.coins.cp}\n\nObjets:\n${draft.loot}`.trimEnd()
}

export function parseFinishTreasureForm(text: string): Pick<SessionFinishDraft, 'coins' | 'loot'> {
  const lines = text.split(/\r?\n/)
  const gold = /^Or \(po\)\s*:\s*(.+)\s*$/i.exec(lines[0]?.trim() ?? '')
  const silver = /^Argent \(pa\)\s*:\s*(.+)\s*$/i.exec(lines[1]?.trim() ?? '')
  const copper = /^Cuivre \(pc\)\s*:\s*(.+)\s*$/i.exec(lines[2]?.trim() ?? '')
  const separator = lines.findIndex((line,index) => index >= 3 && /^Objets\s*:\s*$/i.test(line.trim()))
  if (!gold || !silver || !copper || separator < 0 || lines.slice(3,separator).some(line=>line.trim())) {
    throw new Error('Butin : garde « Or (po): 0 », « Argent (pa): 0 », « Cuivre (pc): 0 », puis « Objets: ».')
  }
  return {
    coins: {
      gp: finishInt(gold[1].trim(), 'Pièces d’or'),
      sp: finishInt(silver[1].trim(), 'Pièces d’argent'),
      cp: finishInt(copper[1].trim(), 'Pièces de cuivre'),
    },
    loot: lines.slice(separator+1).join('\n').trim(),
  }
}

/** Groups and original names remain visible and editable in one text area.
 * Index by group, not just faction name: duplicate faction names are safe. */
export function finishReputationForm(groups: SessionFinishGroup[], changes: SessionFinishChange[]): string {
  const delta = new Map(changes.map(change => [change.id, change.delta]))
  return groups.map(group => [
    `# ${group.name}`,
    ...group.entries.map(entry => `${entry.name}: ${delta.get(entry.id) ?? 0}`),
  ].join('\n')).join('\n\n')
}

export function parseFinishReputationForm(groups: SessionFinishGroup[], text: string): SessionFinishChange[] {
  const byName = new Map(groups.map(group => [group.name.normalize('NFC').toLowerCase(), group]))
  const seen = new Set<number>()
  const changes: SessionFinishChange[] = []
  let group: SessionFinishGroup | null = null
  let entries: string[] = []
  const flush = () => {
    if (!group) return
    changes.push(...parseFinishReputationGroup(group, entries.join('\n')))
    entries = []
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('#')) {
      flush()
      const name = line.slice(1).trim()
      group = byName.get(name.normalize('NFC').toLowerCase()) ?? null
      if (!group || seen.has(group.id)) throw new Error('Groupe de réputation absent, inconnu ou répété : '+name)
      seen.add(group.id)
    } else {
      if (!group) throw new Error('Réputation sans catégorie : conserve les lignes « # Catégorie ».')
      entries.push(line)
    }
  }
  flush()
  return sortedFinishReputations(changes)
}

export function sortedFinishReputations(changes: SessionFinishChange[]): SessionFinishChange[] {
  return [...changes].sort((a, b) => b.delta - a.delta || a.group.localeCompare(b.group, 'fr') || a.name.localeCompare(b.name, 'fr'))
}

export function finishLines(text: string): string[] {
  return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => line.replace(/^(?:[-*•]\s*)/, ''))
}

export function finishCurrencyText(coins: SessionFinishCoins): string {
  return ([
    coins.gp ? `${coins.gp} pièce${coins.gp > 1 ? 's' : ''} d’or` : '',
    coins.sp ? `${coins.sp} pièce${coins.sp > 1 ? 's' : ''} d’argent` : '',
    coins.cp ? `${coins.cp} pièce${coins.cp > 1 ? 's' : ''} de cuivre` : '',
  ].filter(Boolean)).join(', ')
}

export function finishReport(draft: SessionFinishDraft): string {
  const activities = finishLines(draft.activities).map(line => `• ${line}`)
  const lootLines = finishLines(draft.loot).map(line => `• ${line}`)
  const money = finishCurrencyText(draft.coins)
  const rep = sortedFinishReputations(draft.changes).map(change =>
    `• ${change.name} : ${change.delta > 0 ? '+' : ''}${change.delta}`)
  return [
    `🏁 **Fin de séance n°${draft.number}**`,
    `**Durée en jeu :** ${draft.days} jour${draft.days > 1 ? 's' : ''} écoulé${draft.days > 1 ? 's' : ''}`,
    '', '**Expérience**',
    ...(activities.length ? activities : ['• Aucune activité détaillée']),
    `**Total : ${draft.xpTotal} XP, soit ${draft.xpPerPlayer} XP par PJ.**`,
    '', '**Gain de points et butin**',
    ...(money ? [`• ${money} (par PJ)`] : []),
    ...lootLines,
    ...(!money && !lootLines.length ? ['• Aucun butin déclaré'] : []),
    '', '**Réputation**',
    ...(rep.length ? rep : ['• Aucune variation']),
    ...(draft.mock ? [
      '', '🧪 **SIMULATION MJ — aucune modification des séances, des inventaires ou des réputations.**',
      `**Simulation des changements :** séance n°${draft.number} ; ${draft.days} jour(s) écoulé(s) ; ` +
        `${draft.xpTotal} XP au total, ${draft.xpPerPlayer} XP par PJ ; ` +
        `${money || 'aucune pièce'} par PJ ; ${rep.length} réputation(s) modifiée(s).`,
    ] : []),
  ].join('\n')
}

/** Discord text messages are at most 2000 chars; split only at line boundaries. */
export function finishReportParts(text: string, limit = 1950): string[] {
  const chunks: string[] = []
  let part = ''
  for (const line of text.split('\n')) {
    if (line.length > limit) throw new Error('Une ligne du récapitulatif dépasse la limite Discord.')
    if (part && part.length + line.length + 1 > limit) {
      chunks.push(part)
      part = line
    } else part = part ? part + '\n' + line : line
  }
  if (part) chunks.push(part)
  return chunks
}
