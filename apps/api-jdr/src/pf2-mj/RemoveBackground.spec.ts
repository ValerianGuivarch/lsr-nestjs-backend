import { removePortraitBackground } from './RemoveBackground'

const png = Buffer.from([137,80,78,71,13,10,26,10,0])
describe('removePortraitBackground', () => {
  it('refuse une clé absente sans appel externe', async () => {
    const request = jest.fn()
    await expect(removePortraitBackground(png, 'image/png', '', request)).rejects.toThrow('clé API')
    expect(request).not.toHaveBeenCalled()
  })
  it('ne consomme pas de crédit si le quota gratuit est épuisé', async () => {
    const request = jest.fn().mockResolvedValue(new Response(JSON.stringify({data:{attributes:{api:{free_calls:0}}}})))
    await expect(removePortraitBackground(png, 'image/png', 'test', request)).rejects.toThrow('quota gratuit')
    expect(request).toHaveBeenCalledTimes(1)
  })
  it('utilise uniquement le format de prévisualisation PNG', async () => {
    const request = jest.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({data:{attributes:{api:{free_calls:1}}}})))
      .mockResolvedValueOnce(new Response(png, {headers:{'Content-Type':'image/png'}}))
    await expect(removePortraitBackground(png, 'image/png', 'test', request)).resolves.toEqual(png)
    expect(request.mock.calls[1][1].body.get('size')).toBe('preview')
    expect(request.mock.calls[1][1].body.get('format')).toBe('png')
    // Account endpoint can temporarily report the previous balance.
    const stale = jest.fn().mockResolvedValue(new Response(JSON.stringify({data:{attributes:{api:{free_calls:1}}}})))
    await expect(removePortraitBackground(png, 'image/png', 'test', stale)).rejects.toThrow('quota gratuit')
    expect(stale).toHaveBeenCalledTimes(1)
  })
})
