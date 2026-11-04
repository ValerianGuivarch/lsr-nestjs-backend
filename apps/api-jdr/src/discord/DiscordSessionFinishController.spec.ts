import { DiscordSessionFinishController } from './DiscordSessionFinishController'

describe('private fin-seance web controller',()=>{
  const token='t'.repeat(43)
  const service={
    sessionFinishWebState:jest.fn().mockReturnValue({number:7,groups:[]}),
    sessionFinishWebPreview:jest.fn().mockReturnValue({parts:['preview'],mock:true}),
    sessionFinishWebConfirm:jest.fn().mockResolvedValue({message:'Simulation publiée'}),
  }
  const controller=new DiscordSessionFinishController(service as never)
  beforeEach(()=>jest.clearAllMocks())

  it('serves a no-store, nonce-protected admin-token page with no third-party content',()=>{
    const headers=new Map<string,string>()
    const reply={
      header:jest.fn().mockImplementation((key:string,value:string)=>{headers.set(key,value);return reply}),
      type:jest.fn().mockImplementation(()=>reply),
      send:jest.fn().mockImplementation(()=>reply),
    }
    controller.html(token,reply as never)
    const page=reply.send.mock.calls[0][0] as string
    expect(service.sessionFinishWebState).toHaveBeenCalledWith(token)
    expect(headers.get('Cache-Control')).toContain('no-store')
    expect(headers.get('Referrer-Policy')).toBe('no-referrer')
    expect(headers.get('X-Frame-Options')).toBe('DENY')
    expect(headers.get('Content-Security-Policy')).toContain("default-src 'none'")
    expect(headers.get('Content-Security-Policy')).toContain("connect-src 'self'")
    expect(page).toContain('Fin de séance')
    expect(page).toContain('type="number"')
    expect(page).toMatch(/<script nonce="[A-Za-z0-9+/=]+">/)
    expect(page).toMatch(/<style nonce="[A-Za-z0-9+/=]+">/)
  })

  it('serves all private state with no-store headers',()=>{
    const reply={header:jest.fn()}
    expect(controller.state(token,reply as never)).toEqual({number:7,groups:[]})
    expect(reply.header).toHaveBeenCalledWith('Cache-Control','private, no-store, max-age=0')
  })

  it('checks Origin and requires explicit confirmation',async()=>{
    expect(()=>controller.preview(token,{},'https://malicious.invalid')).toThrow(/Origine/)
    expect(service.sessionFinishWebPreview).not.toHaveBeenCalled()
    expect(()=>controller.confirm(token,{},'https://l7r.fr')).toThrow(/Confirmation explicite/)
    expect(await controller.confirm(token,{confirm:true},'https://l7r.fr')).toEqual({message:'Simulation publiée'})
    expect(service.sessionFinishWebConfirm).toHaveBeenCalledWith(token)
    expect(controller.preview(token,{number:7},'https://l7r.fr')).toEqual({parts:['preview'],mock:true})
  })
})
