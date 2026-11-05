import { FoundryRelayService } from './FoundryRelayService'
import { CharacterPresentationCard, foundryChatPresentationId, renderCharacterPresentationCard } from './FoundryCharacterChat'

describe('Server-side Discord character chat delivery', () => {
  const id = 'c9012a36-6128-4c53-af2e-4c34c85bdd65'
  const card: CharacterPresentationCard = {
    id, name: 'L’orc <sans nom>', showName: true,
    portraitUrl: 'https://cdn.discordapp.com/path/photo.png?x=1&y=2',
    wikiUrl: null, token: '9a3df0bd-fafe-4d11-8bd4-c41f49fe6fc0',
  }

  it('renders safe images and a marker without exposing dangerous HTML', () => {
    const content = renderCharacterPresentationCard(card)
    expect(content).toContain('data-pf2-character-presentation-id="' + id + '"')
    expect(content).toContain('L’orc &lt;sans nom&gt;')
    expect(content).toContain('x=1&amp;y=2')
    expect(content).toContain('data-pf2-character-create="' + id + '"')
    expect(renderCharacterPresentationCard({ ...card, portraitUrl: 'javascript:alert(1)' }))
      .not.toContain('src="javascript:')
    expect(renderCharacterPresentationCard({ ...card, wikiUrl: 'https://wiki.l7r.fr/wiki/Test' }))
      .toContain('Voir la fiche')
    expect(renderCharacterPresentationCard({ ...card, showName: false }))
      .not.toContain('L’orc')
  })

  it('recognizes both historical toolkit flags and server markers', () => {
    expect(foundryChatPresentationId({
      flags: { 'pf2e-val-toolkit': { discordCharacterPresentation: { id } } },
    })).toBe(id)
    expect(foundryChatPresentationId({ content: renderCharacterPresentationCard(card) })).toBe(id)
    expect(foundryChatPresentationId({ content: 'ordinary message' })).toBeNull()
  })

  it('posts exactly once and never sends invalid numeric chatType 0', async () => {
    const relay = new FoundryRelayService()
    jest.spyOn(relay as any, 'onlineClientId').mockResolvedValue('client-id')
    const request = jest.spyOn(relay as any, 'request').mockImplementation(async (path: string, init?: RequestInit) => {
      if (path.startsWith('/chat?') && init?.method === 'POST') {
        return { success: true, data: { id: 'chat-456' } }
      }
      return { success: true, data: { messages: [] } }
    })
    await expect(relay.ensureCharacterChat(card)).resolves.toBe('chat-456')
    expect(request).toHaveBeenCalledTimes(2)
    const post = request.mock.calls.find((args: any[]) => args[1]?.method === 'POST')!
    const payload = JSON.parse((post[1] as RequestInit).body as string)
    expect(payload.chatType).toBeUndefined()
    expect(payload.alias).toBe('Gamemaster')
    expect(payload.content).toContain('data-pf2-character-presentation-id="' + id + '"')
  })

  it('does not duplicate a toolkit chat message', async () => {
    const relay = new FoundryRelayService()
    jest.spyOn(relay as any, 'onlineClientId').mockResolvedValue('client-id')
    const request = jest.spyOn(relay as any, 'request').mockResolvedValue({
      success: true,
      data: { messages: [
        { id: 'already-there', flags: { 'pf2e-val-toolkit': { discordCharacterPresentation: { id } } } },
      ] },
    })
    await expect(relay.ensureCharacterChat(card)).resolves.toBe('already-there')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('does not duplicate a relay chat message', async () => {
    const relay = new FoundryRelayService()
    jest.spyOn(relay as any, 'onlineClientId').mockResolvedValue('client-id')
    const request = jest.spyOn(relay as any, 'request').mockResolvedValue({
      success: true, data: { messages: [{ id: 'relay-message', content: renderCharacterPresentationCard(card) }] },
    })
    await expect(relay.ensureCharacterChat(card)).resolves.toBe('relay-message')
    expect(request).toHaveBeenCalledTimes(1)
  })
})
