import { FoundryRelayController } from './FoundryRelayController'
import { FoundryRelayService } from './FoundryRelayService'

describe('Foundry GM scene bridge', () => {
  const oldUrl = process.env['FOUNDRY_REST_URL']
  const oldRelayKey = process.env['FOUNDRY_REST_API_KEY']
  const oldAdminKey = process.env['PF2_JOURNALS_INTERNAL_KEY']
  const scene = 'Scene.Dtg1CvduJ1cIxccD'

  beforeEach(() => {
    process.env['FOUNDRY_REST_URL'] = 'http://relay.test'
    process.env['FOUNDRY_REST_API_KEY'] = 'relay-test-secret'
    process.env['PF2_JOURNALS_INTERNAL_KEY'] = 'internal-test-secret'
  })

  afterEach(() => {
    jest.restoreAllMocks()
    process.env['FOUNDRY_REST_URL'] = oldUrl
    process.env['FOUNDRY_REST_API_KEY'] = oldRelayKey
    process.env['PF2_JOURNALS_INTERNAL_KEY'] = oldAdminKey
  })

  it('refuses unauthenticated scene reads without contacting Foundry', () => {
    const fetchMock = jest.spyOn(global, 'fetch')
    const controller = new FoundryRelayController(new FoundryRelayService())
    expect(() => controller.gmScene(scene, '')).toThrow('Accès interne')
    expect(() => controller.gmCreateCanvas(scene, 'tokens', { name: 'Test' }, 'wrong')).toThrow('Accès interne')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails closed if the internal admin key is missing', () => {
    delete process.env['PF2_JOURNALS_INTERNAL_KEY']
    const controller = new FoundryRelayController(new FoundryRelayService())
    expect(() => controller.gmScene(scene, '')).toThrow()
  })

  it('reads a scene and its canvas with server-side Relay key and connected GM world', async () => {
    const fetched: string[] = []
    const mock = jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      fetched.push(url)
      expect((init?.headers as Record<string, string>)['x-api-key']).toBe('relay-test-secret')
      if (url.endsWith('/clients')) return new Response(JSON.stringify({ clients: [
        { clientId: 'other', worldId: 'another-world', isOnline: true },
        { clientId: 'gm-1', worldId: 'test-pf2', isOnline: true },
      ] }))
      if (url.includes('/get?')) return new Response(JSON.stringify({ entity: [{ uuid: scene, name: 'Égouts' }] }))
      if (url.includes('/canvas/notes?')) return new Response(JSON.stringify({ data: { documents: [] } }))
      throw new Error('Unexpected URL ' + url)
    })
    const controller = new FoundryRelayController(new FoundryRelayService())
    await expect(controller.gmScene(scene, 'internal-test-secret')).resolves.toMatchObject({ entity: [{ name: 'Égouts' }] })
    await expect(controller.gmCanvas(scene, 'notes', 'internal-test-secret')).resolves.toMatchObject({ data: { documents: [] } })
    expect(fetched.some((x) => x.includes('uuid=Scene.Dtg1CvduJ1cIxccD'))).toBe(true)
    expect(fetched.some((x) => x.includes('/canvas/notes?clientId=gm-1&sceneId=Dtg1CvduJ1cIxccD'))).toBe(true)
    expect(mock).toHaveBeenCalled()
  })

  it('allows only known document types and validates UUIDs before requesting clients', async () => {
    const mock = jest.spyOn(global, 'fetch')
    const controller = new FoundryRelayController(new FoundryRelayService())
    await expect(controller.gmScene('Scene.invalid', 'internal-test-secret')).rejects.toThrow('UUID')
    await expect(controller.gmCanvas(scene, 'users', 'internal-test-secret')).rejects.toThrow('calque')
    await expect(controller.gmCreateDocument('User', { name: 'no' }, 'internal-test-secret')).rejects.toThrow('Type')
    await expect(controller.gmUpdateCanvas(scene, 'tokens', '../invalid', { name: 'no' }, 'internal-test-secret')).rejects.toThrow('ID')
    expect(mock).not.toHaveBeenCalled()
  })

  it('creates an embedded token and actor through limited Relay operations', async () => {
    const requests: Array<{ url: string; method: string; body?: unknown }> = []
    jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/clients')) return new Response(JSON.stringify({ clients: [{ clientId: 'gm-1', worldId: 'test-pf2', isOnline: true }] }))
      requests.push({ url, method: init?.method ?? 'GET', body: JSON.parse(String(init?.body)) })
      return new Response(JSON.stringify({ success: true }))
    })
    const controller = new FoundryRelayController(new FoundryRelayService())
    await expect(controller.gmCreateCanvas(scene, 'tokens', { name: 'Bijan', x: 250, y: 300 }, 'internal-test-secret')).resolves.toEqual({ success: true })
    await expect(controller.gmCreateDocument('Actor', { name: 'Bijan', type: 'npc' }, 'internal-test-secret')).resolves.toEqual({ success: true })
    expect(requests[0]).toMatchObject({ method: 'POST', body: { sceneId: 'Dtg1CvduJ1cIxccD', data: { name: 'Bijan', x: 250, y: 300 } } })
    expect(requests[1]).toMatchObject({ method: 'POST', body: { entityType: 'Actor', data: { name: 'Bijan', type: 'npc' } } })
  })

  it('refuses to operate if the target Foundry world is not online', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({ clients: [{ clientId: 'other', worldId: 'other-world', isOnline: true }] })))
    const controller = new FoundryRelayController(new FoundryRelayService())
    await expect(controller.gmScene(scene, 'internal-test-secret')).rejects.toThrow('test-pf2')
  })
})
