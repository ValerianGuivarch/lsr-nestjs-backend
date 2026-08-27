import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common'

@Injectable()
export class FoundryRelayService {
  private readonly baseUrl = (process.env['FOUNDRY_REST_URL'] ?? 'http://127.0.0.1:3010').replace(/\/$/, '')
  private readonly apiKey = process.env['FOUNDRY_REST_API_KEY']

  private async request(path: string): Promise<unknown> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('FOUNDRY_REST_API_KEY is not configured')
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        accept: 'application/json',
        'x-api-key': this.apiKey
      }
    })

    const text = await response.text()
    let body: unknown = text

    try {
      body = JSON.parse(text)
    } catch {}

    if (!response.ok) {
      throw new BadGatewayException({
        status: response.status,
        response: body
      })
    }

    return body
  }

  listClients(): Promise<unknown> {
    return this.request('/clients')
  }

  async listActors(): Promise<unknown> {
    const clients = await this.listClients() as {
      clients?: Array<{ clientId: string; isOnline: boolean }>
    }

    const client = clients.clients?.find(c => c.isOnline)

    if (!client) {
      throw new ServiceUnavailableException('No Foundry world online')
    }

    const params = new URLSearchParams({
      clientId: client.clientId,
      types: 'Actor',
      recursive: 'true',
      includeEntityData: 'false'
    })

    return this.request(`/structure?${params}`)
  }

  async getActor(uuid: string): Promise<unknown> {
    const clients = await this.listClients() as {
      clients?: Array<{ clientId: string; isOnline: boolean }>
    }

    const client = clients.clients?.find(c => c.isOnline)

    if (!client) {
      throw new ServiceUnavailableException('No Foundry world online')
    }

    const params = new URLSearchParams({
      clientId: client.clientId,
      uuid
    })

    return this.request(`/get?${params}`)
  }
}
