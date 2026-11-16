import { Body, Controller, ForbiddenException, Get, Header, Headers, Injectable, Param, Put, BadRequestException } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { timingSafeEqual } from 'node:crypto'
import { DataSource } from 'typeorm'
import { Pf2PersistenceService } from '../pf2-storage/Pf2PersistenceService'

const kinds = ['unassigned', 'mission', 'blocked', 'personal', 'rp'] as const
const checks = ['source', 'template', 'entities', 'foundry', 'review'] as const
type Check = typeof checks[number]
type CheckState = 'todo' | 'done' | 'na'
type Checklist = Record<Check, CheckState>
const emptyChecklist = (): Checklist => ({ source: 'todo', template: 'todo', entities: 'todo', foundry: 'todo', review: 'todo' })
const obj = (v: unknown): Record<string, any> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, any> : {}
const arr = (v: unknown): Record<string, any>[] => Array.isArray(v) ? v.map(obj) : []
const str = (v: unknown): string => typeof v === 'string' ? v : ''
const label = (v: Record<string, any>) => str(v.titleFr) || str(v.title) || str(v.titleOriginal) || str(v.id)
export const choiceModuleKey = (scenarioId: string, componentId = '') => JSON.stringify([scenarioId, componentId])
type Module = { key: string; scenarioId: string; componentId: string; campaignIds: string[]; title: string; group: string; order: number; campaignOrder: Record<string,number> }

export function choiceCatalogue(entries: Record<string, any>[], arcs: Record<string, any>[]) {
  const campaigns = new Map<string, { id: string; title: string }>()
  const modules: Module[] = []
  const arcMembership = new Map<string, string[]>()
  const arcOrder = new Map<string,number>()
  for (const arc of arcs) {
    const id = str(arc.id)
    if (!id) continue
    campaigns.set(id, { id, title: label(arc) })
    for (const [index,entryId] of (Array.isArray(arc.entryIds) ? arc.entryIds : []).entries()) {
      if (typeof entryId === 'string') {
        arcMembership.set(entryId, [...(arcMembership.get(entryId) ?? []), id])
        arcOrder.set(JSON.stringify([id,entryId]),index)
      }
    }
  }
  for (const entry of entries) {
    const id = str(entry.id)
    if (!id || entry.kind === 'bounty' || id.startsWith('bounty-')) continue
    campaigns.set(id, { id, title: label(entry) })
    const memberships = [id, ...(arcMembership.get(id) ?? [])]
    const campaignOrder = (order:number) => Object.fromEntries(memberships.map(c => [c,(arcOrder.get(JSON.stringify([c,id])) ?? 0)*100000 + order]))
    const add = (source: Record<string, any>, group: string, offset: number, fallback: boolean) => {
      const scenarioId = str(source.id)
      if (!scenarioId) return
      const components = arr(source.playableComponents)
      if (components.length) {
        for (const [index, component] of components.entries()) {
          const componentId = str(component.id)
          if (componentId) modules.push({ key: choiceModuleKey(scenarioId, componentId), scenarioId, componentId, campaignIds: memberships, title: label(component), group, order: offset + (Number(component.order) || index + 1), campaignOrder:campaignOrder(offset + (Number(component.order) || index + 1)) })
        }
      } else if (fallback) modules.push({ key: choiceModuleKey(scenarioId), scenarioId, componentId: '', campaignIds: memberships, title: label(source), group, order: offset, campaignOrder:campaignOrder(offset) })
    }
    const parts = arr(entry.parts).filter(part => arr(part.playableComponents).length || ['volume_aventure', 'aventure_autonome', 'scenario', 'quest'].includes(str(part.kind)))
    if (arr(entry.playableComponents).length) add(entry, '', 0, false)
    for (const [index, part] of parts.entries()) add(part, label(part), (Number(part.sequence) || index + 1) * 1000, true)
    if (!parts.length && !arr(entry.playableComponents).length) add(entry, '', 0, true)
  }
  return { campaigns: [...campaigns.values()].sort((a,b) => a.title.localeCompare(b.title, 'fr')), modules }
}

@Injectable()
export class Pf2ChoiceLibreService {
  constructor(@InjectDataSource('pf2-sqlite') private readonly db: DataSource, private readonly persistence: Pf2PersistenceService) {}
  async catalogue() {
    const [entries, arcs, resources] = await Promise.all([
      this.persistence.listCatalogueEntries(),
      this.db.query("SELECT payload FROM pf2_catalogue_entity WHERE entity_kind='arc' ORDER BY sort_order"),
      this.db.query("SELECT id,title,origin FROM pf2_resource ORDER BY title"),
    ])
    const resourceEntries = resources.map((r: {id:string;title:string;origin:string}) => ({ id: 'resource:'+r.id, titleFr:r.title, kind:'adaptation' }))
    const resourceArcs = [...new Set<string>(resources.map((r: {origin:string}) => r.origin))].filter(Boolean).map(origin => ({
      id: 'resource-collection:'+origin, titleFr:origin, entryIds:resources.filter((r:{origin:string})=>r.origin===origin).map((r:{id:string})=>'resource:'+r.id),
    }))
    return choiceCatalogue([...entries,...resourceEntries], [...arcs.map((r: { payload: string }) => JSON.parse(r.payload)), ...resourceArcs])
  }

  async snapshot() {
    const [catalogue, quests, votes, identities, owners, links, preparation, launcher] = await Promise.all([
      this.catalogue(), this.persistence.listDiscordQuests(), this.persistence.listDiscordQuestVotes(),
      this.persistence.listPlayerIdentities(),
      this.db.query('SELECT o.discord_user_id AS userId,p.display_name AS name FROM pf2_player_character_owner o JOIN pf2_player_character_profile p ON p.npc_id=o.npc_id WHERE p.is_player=1 ORDER BY p.display_name'),
      this.db.query('SELECT thread_id AS threadId,kind,campaign_id AS campaignId,module_key AS moduleKey,note FROM pf2_choice_quest'),
      this.db.query('SELECT module_key AS moduleKey,checklist,progress FROM pf2_choice_module'), this.persistence.questLauncherId(),
    ])
    const names = new Map(identities.map(i => [i.discordUserId, i.playerName]))
    const modules = catalogue.modules.map(m => {
      const state = preparation.find((r: any) => r.moduleKey === m.key)
      const checklist: Checklist = { ...emptyChecklist(), ...JSON.parse(state?.checklist || '{}') }
      return { ...m, checklist, progress: state?.progress || 'todo', ready: checks.every(c => checklist[c] === 'done' || checklist[c] === 'na') }
    })
    return { campaigns: catalogue.campaigns, modules, quests: quests.filter(q => !q.completed && q.id !== launcher).map(q => {
      const link = links.find((r: any) => r.threadId === q.id)
      const voteList = votes.filter(v => v.threadId === q.id).map(v => ({
        emoji: v.emoji, name: names.get(v.userId) || 'Joueur non identifié',
        characters: owners.filter((o: any) => o.userId === v.userId).map((o: any) => o.name),
      }))
      return { ...q, kind: link?.kind || 'unassigned', campaignId: link?.campaignId || '', moduleKey: link?.moduleKey || '', note: link?.note || '', votes: voteList }
    }) }
  }

  async saveQuest(id: string, data: unknown) {
    const value = obj(data)
    if (!kinds.includes(value.kind)) throw new BadRequestException('Type de quête invalide.')
    const [quests,launcher] = await Promise.all([this.persistence.listDiscordQuests(),this.persistence.questLauncherId()])
    if (id === launcher || !quests.some(q => q.id === id && !q.completed)) throw new BadRequestException('Quête ouverte introuvable.')
    const campaignId = str(value.campaignId), moduleKey = str(value.moduleKey)
    const catalogue = await this.catalogue()
    if (campaignId && !catalogue.campaigns.some(c => c.id === campaignId)) throw new BadRequestException('Campagne inconnue.')
    if (moduleKey && !catalogue.modules.some(m => m.key === moduleKey && (!campaignId || m.campaignIds.includes(campaignId)))) throw new BadRequestException('Module inconnu ou hors campagne.')
    await this.db.query('INSERT INTO pf2_choice_quest (thread_id,kind,campaign_id,module_key,note) VALUES (?,?,?,?,?) ON CONFLICT(thread_id) DO UPDATE SET kind=excluded.kind,campaign_id=excluded.campaign_id,module_key=excluded.module_key,note=excluded.note,updated_at=CURRENT_TIMESTAMP', [id,value.kind,campaignId,moduleKey,str(value.note).slice(0,4000)])
    return { ok: true }
  }

  async templates() {
    const catalogue = await this.catalogue()
    const rows = await this.db.query('SELECT module_key AS moduleKey,body_json AS bodyJson,updated_at AS updatedAt FROM pf2_choice_template') as Array<{moduleKey:string;bodyJson:string;updatedAt:string}>
    return catalogue.modules.map(m => {
      const row = rows.find(r => r.moduleKey === m.key)
      return { ...m, hasTemplate: Boolean(row), updatedAt: row?.updatedAt, body: row ? JSON.parse(row.bodyJson) : null }
    })
  }

  async saveTemplate(data: unknown) {
    const value = obj(data), moduleKey = str(value.moduleKey), preparationId = str(value.preparationId)
    const catalogue = await this.catalogue()
    if (!catalogue.modules.some(m => m.key === moduleKey)) throw new BadRequestException('Module inconnu.')
    const rows = await this.db.query('SELECT body_json AS bodyJson FROM pf2_session_preparation WHERE id=?',[preparationId])
    if (!rows.length) throw new BadRequestException('Préparation enregistrée introuvable.')
    const body = JSON.parse(rows[0].bodyJson)
    if (!Array.isArray(body.stages) || !body.stages.length) throw new BadRequestException('La préparation doit contenir des étapes.')
    await this.db.query('INSERT INTO pf2_choice_template (module_key,body_json) VALUES (?,?) ON CONFLICT(module_key) DO UPDATE SET body_json=excluded.body_json,updated_at=CURRENT_TIMESTAMP',[moduleKey,JSON.stringify(body)])
    return {ok:true}
  }

  async saveModule(data: unknown) {
    const value = obj(data), moduleKey = str(value.moduleKey)
    const catalogue = await this.catalogue()
    if (!catalogue.modules.some(m => m.key === moduleKey)) throw new BadRequestException('Module inconnu.')
    const progress = str(value.progress)
    if (!['todo','started','done'].includes(progress)) throw new BadRequestException('Progression invalide.')
    const checklist = obj(value.checklist)
    if (!checks.every(k => ['todo','done','na'].includes(checklist[k]))) throw new BadRequestException('Checklist invalide.')
    const sanitized = Object.fromEntries(checks.map(k => [k,checklist[k]]))
    await this.db.query('INSERT INTO pf2_choice_module (module_key,checklist,progress) VALUES (?,?,?) ON CONFLICT(module_key) DO UPDATE SET checklist=excluded.checklist,progress=excluded.progress,updated_at=CURRENT_TIMESTAMP',[moduleKey,JSON.stringify(sanitized),progress])
    return { ok: true }
  }
}

/** Until the MJ portal has centralized authentication, fail closed for private links and votes. */
@Controller(['api/pf2-mj/choice-libre','api/v1/pf2-mj/choice-libre'])
export class Pf2ChoiceLibreController {
  constructor(private readonly choice: Pf2ChoiceLibreService) {}
  private guard(key: string) {
    const expected = process.env.PF2_CHOICE_MJ_KEY || ''
    if (!expected || typeof key !== 'string' || !key || Buffer.byteLength(key) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(key),Buffer.from(expected))) throw new ForbiddenException('Accès MJ Choix libre requis.')
  }
  @Header('Cache-Control', 'private, no-store')
  @Get() list(@Headers('x-pf2-choice-mj-key') key = '') { this.guard(key); return this.choice.snapshot() }
  @Header('Cache-Control', 'private, no-store')
  @Put('quests/:id') saveQuest(@Headers('x-pf2-choice-mj-key') key = '', @Param('id') id: string, @Body() data: unknown) { this.guard(key); return this.choice.saveQuest(id,data) }
  @Header('Cache-Control', 'private, no-store')
  @Get('templates') templates(@Headers('x-pf2-choice-mj-key') key = '') { this.guard(key); return this.choice.templates() }
  @Header('Cache-Control', 'private, no-store')
  @Put('templates') saveTemplate(@Headers('x-pf2-choice-mj-key') key = '', @Body() data: unknown) { this.guard(key); return this.choice.saveTemplate(data) }
  @Header('Cache-Control', 'private, no-store')
  @Put('modules') saveModule(@Headers('x-pf2-choice-mj-key') key = '', @Body() data: unknown) { this.guard(key); return this.choice.saveModule(data) }
}
