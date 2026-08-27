import { FoundryRelayService } from './FoundryRelayService'

describe('FoundryRelayService', () => {
  const originalUrl = process.env['FOUNDRY_REST_URL']
  const originalKey = process.env['FOUNDRY_REST_API_KEY']

  beforeEach(() => {
    process.env['FOUNDRY_REST_URL'] = 'http://relay.test'
    process.env['FOUNDRY_REST_API_KEY'] = 'test-key'
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env['FOUNDRY_REST_URL'] = originalUrl
    process.env['FOUNDRY_REST_API_KEY'] = originalKey
  })

  it('lists only world Actors and adds PF2e XP through the documented update endpoint', async () => {
    let xp = 500
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/clients')) return new Response(JSON.stringify({ clients: [{ clientId: 'world-1', isOnline: true }] }))
      if (url.includes('/structure?')) return new Response(JSON.stringify({ data: { entities: { actors: [{ uuid: 'Actor.hero', name: 'Héros', type: 'character' }, { uuid: 'Compendium.pf2e.actors.Actor.nope', name: 'Compendium' }] } } }))
      if (url.includes('/update?')) {
        const body = JSON.parse(String(init?.body)) as { data: { 'system.details.xp.value': number } }
        xp = body.data['system.details.xp.value']
        return new Response(JSON.stringify({ type: 'update-result' }))
      }
      if (url.includes('/get?')) return new Response(JSON.stringify({ entity: [{ uuid: 'Actor.hero', name: 'Héros', type: 'character', system: { details: { level: { value: 3 }, xp: { value: xp } } } }] }))
      throw new Error(`Unexpected URL: ${url}`)
    })

    const service = new FoundryRelayService()
    await expect(service.listActors()).resolves.toEqual([{ uuid: 'Actor.hero', name: 'Héros', type: 'character' }])
    await expect(service.addPlayerXp('Actor.hero', 100)).resolves.toEqual({ uuid: 'Actor.hero', before: 500, added: 100, after: 600 })
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/update?clientId=world-1&uuid=Actor.hero'), expect.objectContaining({ method: 'PUT', body: JSON.stringify({ data: { 'system.details.xp.value': 600 } }) }))
  })
})
