import { BadRequestException } from '@nestjs/common'

type Kind = 'personnage' | 'lore' | 'loot' | 'rencontre' | 'texte' | 'checklist' | 'illustration' | 'compteur'
export type PrepCounter = { min: number; max: number; initial: number; value: number; broadcast: boolean }
export type PrepBlock = {
  id: string; kind: Kind; title: string; text: string; done: boolean;
  npcId?: string; assetId?: string; name?: string; ascendance?: string; portraitUrl?: string; showName?: boolean;
  quantity?: string; reference?: string; secret?: boolean; counter?: PrepCounter;
}
export type PrepStage = { id: string; title: string; time: string; notes: string; done: boolean; blocks: PrepBlock[] }
export type PrepBody = { stages: PrepStage[]; summary: string }
function trim(value: unknown, label: string, max: number, required = false): string {
    if (value !== undefined && value !== null && typeof value !== 'string') throw new BadRequestException(`${label} doit être du texte.`)
    const text = (value ?? '').toString().trim()
    if ((required && !text) || text.length > max) throw new BadRequestException(`${label} invalide (maximum ${max} caractères).`)
    return text
  }
function optionalId(value: unknown, label: string): string | null { return trim(value, label, 160) || null }
function normalizeCounter(raw: unknown): PrepCounter {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new BadRequestException('Compteur invalide.')
  const x = raw as Record<string, unknown>
  const {min,max,initial,value} = x
  if (typeof min !== 'number' || typeof max !== 'number' || typeof initial !== 'number' || typeof value !== 'number' ||
      ![min,max,initial,value].every(Number.isSafeInteger) || min >= max || initial < min || initial > max || value < min || value > max)
    throw new BadRequestException('Compteur : bornes entières et valeurs dans les limites requises.')
  return {min,max,initial,value,broadcast:x.broadcast === true}
}
/** Tagged text allows staging counters through older API versions. */
export function hydratePreparationCounters(body: PrepBody): PrepBody {
  if (!body.stages.some(stage => stage.blocks.some(b => b.kind === 'texte' && b.text?.startsWith('@compteur/v1 ')))) return body
  return normalizePreparationBody(body)
}
export function resetPreparationCounters(body: PrepBody): PrepBody {
  return {...body,stages:body.stages.map(stage=>({...stage,blocks:stage.blocks.map(block=>block.counter ? {...block,counter:{...block.counter,value:block.counter.initial,broadcast:false}} : block)}))}
}
export function normalizePreparationBody(value: unknown): PrepBody {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('Préparation invalide.')
    const input = value as Record<string, unknown>
    if (!Array.isArray(input.stages) || input.stages.length > 100) throw new BadRequestException('100 étapes maximum.')
    const unique = new Set<string>()
    const stages = input.stages.map((raw: unknown) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new BadRequestException('Étape invalide.')
      const stage = raw as Record<string, unknown>
      const id = trim(stage.id, 'Identifiant étape', 100, true)
      if (unique.has(id)) throw new BadRequestException('Identifiant de bloc dupliqué.')
      unique.add(id)
      if (!Array.isArray(stage.blocks) || stage.blocks.length > 100) throw new BadRequestException('100 blocs maximum par étape.')
      const blocks: PrepBlock[] = stage.blocks.map((rawBlock: unknown) => {
        if (!rawBlock || typeof rawBlock !== 'object' || Array.isArray(rawBlock)) throw new BadRequestException('Bloc invalide.')
        const b = rawBlock as Record<string, unknown>
        const blockId = trim(b.id, 'Identifiant bloc', 100, true)
        if (unique.has(blockId)) throw new BadRequestException('Identifiant de bloc dupliqué.')
        unique.add(blockId)
        let kind = b.kind as Kind
        let counterRaw = b.counter
        let rawText = b.text
        if (kind === 'texte' && typeof rawText === 'string' && rawText.startsWith('@compteur/v1 ')) {
          try { counterRaw = JSON.parse(rawText.slice('@compteur/v1 '.length)) } catch { throw new BadRequestException('Compteur illisible.') }
          kind = 'compteur'; rawText = ''
        }
        if (!['personnage', 'lore', 'loot', 'rencontre', 'texte', 'checklist', 'illustration', 'compteur'].includes(kind)) throw new BadRequestException('Type de bloc inconnu.')
        const npcId = optionalId(b.npcId, 'Référence personnage')
        const assetId = optionalId(b.assetId, 'Ressource partagée')
        if (assetId && (npcId || !['personnage', 'illustration'].includes(kind))) throw new BadRequestException('Ressource partagée incompatible.')
        if (kind === 'illustration' && !assetId && !trim(b.title, 'Titre de l’illustration', 220)) throw new BadRequestException('Titre de l’illustration obligatoire.')
        const name = trim(b.name, 'Nom du personnage', 160)
        const ascendance = trim(b.ascendance, 'Ascendance du personnage', 120)
        if (kind === 'personnage' && !npcId && !assetId && !name) throw new BadRequestException('Un personnage temporaire doit avoir un nom.')
        return {
          id: blockId, kind, title: trim(b.title, 'Titre du bloc', 220, kind === 'compteur'),
          text: trim(rawText, 'Contenu', 12000), done: b.done === true,
          ...(kind === 'compteur' ? {counter:normalizeCounter(counterRaw)} : {}),
          ...(npcId ? { npcId } : {}), ...(assetId ? { assetId } : {}), ...(name ? { name } : {}), ...(ascendance ? { ascendance } : {}),
          portraitUrl: trim(b.portraitUrl, 'Portrait', 1200), showName: b.showName !== false,
          quantity: trim(b.quantity, 'Quantité', 100), reference: trim(b.reference, 'Référence', 500), secret: b.secret === true,
        }
      })
      return { id, title: trim(stage.title, 'Titre étape', 220, true), time: trim(stage.time, 'Horaire', 60), notes: trim(stage.notes, 'Notes', 12000), done: stage.done === true, blocks }
    })
    return { stages, summary: trim(input.summary, 'Résumé', 15000) }
  }

/** A module is a playable period, with context available before the first scene. */
export function requireModuleRecap(body: PrepBody): void {
  const recap = body.stages[0]?.blocks[0]
  if (recap?.kind !== 'texte' || recap.title !== 'Récapitulatif' || !recap.text.trim()) {
    throw new BadRequestException('Le premier bloc du modèle doit être un texte « Récapitulatif » renseigné.')
  }
}
