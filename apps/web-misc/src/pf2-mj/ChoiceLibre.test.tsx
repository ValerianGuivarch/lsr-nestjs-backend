// @vitest-environment jsdom
import React,{act} from 'react'
import {createRoot} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import {describe,it,expect,vi} from 'vitest'
import ChoiceLibreWorkspace from './ChoiceLibre'
vi.mock('./SessionPreparations',()=>({default:({templateModule,templateChecklist}:{templateModule?:{title:string};templateChecklist?:React.ReactNode})=> <div>{templateModule?'Éditeur modèle '+templateModule.title:'Éditeur historique'}{templateChecklist}</div>}))
describe('Choix libre MJ',()=>{
  it('affiche les quêtes sans clé et masque les votes par défaut et enregistre une checklist',async()=>{
    ;(globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true
    const element=document.createElement('div'); document.body.append(element);const root=createRoot(element)
    const calls:RequestInit[]=[]
    const check={source:'done',template:'done',entities:'done',foundry:'partial',review:'done'}
    vi.stubGlobal('fetch',vi.fn(async (_url:RequestInfo|URL,init?:RequestInit)=>{
      calls.push(init||{})
      if(init?.method==='PUT')return new Response('{"ok":true}',{status:200})
      return new Response(JSON.stringify({campaigns:[{id:'c',title:'Campagne'},{id:'excluded',title:'Brise-Enfers'}],modules:[{key:'m',scenarioId:'s',componentId:'',hasTemplate:true,title:'Module',group:'',campaignIds:['c'],order:0,campaignOrder:{c:0},checklist:check,remainingTasks:'Portrait de Nalla',progress:'todo',ready:false}],characters:[{id:'eos',title:'Eos'},{id:'eryn',title:'Eryn'}],quests:[
        {id:'q',title:'Explorer la fosse',url:'https://discord.com/test',nature:'mission',blocked:false,personal:false,characterIds:[],dependsOnQuestId:'',campaignId:'c',moduleKey:'m',note:'Préparation',syncedAt:'now',votes:[{emoji:'👍',name:'Test joueur',characters:['Test PJ']}]},
        {id:'b',title:'Piste bloquée',url:'https://discord.com/test',nature:'rp',blocked:true,personal:false,characterIds:[],dependsOnQuestId:'',campaignId:'c',moduleKey:'',note:'Attendre',syncedAt:'now',votes:[]}
      ]}),{status:200})
    }))
    try{
      await act(async()=>root.render(<MemoryRouter><ChoiceLibreWorkspace campaigns={[]} scenarios={[]} activeWorks={[{id:'c',title:'Campagne'}]}/></MemoryRouter>))
      expect(element.textContent).toContain('Explorer la fosse')
      expect(element.textContent).toContain('À préparer')
      expect(element.textContent).toContain('1 en préparation')
      expect(element.textContent).toContain('4/5 vérifiés')
      expect(element.textContent).not.toContain('Test PJ')
      expect((calls[0].headers as Record<string,string>)['x-pf2-choice-mj-key']).toBeUndefined()
      await act(async()=>element.querySelector<HTMLInputElement>('.choice-toolbar input[type=checkbox]')!.click())
      expect(element.textContent).toContain('Test PJ')
      await act(async()=>[...element.querySelectorAll('button')].find(b=>b.textContent==='Modèles de préparation')!.click())
      expect(element.textContent).toContain('Préparation permanente des modules')
      expect(element.textContent).not.toContain('Brise-Enfers')
      await act(async()=>[...element.querySelectorAll('button')].find(b=>b.textContent==='Modifier le modèle')!.click())
      expect(element.textContent).toContain('Éditeur modèle Campagne — Module')
      const foundry=[...element.querySelectorAll('.choice-module label')].find(l=>l.textContent?.startsWith('Foundry'))!.querySelector('select')!
      await act(async()=>{foundry.value='done';foundry.dispatchEvent(new Event('change',{bubbles:true}))})
      const remaining=element.querySelector<HTMLTextAreaElement>('.choice-module textarea')!
      expect(remaining.value).toBe('Portrait de Nalla')
      await act(async()=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')!.set!.call(remaining,'Contrôler le journal');remaining.dispatchEvent(new Event('input',{bubbles:true}))})
      await act(async()=>[...element.querySelectorAll('button')].find(b=>b.textContent==='Enregistrer le module')!.click())
      expect(JSON.parse(calls.find(c=>c.method==='PUT')!.body as string).remainingTasks).toBe('Contrôler le journal')
      expect(element.querySelector<HTMLTextAreaElement>('.choice-module textarea')!.value).toBe('Contrôler le journal')
      expect(JSON.parse(calls.find(c=>c.method==='PUT')!.body as string).checklist.foundry).toBe('done')
      expect(element.textContent).toContain('5/5 vérifiés')
    }finally{await act(async()=>root.unmount());element.remove();sessionStorage.clear();vi.unstubAllGlobals()}
  })
})
