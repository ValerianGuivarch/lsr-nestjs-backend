import { discordScheduleHtml } from './DiscordSchedulePage'
import { DiscordScheduleController } from './DiscordScheduleController'

describe('planning web page',()=>{
  it('generates valid browser script and nonce-protected controls',()=>{
    const html=discordScheduleHtml('test-nonce')
    const script=html.match(/<script nonce="test-nonce">([\s\S]*?)<\/script>/)?.[1]
    expect(script).toBeDefined()
    expect(()=>new Function(script!)).not.toThrow()
    expect(html).toContain('Toutes les répartitions compatibles')
    expect(html).toContain('Publier les groupes')
    expect(html).not.toContain('__NONCE__')
  })
  it('rejects a non-confirmed publication and foreign origin',async()=>{
    const commands={scheduleWebConfirm:jest.fn().mockResolvedValue({message:'Publié'}),scheduleWebOptions:jest.fn()}
    const c=new DiscordScheduleController(commands as never)
    expect(()=>c.confirm('token',{confirm:false})).toThrow()
    expect(()=>c.options('token',{},'https://other.invalid')).toThrow()
    expect(commands.scheduleWebConfirm).not.toHaveBeenCalled()
    await expect(c.confirm('token',{confirm:true,index:0})).resolves.toEqual({message:'Publié'})
    expect(commands.scheduleWebConfirm).toHaveBeenCalledWith('token',{confirm:true,index:0})
  })
})
