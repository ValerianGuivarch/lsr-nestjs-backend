// @vitest-environment jsdom
import React,{act} from 'react'
import {createRoot} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import {describe,it,expect,vi} from 'vitest'
import ChoiceLibreWorkspace from './ChoiceLibre'
vi.mock('./SessionPreparations',()=>({default:()=> <div>Éditeur historique</div>}))
describe('Choix libre MJ',()=>{
  it('affiche les quêtes sans clé et masque les votes par défaut et enregistre une checklist',async()=>{
    ;(globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true
    const element=document.createElement('div'); document.body.append(element);const root=createRoot(element)
    const calls:RequestInit[]=[]
    const check={source:'done',template:'done',entities:'done',foundry:'todo',review:'done'}
    vi.stubGlobal('fetch',vi.fn(async (_url:RequestInfo|URL,init?:RequestInit)=>{
      calls.push(init||{})
      if(init?.method==='PUT')return new Response('{"ok":true}',{status:200})
      return new Response(JSON.stringify({campaigns:[{id:'c',title:'Campagne'}],modules:[{key:'m',scenarioId:'s',title:'Module',group:'',campaignIds:['c'],order:0,campaignOrder:{c:0},checklist:check,progress:'todo',ready:false}],quests:[
        {id:'q',title:'Explorer la fosse',url:'https://discord.com/test',kind:'mission',campaignId:'c',moduleKey:'m',note:'Préparation',syncedAt:'now',votes:[{emoji:'👍',name:'Test joueur',characters:['Test PJ']}]},
        {id:'b',title:'Piste bloquée',url:'https://discord.com/test',kind:'blocked',campaignId:'c',moduleKey:'',note:'Attendre',syncedAt:'now',votes:[]}
      ]}),{status:200})
    }))
    try{
      await act(async()=>root.render(<MemoryRouter><ChoiceLibreWorkspace campaigns={[]} scenarios={[]}/></MemoryRouter>))
      expect(element.textContent).toContain('Explorer la fosse')
      expect(element.textContent).toContain('À préparer')
      expect(element.textContent).not.toContain('Test PJ')
      expect((calls[0].headers as Record<string,string>)['x-pf2-choice-mj-key']).toBeUndefined()
      await act(async()=>element.querySelector<HTMLInputElement>('.choice-toolbar input[type=checkbox]')!.click())
      expect(element.textContent).toContain('Test PJ')
      await act(async()=>[...element.querySelectorAll('button')].find(b=>b.textContent==='Checklist du module')!.click())
      const foundry=[...element.querySelectorAll('.choice-module label')].find(l=>l.textContent?.startsWith('Foundry'))!.querySelector('select')!
      await act(async()=>{foundry.value='done';foundry.dispatchEvent(new Event('change',{bubbles:true}))})
      await act(async()=>[...element.querySelectorAll('button')].find(b=>b.textContent==='Enregistrer le module')!.click())
      expect(element.textContent).toContain('1 prêtes à jouer')
      expect(JSON.parse(calls.find(c=>c.method==='PUT')!.body as string).checklist.foundry).toBe('done')
      await act(async()=>[...element.querySelectorAll('button')].find(b=>b.textContent==='Préparer les modules')!.click())
      expect(element.textContent).toContain('Préparation permanente des modules')
      expect(element.textContent).toContain('1 module(s) prêt(s) non terminé(s)')
    }finally{await act(async()=>root.unmount());element.remove();sessionStorage.clear();vi.unstubAllGlobals()}
  })
})
