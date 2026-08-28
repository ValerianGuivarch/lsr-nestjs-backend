import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common'

type RelayClient = { clientId?: unknown; isOnline?: unknown }
type WorldActor = { uuid: string; name: string; type?: string }
type PlayerSummary = { uuid: string; name: string; level: number; xp: number; xpc: number }
type CareerState = { xpc: number; level: number; xp: number }
const XP_PER_LEVEL = 1_000
const CAREER_XP_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 300, 3: 900, 4: 2_700, 5: 6_500, 6: 14_000, 7: 23_000,
  8: 34_000, 9: 48_000, 10: 65_000, 11: 84_000, 12: 105_000,
  13: 127_000, 14: 151_000, 15: 177_000, 16: 205_000, 17: 236_000,
  18: 271_000, 19: 311_000, 20: 356_000
}
const MAX_CAREER_LEVEL = 20

@Injectable()
export class FoundryRelayService {
  private readonly baseUrl = (process.env['FOUNDRY_REST_URL'] ?? 'http://127.0.0.1:3010').replace(/\/$/, '')
  private readonly apiKey = process.env['FOUNDRY_REST_API_KEY']

  private async request(path: string, init: RequestInit = {}, timeoutMs = 10_000): Promise<unknown> {
    if (!this.apiKey) throw new ServiceUnavailableException('FOUNDRY_REST_API_KEY is not configured')
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, { ...init, headers: { accept: 'application/json', 'x-api-key': this.apiKey, ...init.headers }, signal: AbortSignal.timeout(timeoutMs) })
    } catch (error) {
      throw new ServiceUnavailableException({ message: 'Foundry REST Relay is offline', cause: error instanceof Error ? error.message : undefined })
    }
    const text = await response.text()
    let body: unknown = text
    try { body = JSON.parse(text) } catch { /* The Relay can return a plain-text error body. */ }
    if (!response.ok) throw new BadGatewayException({ status: response.status, response: body })
    return body
  }

  listClients(): Promise<unknown> { return this.request('/clients') }

  async listActors(): Promise<WorldActor[]> {
    return this.listRootWorldActors(await this.onlineClientId())
  }

  async getActor(uuid: string): Promise<unknown> {
    return this.getActorFromWorld(await this.onlineClientId(), this.actorUuid(uuid))
  }

  async listPlayers(): Promise<PlayerSummary[]> {
    const clientId = await this.onlineClientId()
    const actors = await this.listRootWorldActors(clientId)
    const players = await this.mapWithConcurrency(actors, 4, (actor) => this.playerFromActor(actor.uuid, true, clientId))
    return players.filter((player): player is PlayerSummary => player !== null).sort((left, right) => left.name.localeCompare(right.name, 'fr'))
  }

  async getPlayerXp(uuid: string): Promise<{ uuid: string; xp: number; level: number }> {
    const player = await this.requirePlayer(uuid)
    return { uuid: player.uuid, xp: player.xp, level: player.level }
  }

  async setPlayerXp(uuid: string, value: unknown): Promise<{ uuid: string; xp: number; level: number; xpc: number }> {
    const player = await this.requirePlayer(uuid)
    return this.writeCareer(player.uuid, this.xpcFromPf2Progress(player.level, this.legacyXpValue(value, 'xp')))
  }

  async addPlayerXp(uuid: string, value: unknown): Promise<{ uuid: string; before: number; added: number; after: number }> {
    const added = this.nonNegativeInteger(value, 'added')
    const player = await this.requirePlayer(uuid)
    const after = await this.writeCareer(player.uuid, player.xpc + added)
    return { uuid: player.uuid, before: player.xp, added, after: after.xp }
  }

  async getPlayerXpc(uuid: string): Promise<{ uuid: string; xpc: number; level: number; xp: number }> {
    const player = await this.requirePlayer(uuid)
    return this.careerResponse(player.uuid, player.xpc)
  }

  async setPlayerXpc(uuid: string, value: unknown): Promise<{ uuid: string; xpc: number; level: number; xp: number }> {
    const player = await this.requirePlayer(uuid)
    return this.writeCareer(player.uuid, this.nonNegativeInteger(value, 'xpc'))
  }

  async addPlayerXpc(uuid: string, value: unknown): Promise<{ uuid: string; before: number; added: number; after: number; level: number; xp: number }> {
    const player = await this.requirePlayer(uuid)
    const added = this.signedInteger(value, 'added')
    const after = player.xpc + added
    if (after < 0) throw new BadRequestException('Le total XPC ne peut pas devenir négatif.')
    const state = await this.writeCareer(player.uuid, after)
    return { uuid: player.uuid, before: player.xpc, added, after: state.xpc, level: state.level, xp: state.xp }
  }

  private async writeCareer(uuid: string, xpc: number, clientId?: string): Promise<{ uuid: string; xpc: number; level: number; xp: number }> {
    const state = this.careerState(xpc)
    await this.updateActor(uuid, { [this.xpcPath()]: state.xpc }, clientId)
    return { uuid, ...state }
  }

  private careerResponse(uuid: string, xpc: number): { uuid: string; xpc: number; level: number; xp: number } {
    return { uuid, ...this.careerState(xpc) }
  }

  private careerState(xpc: number): CareerState {
    const level = this.levelForXpc(xpc)
    const threshold = CAREER_XP_THRESHOLDS[level]
    const nextThreshold = level === MAX_CAREER_LEVEL ? null : CAREER_XP_THRESHOLDS[level + 1]
    const xp = nextThreshold === null
      ? XP_PER_LEVEL
      : Math.min(XP_PER_LEVEL - 1, Math.floor(((xpc - threshold) / (nextThreshold - threshold)) * XP_PER_LEVEL))
    return { xpc, level, xp }
  }

  private levelForXpc(xpc: number): number {
    for (let level = MAX_CAREER_LEVEL; level >= 1; level -= 1) {
      if (xpc >= CAREER_XP_THRESHOLDS[level]) return level
    }
    return 1
  }

  private xpcFromPf2Progress(level: number, xp: number): number {
    const clampedLevel = Math.max(1, Math.min(MAX_CAREER_LEVEL, level))
    const threshold = CAREER_XP_THRESHOLDS[clampedLevel]
    if (clampedLevel === MAX_CAREER_LEVEL) return threshold + xp
    const nextThreshold = CAREER_XP_THRESHOLDS[clampedLevel + 1]
    return threshold + Math.floor((xp / XP_PER_LEVEL) * (nextThreshold - threshold))
  }

  private async updateActor(uuid: string, data: Record<string, number>, clientId?: string): Promise<void> {
    const params = new URLSearchParams({ clientId: clientId ?? await this.onlineClientId(), uuid })
    await this.request(`/update?${params}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data }) })
  }

  private async listRootWorldActors(clientId: string): Promise<WorldActor[]> {
    const params = new URLSearchParams({ clientId, types: 'Actor', recursive: 'true', includeEntityData: 'false' })
    return this.collectRootWorldActors(await this.request(`/structure?${params}`, {}, 30_000))
  }

  private async getActorFromWorld(clientId: string, uuid: string): Promise<unknown> {
    const params = new URLSearchParams({ clientId, uuid })
    return this.request(`/get?${params}`, {}, 30_000)
  }

  private async onlineClientId(): Promise<string> {
    const response = await this.listClients() as { clients?: RelayClient[] }
    const client = response.clients?.find((item) => item?.isOnline === true && typeof item.clientId === 'string' && item.clientId)
    if (!client || typeof client.clientId !== 'string') throw new ServiceUnavailableException('No Foundry world online')
    return client.clientId
  }

  private actorUuid(value: string): string {
    if (!/^Actor\.[A-Za-z0-9]+$/.test(value)) throw new BadRequestException('UUID Actor de monde invalide.')
    return value
  }

  private async requirePlayer(uuid: string): Promise<PlayerSummary> {
    const player = await this.playerFromActor(this.actorUuid(uuid))
    if (!player) throw new BadRequestException('Cet Actor n’est pas un PJ PF2e.')
    return player
  }

  private async playerFromActor(uuid: string, migrate = true, clientId?: string): Promise<PlayerSummary | null> {
    const entity = this.unwrapEntity(clientId ? await this.getActorFromWorld(clientId, uuid) : await this.getActor(uuid))
    if (entity.type !== 'character') return null
    const flags = this.object(this.object(entity.flags)[this.xpcFlagScope()])
    if (!this.isNonNegativeInteger(flags.xpc)) {
      const legacy = this.legacyState(entity)
      const migrated = this.xpcFromPf2Progress(legacy.level, legacy.xp)
      if (migrate) {
        await this.writeCareer(uuid, migrated, clientId)
        return this.playerFromActor(uuid, false, clientId)
      }
      return { uuid, name: this.playerName(entity, uuid), ...this.careerState(migrated) }
    }
    return { uuid, name: this.playerName(entity, uuid), ...this.careerState(flags.xpc) }
  }

  private legacyState(entity: Record<string, unknown>): { level: number; xp: number } {
    const details = this.object(this.object(entity.system).details)
    const xp = this.object(details.xp)
    const level = this.object(details.level)
    const value = typeof xp.value === 'number' ? xp.value : Number(xp.value)
    const currentLevel = typeof level.value === 'number' ? level.value : Number(level.value)
    if (!Number.isInteger(value) || value < 0 || value > XP_PER_LEVEL || !Number.isInteger(currentLevel) || currentLevel < 1) throw new BadGatewayException('Niveau ou XP PF2e invalide dans Foundry.')
    return { level: currentLevel, xp: value }
  }

  private playerName(entity: Record<string, unknown>, uuid: string): string { return typeof entity.name === 'string' ? entity.name : uuid }

  private xpcPath(): string { return `flags.${this.xpcFlagScope()}.xpc` }

  private xpcFlagScope(): string {
    const scope = process.env['FOUNDRY_XPC_FLAG_SCOPE']?.trim()
    if (!scope || !/^[a-z0-9][a-z0-9_-]*$/i.test(scope)) throw new ServiceUnavailableException('FOUNDRY_XPC_FLAG_SCOPE is not configured')
    return scope
  }

  private unwrapEntity(value: unknown): Record<string, unknown> {
    const root = this.object(value)
    const entity = Array.isArray(root.entity) ? root.entity[0] : root.entity ?? value
    const resolved = this.object(entity)
    if (!Object.keys(resolved).length) throw new BadGatewayException('Réponse Actor invalide du Relay.')
    return resolved
  }

  private collectRootWorldActors(value: unknown): WorldActor[] {
    const root = this.object(value)
    const data = this.object(root.data)
    const entities = this.object(data.entities ?? root.entities)
    const actors = Array.isArray(entities.actors) ? entities.actors : []
    return actors.flatMap((candidate) => {
      const item = this.object(candidate)
      const uuid = typeof item.uuid === 'string' ? item.uuid : ''
      if (!/^Actor\.[A-Za-z0-9]+$/.test(uuid)) return []
      return [{ uuid, name: typeof item.name === 'string' ? item.name : uuid, type: typeof item.type === 'string' ? item.type : undefined }]
    }).sort((left, right) => left.name.localeCompare(right.name, 'fr'))
  }

  private async mapWithConcurrency<T, Result>(items: T[], limit: number, mapper: (item: T) => Promise<Result>): Promise<Result[]> {
    const results = new Array<Result>(items.length)
    let nextIndex = 0
    const worker = async (): Promise<void> => {
      while (nextIndex < items.length) {
        const index = nextIndex
        nextIndex += 1
        results[index] = await mapper(items[index])
      }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
    return results
  }

  private isNonNegativeInteger(value: unknown): value is number { return typeof value === 'number' && Number.isInteger(value) && value >= 0 }
  private nonNegativeInteger(value: unknown, label: string): number { if (!this.isNonNegativeInteger(value)) throw new BadRequestException(`${label} doit être un entier positif ou nul.`); return value }
  private signedInteger(value: unknown, label: string): number { if (typeof value !== 'number' || !Number.isInteger(value)) throw new BadRequestException(`${label} doit être un entier signé.`); return value }
  private legacyXpValue(value: unknown, label: string): number { const xp = this.nonNegativeInteger(value, label); if (xp > XP_PER_LEVEL) throw new BadRequestException(`${label} doit être un entier entre 0 et 1000.`); return xp }

  private object(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
}
