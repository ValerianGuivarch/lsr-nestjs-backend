import { FoundryRelayService } from './FoundryRelayService'

describe('FoundryRelayService', () => {
  const originalUrl = process.env['FOUNDRY_REST_URL']
  const originalKey = process.env['FOUNDRY_REST_API_KEY']
  const originalScope = process.env['FOUNDRY_XPC_FLAG_SCOPE']

  beforeEach(() => {
    process.env['FOUNDRY_REST_URL'] = 'http://relay.test'
    process.env['FOUNDRY_REST_API_KEY'] = 'test-key'
    process.env['FOUNDRY_XPC_FLAG_SCOPE'] = 'pf2e-val-toolkit'
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env['FOUNDRY_REST_URL'] = originalUrl
    process.env['FOUNDRY_REST_API_KEY'] = originalKey
    process.env['FOUNDRY_XPC_FLAG_SCOPE'] = originalScope
  })

  it('uses the Toolkit XPC flag as the source of truth and derives PF2e progress', async () => {
    let xpc = 2_430
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/clients')) return new Response(JSON.stringify({ clients: [{ clientId: 'world-1', isOnline: true }] }))
      if (url.includes('/structure?')) return new Response(JSON.stringify({ data: { entities: { actors: [{ uuid: 'Actor.hero', name: 'Héros', type: 'character' }, { uuid: 'Compendium.pf2e.actors.Actor.nope', name: 'Compendium' }] } } }))
      if (url.includes('/update?')) {
        const body = JSON.parse(String(init?.body)) as { data: { 'flags.pf2e-val-toolkit.xpc': number } }
        xpc = body.data['flags.pf2e-val-toolkit.xpc']
        return new Response(JSON.stringify({ type: 'update-result' }))
      }
      if (url.includes('/get?')) return new Response(JSON.stringify({ entity: [{ uuid: 'Actor.hero', name: 'Héros', type: 'character', flags: { 'pf2e-val-toolkit': { xpc } }, system: { details: { level: { value: 3 }, xp: { value: 850 } } } }] }))
      throw new Error(`Unexpected URL: ${url}`)
    })

    const service = new FoundryRelayService()
    await expect(service.listActors()).resolves.toEqual([{ uuid: 'Actor.hero', name: 'Héros', type: 'character' }])
    await expect(service.getPlayerXpc('Actor.hero')).resolves.toEqual({ uuid: 'Actor.hero', xpc: 2_430, level: 3, xp: 850 })
    await expect(service.addPlayerXpc('Actor.hero', 700)).resolves.toEqual({ uuid: 'Actor.hero', before: 2_430, added: 700, after: 3_130, level: 4, xp: 113 })
    await expect(service.addPlayerXpc('Actor.hero', -200)).resolves.toEqual({ uuid: 'Actor.hero', before: 3_130, added: -200, after: 2_930, level: 4, xp: 60 })
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/update?clientId=world-1&uuid=Actor.hero'), expect.objectContaining({ method: 'PUT', body: JSON.stringify({ data: { 'flags.pf2e-val-toolkit.xpc': 3_130 } }) }))
  })

  it('migrates a PJ without XPC from its existing PF2e level and XP', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      if (url.endsWith('/clients')) return new Response(JSON.stringify({ clients: [{ clientId: 'world-1', isOnline: true }] }))
      if (url.includes('/update?')) return new Response(JSON.stringify({ type: 'update-result' }))
      if (url.includes('/get?')) return new Response(JSON.stringify({ entity: [{ uuid: 'Actor.hero', name: 'Héros', type: 'character', system: { details: { level: { value: 3 }, xp: { value: 430 } } } }] }))
      throw new Error(`Unexpected URL: ${url}`)
    })

    await expect(new FoundryRelayService().getPlayerXpc('Actor.hero')).resolves.toEqual({ uuid: 'Actor.hero', xpc: 1_674, level: 3, xp: 430 })
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/update?clientId=world-1&uuid=Actor.hero'), expect.objectContaining({ body: JSON.stringify({ data: { 'flags.pf2e-val-toolkit.xpc': 1_674 } }) }))
  })
})
