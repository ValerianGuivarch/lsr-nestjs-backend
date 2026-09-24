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

  it('reads only root world Actors and limits detail requests while selecting PF2e characters', async () => {
    const rootActors = ['zara', 'bryn', 'nora', 'aimee', 'npc', 'dorian']
    const requestedActors: string[] = []
    let activeGets = 0
    let maximumConcurrentGets = 0
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      if (url.endsWith('/clients')) return new Response(JSON.stringify({ clients: [{ clientId: 'world-1', isOnline: true }] }))
      if (url.includes('/structure?')) {
        return new Response(JSON.stringify({
          data: {
            entities: {
              actors: rootActors.map((id) => ({ uuid: `Actor.${id}`, name: id })),
              folders: [{ entities: { actors: [{ uuid: 'Actor.folder-npc', name: 'Ne pas charger' }] } }],
              compendiums: [{ entities: { actors: [{ uuid: 'Compendium.pf2e.actors.Actor.nope', name: 'Ne pas charger' }] } }]
            }
          }
        }))
      }
      if (url.includes('/get?')) {
        const uuid = new URL(url).searchParams.get('uuid')
        if (!uuid) throw new Error('Missing Actor UUID')
        requestedActors.push(uuid)
        activeGets += 1
        maximumConcurrentGets = Math.max(maximumConcurrentGets, activeGets)
        await new Promise((resolve) => setTimeout(resolve, 1))
        activeGets -= 1
        const id = uuid.replace('Actor.', '')
        return new Response(JSON.stringify({ entity: [{ uuid, name: id === 'aimee' ? 'Aimée' : id, type: id === 'npc' ? 'npc' : 'character', flags: { 'pf2e-val-toolkit': { xpc: 0 } } }] }))
      }
      throw new Error(`Unexpected URL: ${url}`)
    })

    await expect(new FoundryRelayService().listPlayers()).resolves.toEqual([
      { uuid: 'Actor.aimee', name: 'Aimée', xpc: 0, level: 1, xp: 0 },
      { uuid: 'Actor.bryn', name: 'bryn', xpc: 0, level: 1, xp: 0 },
      { uuid: 'Actor.dorian', name: 'dorian', xpc: 0, level: 1, xp: 0 },
      { uuid: 'Actor.nora', name: 'nora', xpc: 0, level: 1, xp: 0 },
      { uuid: 'Actor.zara', name: 'zara', xpc: 0, level: 1, xp: 0 }
    ])
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('includeEntityData=false'), expect.anything())
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('includeEntityData=true'), expect.anything())
    expect(requestedActors).toEqual(expect.arrayContaining(rootActors.map((id) => `Actor.${id}`)))
    expect(requestedActors).not.toContain('Actor.folder-npc')
    expect(maximumConcurrentGets).toBeLessThanOrEqual(4)
  })

  it('uploads a portrait then updates only the Actor portrait and an uncustomized token', async () => {
    const requests: Array<{ url: string; body: unknown }> = []
    jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      requests.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined })
      if (url.endsWith('/clients')) return new Response(JSON.stringify({ clients: [{ clientId: 'world-1', isOnline: true }] }))
      if (url.includes('/upload?')) return new Response(JSON.stringify({ success: true, path: 'assets/l7r/portraits/janira.webp' }))
      if (url.includes('/get?')) return new Response(JSON.stringify({ entity: [{ uuid: 'Actor.janira', name: 'Janira Gavix', type: 'npc', img: 'old.webp', prototypeToken: { texture: { src: 'old.webp' } } }] }))
      if (url.includes('/update?')) return new Response(JSON.stringify({ success: true }))
      throw new Error(`Unexpected URL: ${url}`)
    })

    const service = new FoundryRelayService()
    await expect(service.uploadPortrait(Buffer.from('image'), 'janira.webp', 'image/webp')).resolves.toBe('assets/l7r/portraits/janira.webp')
    await service.syncActorPortrait('Actor.janira', 'assets/l7r/portraits/janira.webp')

    expect(requests.find((request) => request.url.includes('/upload?'))?.body).toEqual(expect.objectContaining({ path: 'assets/l7r/portraits', filename: 'janira.webp', source: 'data', mimeType: 'image/webp', overwrite: true, fileData: Buffer.from('image').toString('base64') }))
    expect(requests.find((request) => request.url.includes('/update?'))?.body).toEqual({ data: { img: 'assets/l7r/portraits/janira.webp', 'prototypeToken.texture.src': 'assets/l7r/portraits/janira.webp' } })
  })

  it('creates one minimal NPC placeholder through the verified Relay create contract', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/clients')) return new Response(JSON.stringify({ clients: [{ clientId: 'world-1', isOnline: true }] }))
      if (url.includes('/create?')) {
        expect(JSON.parse(String(init?.body))).toEqual({ entityType: 'Actor', data: { name: 'Janira Gavix', type: 'npc', img: 'assets/l7r/portraits/janira.webp', prototypeToken: { texture: { src: 'assets/l7r/portraits/janira.webp' } } } })
        return new Response(JSON.stringify({ type: 'create-result', uuid: 'Actor.janira', entity: { name: 'Janira Gavix' } }))
      }
      throw new Error(`Unexpected URL: ${url}`)
    })
    await expect(new FoundryRelayService().createNpcPlaceholder('Janira Gavix', 'assets/l7r/portraits/janira.webp')).resolves.toEqual({ uuid: 'Actor.janira', name: 'Janira Gavix' })
  })
})
