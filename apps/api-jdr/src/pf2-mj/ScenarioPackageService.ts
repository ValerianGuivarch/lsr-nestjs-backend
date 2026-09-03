import AdmZip from 'adm-zip'
import { Injectable } from '@nestjs/common'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import sharp from 'sharp'
import { Pf2PersistenceService, ScenarioNpcLink } from '../pf2-storage/Pf2PersistenceService'

type PackageNpc = { key?: unknown; npcId?: unknown; name?: unknown; aliases?: unknown; description?: unknown; portrait?: unknown; role?: unknown; importance?: unknown; sourcePage?: unknown; notes?: unknown }
type ScenarioManifest = { packageVersion?: unknown; scenario?: { id?: unknown; name?: unknown }; npcs?: unknown; actors?: unknown; [key: string]: unknown }

@Injectable()
export class ScenarioPackageService {
  constructor(private readonly persistence: Pf2PersistenceService) {}

  async importZip(bytes: Buffer, originalName: string): Promise<{ scenarioId: string; packageVersion: number; state: 'integrated' | 'unchanged' | 'updated'; npcs: Array<{ id: string; name: string; created: boolean }> }> {
    if (!bytes.byteLength) throw new Error('Archive ZIP vide.')
    if (bytes.byteLength > 80 * 1024 * 1024) throw new Error('Archive ZIP trop volumineuse (80 Mo maximum).')
    const zip = new AdmZip(bytes)
    const entry = zip.getEntries().find(item => this.cleanPath(item.entryName).toLowerCase() === 'scenario.json')
    if (!entry) throw new Error('Le ZIP doit contenir scenario.json à sa racine.')
    let manifest: ScenarioManifest
    try { manifest = JSON.parse(entry.getData().toString('utf8')) as ScenarioManifest } catch { throw new Error('scenario.json est invalide.') }
    const scenarioId = this.id(manifest.scenario?.id, 'scenario.id')
    this.text(manifest.scenario?.name, 'scenario.name')
    const packageVersion = manifest.packageVersion === undefined ? 1 : this.version(manifest.packageVersion)
    if (manifest.npcs !== undefined && !Array.isArray(manifest.npcs)) throw new Error('npcs doit être un tableau.')
    if (manifest.actors !== undefined && !Array.isArray(manifest.actors)) throw new Error('actors doit être un tableau.')
    const existing = await this.persistence.getScenarioPackage(scenarioId)
    if (existing && existing.packageVersion > packageVersion) throw new Error(`Une version plus récente (${existing.packageVersion}) est déjà intégrée.`)
    const npcs = await this.resolveNpcs(scenarioId, (manifest.npcs ?? []) as PackageNpc[], zip)
    const state: 'integrated' | 'unchanged' | 'updated' = existing?.packageVersion === packageVersion ? 'unchanged' : existing ? 'updated' : 'integrated'
    const packageDir = resolve(this.persistence.storageRoot, 'documents', 'scenario-packages', this.safeSegment(scenarioId))
    await mkdir(packageDir, { recursive: true })
    await writeFile(resolve(packageDir, `v${packageVersion}.zip`), bytes)
    await this.persistence.replaceScenarioNpcLinks(scenarioId, npcs.links)
    await this.persistence.saveScenarioPackage({ scenarioId, packageVersion, status: 'integrated', filename: basename(originalName) || `${scenarioId}.zip`, manifest })
    return { scenarioId, packageVersion, state, npcs: npcs.items }
  }

  async packageForScenario(scenarioId: string): Promise<unknown> { return this.persistence.getScenarioPackage(scenarioId) }
  async npcsForScenario(scenarioId: string): Promise<unknown[]> {
    const links = await this.persistence.listScenarioNpcLinks(scenarioId)
    return Promise.all(links.map(async link => ({ ...(await this.persistence.getRecord('pnj', link.npcId)), ...link })))
  }
  async scenariosForNpc(npcId: string): Promise<unknown[]> {
    const links = await this.persistence.listNpcScenarioLinks(npcId)
    return Promise.all(links.map(async link => ({ ...(await this.persistence.getRecord('scenario', link.scenarioId)), ...link })))
  }
  async npcsForCampaign(campaignId: string): Promise<unknown[]> {
    const scenarios = await this.persistence.listRecords('scenario')
    const matching = scenarios.filter(scenario => scenario.collectionId === campaignId || scenario.parentId === campaignId || scenario.id === campaignId)
    const links = (await Promise.all(matching.map(scenario => this.persistence.listScenarioNpcLinks(String(scenario.id))))).flat()
    const unique = [...new Map(links.map(link => [link.npcId, link])).values()]
    return Promise.all(unique.map(async link => ({ ...(await this.persistence.getRecord('pnj', link.npcId)), ...link })))
  }
  async registry(): Promise<unknown[]> {
    const pnjs = await this.persistence.listRecords('pnj')
    return Promise.all(pnjs.map(async pnj => ({ id: pnj.id, nom: pnj.nom, aliases: Array.isArray(pnj.aliases) ? pnj.aliases : [], portrait: pnj.portrait ?? null, scenarios: (await this.persistence.listNpcScenarioLinks(String(pnj.id))).map(link => link.scenarioId) })))
  }

  private async resolveNpcs(scenarioId: string, definitions: PackageNpc[], zip: AdmZip): Promise<{ items: Array<{ id: string; name: string; created: boolean }>; links: ScenarioNpcLink[] }> {
    const seen = new Set<string>()
    const items: Array<{ id: string; name: string; created: boolean }> = []
    const links: ScenarioNpcLink[] = []
    for (const definition of definitions) {
      if (!definition || typeof definition !== 'object') throw new Error('Chaque PNJ doit être un objet.')
      const key = this.id(definition.key, 'npcs[].key')
      let npcId = typeof definition.npcId === 'string' && definition.npcId.trim() ? definition.npcId.trim() : ''
      let pnj = npcId ? await this.persistence.getRecord('pnj', npcId) : null
      let created = false
      if (npcId && !pnj) throw new Error(`PNJ inconnu : ${npcId}.`) 
      if (!pnj) {
        npcId = `${scenarioId}--${key}`
        pnj = await this.persistence.getRecord('pnj', npcId)
        if (!pnj) {
          const nom = this.text(definition.name, `npcs[${key}].name`)
          const portrait = await this.materializePortrait(zip, definition.portrait, npcId)
          pnj = { id: npcId, nom, description: typeof definition.description === 'string' ? definition.description.trim() : '', aliases: this.strings(definition.aliases), portrait: portrait ?? undefined, factions: [], tags: [], role: typeof definition.role === 'string' ? definition.role.trim() : '', importance: typeof definition.importance === 'string' ? definition.importance.trim() : 'Secondaire', statut: 'Actif', notes: typeof definition.notes === 'string' ? definition.notes.trim() : '' }
          await this.persistence.saveRecord('pnj', pnj)
          created = true
        }
      }
      if (seen.has(npcId)) throw new Error(`PNJ dupliqué dans le package : ${npcId}.`)
      seen.add(npcId)
      items.push({ id: npcId, name: String(pnj.nom ?? npcId), created })
      links.push({ scenarioId, npcId, role: this.optional(definition.role), importance: this.optional(definition.importance), sourcePage: this.optional(definition.sourcePage), notes: this.optional(definition.notes) })
    }
    return { items, links }
  }

  private id(value: unknown, label: string): string { const text = this.text(value, label); if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(text)) throw new Error(`${label} doit être un identifiant stable sans espace.`); return text }
  private text(value: unknown, label: string): string { if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} est obligatoire.`); return value.trim() }
  private optional(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null }
  private strings(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map(item => item.trim()) : [] }
  private version(value: unknown): number { if (!Number.isInteger(value) || Number(value) < 1) throw new Error('packageVersion doit être un entier positif.'); return Number(value) }
  private cleanPath(value: string): string { return value.replace(/\\/g, '/').replace(/^\.\//, '') }
  private safeSegment(value: string): string { return value.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-|-$/g, '') }
  private async materializePortrait(zip: AdmZip, value: unknown, npcId: string): Promise<string | null> {
    if (typeof value !== 'string' || !value.trim()) return null
    const path = this.cleanPath(value)
    if (!path.startsWith('assets/') || path.includes('..')) throw new Error(`Portrait PNJ invalide : ${value}`)
    const entry = zip.getEntries().find(item => this.cleanPath(item.entryName) === path)
    if (!entry || entry.isDirectory) throw new Error(`Portrait PNJ absent du ZIP : ${value}`)
    const bytes = entry.getData()
    if (!bytes.byteLength || bytes.byteLength > 10 * 1024 * 1024) throw new Error(`Portrait PNJ invalide ou trop volumineux : ${value}`)
    const filename = `${this.safeSegment(npcId)}.webp`
    const root = resolve(process.env['FOUNDRY_ASSETS_ROOT'] ?? '../../FoundryVTT/Data/assets/l7r', 'portraits', 'pnj')
    await mkdir(root, { recursive: true })
    await writeFile(resolve(root, filename), await sharp(bytes).rotate().webp({ quality: 88 }).toBuffer())
    return `assets/l7r/portraits/pnj/${filename}`
  }
}
