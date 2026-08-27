import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common'

type RelayClient = { clientId?: unknown; isOnline?: unknown }
type WorldActor = { uuid: string; name: string; type?: string }
type PlayerSummary = { uuid: string; name: string; level: number | null; xp: number }
const XP_PATH = 'system.details.xp.value'

@Injectable()
export class FoundryRelayService {
  private readonly baseUrl = (process.env['FOUNDRY_REST_URL'] ?? 'http://127.0.0.1:3010').replace(/\/$/, '')
  private readonly apiKey = process.env['FOUNDRY_REST_API_KEY']

  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    if (!this.apiKey) throw new ServiceUnavailableException('FOUNDRY_REST_API_KEY is not configured')
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`, { ...init, headers: { accept: 'application/json', 'x-api-key': this.apiKey, ...init.headers }, signal: AbortSignal.timeout(10_000) })
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
    const params = new URLSearchParams({ clientId: await this.onlineClientId(), types: 'Actor', recursive: 'true', includeEntityData: 'false' })
    return this.collectWorldActors(await this.request(`/structure?${params}`))
  }

  async getActor(uuid: string): Promise<unknown> {
    const params = new URLSearchParams({ clientId: await this.onlineClientId(), uuid: this.actorUuid(uuid) })
    return this.request(`/get?${params}`)
  }

  async listPlayers(): Promise<PlayerSummary[]> {
    const players = await Promise.all((await this.listActors()).map((actor) => this.playerFromActor(actor.uuid)))
    return players.filter((player): player is PlayerSummary => player !== null)
  }

  async getPlayerXp(uuid: string): Promise<{ uuid: string; xp: number }> {
    const player = await this.requirePlayer(uuid)
    return { uuid: player.uuid, xp: player.xp }
  }

  async setPlayerXp(uuid: string, value: unknown): Promise<{ uuid: string; xp: number }> {
    const player = await this.requirePlayer(uuid)
    await this.updateActor(player.uuid, this.xpValue(value, 'xp'))
    return { uuid: player.uuid, xp: (await this.requirePlayer(player.uuid)).xp }
  }

  async addPlayerXp(uuid: string, value: unknown): Promise<{ uuid: string; before: number; added: number; after: number }> {
    const added = this.xpValue(value, 'added')
    const player = await this.requirePlayer(uuid)
    const after = this.xpValue(player.xp + added, 'after')
    await this.updateActor(player.uuid, after)
    return { uuid: player.uuid, before: player.xp, added, after: (await this.requirePlayer(player.uuid)).xp }
  }

  private async updateActor(uuid: string, xp: number): Promise<void> {
    const params = new URLSearchParams({ clientId: await this.onlineClientId(), uuid })
    await this.request(`/update?${params}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: { [XP_PATH]: xp } }) })
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

  private async playerFromActor(uuid: string): Promise<PlayerSummary | null> {
    const entity = this.unwrapEntity(await this.getActor(uuid))
    if (entity.type !== 'character') return null
    const details = this.object(this.object(entity.system).details)
    const xp = this.object(details.xp)
    const level = this.object(details.level)
    const value = typeof xp.value === 'number' ? xp.value : Number(xp.value)
    if (!Number.isInteger(value) || value < 0 || value > 1000) throw new BadGatewayException('XP PF2e invalide dans Foundry.')
    return { uuid, name: typeof entity.name === 'string' ? entity.name : uuid, level: typeof level.value === 'number' ? level.value : null, xp: value }
  }

  private unwrapEntity(value: unknown): Record<string, unknown> {
    const root = this.object(value)
    const entity = Array.isArray(root.entity) ? root.entity[0] : root.entity ?? value
    const resolved = this.object(entity)
    if (!Object.keys(resolved).length) throw new BadGatewayException('Réponse Actor invalide du Relay.')
    return resolved
  }

  private collectWorldActors(value: unknown): WorldActor[] {
    const found = new Map<string, WorldActor>()
    const visit = (candidate: unknown): void => {
      if (Array.isArray(candidate)) return candidate.forEach(visit)
      const item = this.object(candidate)
      const uuid = typeof item.uuid === 'string' ? item.uuid : ''
      if (/^Actor\.[A-Za-z0-9]+$/.test(uuid)) found.set(uuid, { uuid, name: typeof item.name === 'string' ? item.name : uuid, type: typeof item.type === 'string' ? item.type : undefined })
      Object.values(item).forEach(visit)
    }
    visit(value)
    return [...found.values()].sort((left, right) => left.name.localeCompare(right.name, 'fr'))
  }

  private xpValue(value: unknown, label: string): number {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 1000) throw new BadRequestException(`${label} doit être un entier entre 0 et 1000.`)
    return value
  }

  private object(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {} }
}
