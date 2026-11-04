import { JSDOM } from 'jsdom'
import { discordFinishHtml } from './DiscordSessionFinishPage'

const groups = [
  {id:1,name:'Pointesable',entries:[{id:1,name:'Garde de la ville',score:1}]},
  {id:2,name:'Société des Éclaireurs',entries:[{id:2,name:'Société des Éclaireurs (générale)',score:4}]},
  {id:3,name:'Absalom',entries:[{id:3,name:'Habitants d’Absalom',score:3}]},
  {id:4,name:'Autres factions',entries:[{id:4,name:'Clan des kobolds de Znu',score:6}]},
  {id:5,name:'Brechmur',entries:[{id:5,name:'Garde de Brechmur',score:0}]},
  {id:6,name:'Abberton',entries:[
    {id:20,name:'Cirque des Merveilles Vagabondes',score:13},
    {id:21,name:'Cirque de Lady Dusklight',score:-6},
    {id:24,name:'Ermitage de la Foudre Bénie',score:-7},
    {id:36,name:'Villageois d\'Abberton',score:1},
  ]},
]

const flush = async () => { await new Promise<void>(resolve => setImmediate(resolve)) }

describe('private one-page form layout',()=>{
  it('has separate XP/coin/action/item inputs and never requires editing text markers',async()=>{
    const calls:Array<{url:string; body:unknown}>=[]
    const html=discordFinishHtml('TEST_NONCE')
    expect(html).toContain('<style nonce="TEST_NONCE">')
    expect(html).toContain('<script nonce="TEST_NONCE">')
    expect(html).toContain('name="xpTotal"')
    expect(html).toContain('name="xpPerPlayer"')
    expect(html).toContain('name="gp"')
    expect(html).toContain('name="sp"')
    expect(html).toContain('name="cp"')
    expect(html).toContain('id="actions"')
    expect(html).toContain('id="loot"')
    const state={
      number:7,days:0,xpTotal:0,xpPerPlayer:0,gp:0,sp:0,cp:0,
      actions:'',loot:'',groups,changes:[],mock:true,step:'form',
    }
    const dom=new JSDOM(html,{
      runScripts:'dangerously',
      url:'https://l7r.fr/apil7r/pf2-mj/discord/fin-seance/'+'T'.repeat(43),
      beforeParse(window) {
        (window as unknown as {fetch:unknown}).fetch = (async (url:string,options?:{body?:string}) => {
          calls.push({url,body:options?.body?JSON.parse(options.body):undefined})
          if(url.endsWith('/state'))return {ok:true,json:async()=>state}
          if(url.endsWith('/preview'))return {ok:true,json:async()=>({parts:['XP group 1240','Abberton +3']})}
          if(url.endsWith('/confirm'))return {ok:true,json:async()=>({message:'Simulation publiée dans #mj'})}
          return {ok:false,status:404,json:async()=>({message:'Missing endpoint'})}
        }) as unknown as Window['fetch']
      },
    })
    try {
      await flush();await flush()
      const document=dom.window.document
      expect(document.getElementById('form')?.classList.contains('hidden')).toBe(false)
      for(const id of ['number','days','xpTotal','xpPerPlayer','actions','gp','sp','cp','loot']){
        expect(document.getElementById(id)).toBeTruthy()
      }
      expect(document.querySelectorAll('.faction-group')).toHaveLength(6)
      const reputationNames=Array.from(document.querySelectorAll('.faction-entry label')).map(node=>node.textContent)
      expect(reputationNames).toContain('Cirque des Merveilles Vagabondes')
      expect(reputationNames).toContain('Cirque de Lady Dusklight')
      expect(reputationNames).toContain('Ermitage de la Foudre Bénie')
      expect(reputationNames).toContain("Villageois d'Abberton")
      const input=(id:string) => document.getElementById(id) as HTMLInputElement
      input('xpTotal').value='1240'; input('xpPerPlayer').value='310';input('gp').value='7'
      input('sp').value='3';input('cp').value='2'
      input('actions').value='Gnome sauvé : 30XP\nChef vaincu : 1200 XP'
      input('loot').value='Potion\nAnneau magique'
      input('faction-20').value='3'
      document.getElementById('form')!.dispatchEvent(new dom.window.Event('submit',{cancelable:true}))
      await flush();await flush()
      const preview=calls.find(call=>call.url.endsWith('/preview'))!
      expect(preview.body).toMatchObject({
        number:7,xpTotal:1240,xpPerPlayer:310,gp:7,sp:3,cp:2,
        actions:'Gnome sauvé : 30XP\nChef vaincu : 1200 XP',loot:'Potion\nAnneau magique',
      })
      const values=(preview.body as {reputations:Array<{id:number;delta:number}>}).reputations
      expect(values).toHaveLength(9)
      expect(values.find(item=>item.id===20)?.delta).toBe(3)
      expect(document.getElementById('review')!.classList.contains('hidden')).toBe(false)
      document.getElementById('edit')!.click()
      expect(input('xpTotal').value).toBe('1240')
      expect(input('faction-20').value).toBe('3')
      document.getElementById('form')!.dispatchEvent(new dom.window.Event('submit',{cancelable:true}))
      await flush();await flush()
      document.getElementById('confirm')!.click()
      await flush();await flush()
      expect(calls.find(call=>call.url.endsWith('/confirm'))?.body).toEqual({confirm:true})
      expect(document.getElementById('success')?.textContent).toContain('Simulation publiée')
    }finally{dom.window.close()}
  })
})
