import {describe,it,expect} from 'vitest'
import {upcomingReadiness,moduleReady,moduleStateLabel,type ModuleState} from './moduleReadiness'
import {arcHref,resolvePf2Route} from './routing'
import {pdfKind,type ScenarioPdf} from './CampaignDocuments'
const m=(i:number, overrides:Partial<ModuleState>={}):ModuleState=>({key:String(i),scenarioId:'s',componentId:String(i),campaignIds:['arc'],title:'Module',order:i,campaignOrder:{arc:i},checklist:{source:'done',template:'done',entities:'done',foundry:'done',review:'done'},progress:'todo',hasTemplate:true,ready:true,...overrides})
describe('Préparation du journal',()=>{
 it('exclut les joués et distingue un trou sur le prochain module',()=>{
   expect(upcomingReadiness([m(1,{progress:'done'}),m(2,{ready:false}),m(3),m(4)],'arc',()=>false)).toEqual({count:2,total:3,label:'2/3',nextReady:false})
   expect(upcomingReadiness([1,2,3,4,5].map(i=>m(i)),'arc',m=>m.key==='1').label).toBe('3+/3')
 })
 it('ne confond pas un modèle absent avec un module prêt',()=>{
   expect(moduleReady(m(1,{hasTemplate:false}))).toBe(false)
   expect(moduleStateLabel(m(1,{hasTemplate:false}))).toBe('En préparation')
   expect(moduleStateLabel(m(1),true)).toBe('Joué')
 })
 it('ouvre les arcs sur une route stable',()=>expect(resolvePf2Route(arcHref('open-road'))).toEqual({kind:'arc',id:'open-road'}))
 it('sépare originaux, traductions et récits',()=>{
   const pdf=(filename:string,role:string|null=null):ScenarioPdf=>({id:'a',path:filename,filename,assetType:'pdf',role,language:'fr',variant:null,present:true})
   expect(pdfKind(pdf('Volume 1.pdf'))).toBe('original')
   expect(pdfKind(pdf('Origin (fr trad).pdf'))).toBe('translation')
   expect(pdfKind(pdf('Récit de campagne (info).pdf'))).toBe('story')
   expect(pdfKind(pdf('Guide des joueurs.pdf','guide_joueurs'))).toBe('other')
 })
})
