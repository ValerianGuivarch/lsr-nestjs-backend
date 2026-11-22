import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SessionPreparations from './SessionPreparations'
import './ChoiceLibre.css'
import { moduleDisplayTitle, moduleInWork, sortedWorks } from './moduleLabels'
import { moduleReady, moduleStateLabel, checklistCount } from './moduleReadiness'

type Option = { id: string; title: string }
type Kind = 'unassigned' | 'mission' | 'blocked' | 'personal' | 'rp'
type CheckState = 'todo' | 'partial' | 'done' | 'na'
type Progress = 'todo' | 'started' | 'done'
const kinds: Record<Kind,string> = { unassigned: 'À rattacher', mission: 'Mission jouable', blocked: 'Bloquée', personal: 'Quête de PJ', rp: 'Piste RP' }
const checkLabels = { source:'Scénario étudié', template:'Préparation de séance', entities:'PNJ, rencontres et objets', foundry:'Foundry', review:'Ajustements MJ' }
type Check = keyof typeof checkLabels
type Module = { key:string; scenarioId:string; componentId:string; title:string; group:string; campaignIds:string[]; order:number; campaignOrder:Record<string,number>; checklist:Record<Check,CheckState>; remainingTasks:string; progress:Progress; ready:boolean; hasTemplate:boolean }
type Quest = { id:string; title:string; url:string; syncedAt:string; kind:Kind; campaignId:string; moduleKey:string; note:string; votes:{ emoji:string; name:string; characters:string[] }[] }
type Snapshot = { quests:Quest[]; campaigns:Option[]; modules:Module[] }

const endpoint = '/apil7r/pf2-mj/choice-libre'
async function request<T>(path='', data?:unknown):Promise<T> {
  const response = await fetch(endpoint + path, { cache:'no-store', headers:{ ...(data === undefined ? {} : {'Content-Type':'application/json'}) }, ...(data === undefined ? {} : {method:'PUT',body:JSON.stringify(data)}) })
  if (!response.ok) throw new Error('Erreur HTTP '+response.status)
  return response.json()
}
function readiness(q:Quest,m?:Module) {
  if (q.kind==='blocked') return 'Bloquée'
  if (q.kind==='personal') return 'Quête personnelle'
  if (q.kind==='rp') return 'Piste RP'
  if (q.kind==='unassigned') return 'À rattacher'
  if (!m) return q.campaignId ? 'Module à choisir' : 'Sans module'
  if (m.progress==='done') return 'Joué — choisir la suite'
  return moduleReady(m) ? 'Prêt à jouer' : 'À préparer'
}
function ModuleEditor({module, save}:{module:Module;save:(m:Module)=>Promise<void>}) {
  const [draft,setDraft]=useState(module)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const count=Object.values(draft.checklist).filter(v=>v==='done'||v==='na').length
  const partial=Object.values(draft.checklist).filter(v=>v==='partial').length
  return <div className="choice-module">
    <h4>{module.title} · {count}/5 vérifiés{partial>0?` · ${partial} en préparation`:''}</h4>
    {Object.entries(checkLabels).map(([id,label])=><label key={id}>{label}<select value={draft.checklist[id as Check]} onChange={e=>setDraft(d=>({...d,checklist:{...d.checklist,[id]:e.target.value as CheckState}}))}><option value="todo">À faire</option><option value="partial">Partiellement prêt</option><option value="done">Prêt</option><option value="na">Non applicable</option></select></label>)}
    <label>Progression <select value={draft.progress} onChange={e=>setDraft(d=>({...d,progress:e.target.value as Progress}))}><option value="todo">Non joué</option><option value="started">Commencé</option><option value="done">Joué</option></select></label>
    <label>Reste à faire<textarea rows={5} maxLength={12000} value={draft.remainingTasks ?? ''} placeholder="Portraits, vérifications Foundry, ajustements MJ…" onChange={e=>setDraft(d=>({...d,remainingTasks:e.target.value}))}/></label>
    {error && <p role="alert">{error}</p>}
    <button disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await save(draft)}catch(e){setError(String(e))}finally{setBusy(false)}}}>Enregistrer le module</button>
  </div>
}
function QuestCard({quest,data,activeWorks,showVotes,save,openTemplate}:{quest:Quest;data:Snapshot;activeWorks:Option[];showVotes:boolean;save:(q:Quest)=>Promise<void>;openTemplate:(m:Module)=>void}) {
  const [draft,setDraft]=useState(quest)
  const [editing,setEditing]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
    const next=data.modules.find(m=>m.key===quest.moduleKey)
  const options=data.modules.filter(m=>draft.campaignId&&moduleInWork(m,draft.campaignId)).sort((a,b)=>(a.campaignOrder[draft.campaignId]??a.order)-(b.campaignOrder[draft.campaignId]??b.order)||a.title.localeCompare(b.title,'fr'))
  const status=readiness(quest,next)
  const questWorks=sortedWorks([...activeWorks,...data.campaigns.filter(c=>c.id===draft.campaignId)])
  return <article className="choice-quest">
    <div className="choice-head"><div><a href={quest.url} target="_blank" rel="noreferrer">{quest.title}</a><div className="choice-meta">{data.campaigns.find(c=>c.id===quest.campaignId)?.title || 'Aucune campagne'}{next?' · '+moduleDisplayTitle(next,questWorks,quest.campaignId):quest.moduleKey?' · Module à vérifier':''}</div></div><span className={'choice-status '+(status==='Prêt à jouer'?'choice-ok':'')}>{status}</span></div>
    {quest.note && <p>{quest.note}</p>}{next && <p className="choice-meta">{Object.values(next.checklist).filter(v=>v==='done'||v==='na').length}/5 vérifiés · {Object.values(next.checklist).filter(v=>v==='partial').length} en préparation · {next.hasTemplate?'Modèle enregistré':'Aucun modèle'}</p>}{next && <p><a href={next.scenarioId.startsWith("resource:")?"/pf2-mj/resources/"+encodeURIComponent(next.scenarioId.slice(9)):"/pf2-mj/scenarios/"+encodeURIComponent(next.scenarioId)}>Ouvrir la source du module</a></p>}
    <div className="choice-actions"><span>👍 {quest.votes.filter(v=>v.emoji==='👍').length} · 🔒 {quest.votes.filter(v=>v.emoji==='🔒').length}</span><button onClick={()=>{setDraft(quest);setEditing(v=>!v)}}>{editing?'Fermer':'Associer / modifier'}</button>{next && <button onClick={()=>openTemplate(next)}>{next.hasTemplate?'Voir le modèle':'Créer le modèle'}</button>}</div>
    {showVotes && <div className="choice-votes">{['👍','🔒'].map(emoji=><div key={emoji}><strong>{emoji} {emoji==='👍'?'Intéressés':'Verrouillés'}</strong>{quest.votes.filter(v=>v.emoji===emoji).map((v,i)=><div key={i}>{v.name}{v.characters.length?' — '+v.characters.join(', '):''}</div>)}</div>)}</div>}
    {editing && <div className="choice-edit"><label>Type<select value={draft.kind} onChange={e=>setDraft(v=>({...v,kind:e.target.value as Kind}))}>{Object.entries(kinds).map(([k,label])=><option key={k} value={k}>{label}</option>)}</select></label><label>Campagne / scénario<select value={draft.campaignId} onChange={e=>setDraft(v=>({...v,campaignId:e.target.value,moduleKey:''}))}><option value="">Aucun</option>{questWorks.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><label>Prochain module<select value={draft.moduleKey} onChange={e=>setDraft(v=>({...v,moduleKey:e.target.value}))}><option value="">Aucun / à choisir</option>{draft.moduleKey&&!options.some(m=>m.key===draft.moduleKey)&&<option value={draft.moduleKey}>Lien historique à vérifier</option>}{options.map(m=><option key={m.key} value={m.key}>{moduleDisplayTitle(m,questWorks,draft.campaignId)}</option>)}</select></label><label>Note MJ<textarea value={draft.note} onChange={e=>setDraft(v=>({...v,note:e.target.value}))}/></label>{error&&<p role="alert">{error}</p>}<button disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await save(draft);setEditing(false)}catch(e){setError(String(e))}finally{setBusy(false)}}}>Enregistrer</button></div>}
  </article>
}
type WorkspaceProps = {campaigns:Option[];scenarios:Option[];activeWorks?:Option[]}
function ChoiceLibre(props:WorkspaceProps & {mode:'quests'|'modules';requestedModuleKey:string;openTemplate:(m:Module)=>void;closeTemplate:()=>void}) {
  const [data,setData]=useState<Snapshot|null>(null)
  const [error,setError]=useState('')
  const [showVotes,setShowVotes]=useState(false)
  const [filter,setFilter]=useState('all')
  const [loading,setLoading]=useState(false)
  const [campaignFilter,setCampaignFilter]=useState('')
  const [templateFilter,setTemplateFilter]=useState('all')
  async function load() {setLoading(true);setError('');try{setData(await request<Snapshot>())}catch(e){setData(null);setError(String(e))}finally{setLoading(false)}}
  useEffect(()=>{void load()},[])
  const saveQuest=async(q:Quest)=>{await request('/quests/'+encodeURIComponent(q.id),{kind:q.kind,campaignId:q.campaignId,moduleKey:q.moduleKey,note:q.note});setData(d=>d?({...d,quests:d.quests.map(old=>old.id===q.id?q:old)}):d)}
  const saveModule=async(m:Module)=>{await request('/modules',{moduleKey:m.key,checklist:m.checklist,progress:m.progress,remainingTasks:m.remainingTasks ?? ''});setData(d=>d?({...d,modules:d.modules.map(old=>old.key===m.key?{...old,checklist:m.checklist,progress:m.progress,remainingTasks:m.remainingTasks ?? '',ready:Object.values(m.checklist).every(v=>v==='done'||v==='na')}:old)}):d)}
  if (!data) return <section className="choice-panel"><h2>Journal de quêtes · Choix libre</h2>{error&&<p role="alert">{error}</p>}<button disabled={loading} onClick={()=>void load()}>{loading?'Chargement…':'Réessayer'}</button></section>
  const ready=data.quests.filter(q=>readiness(q,data.modules.find(m=>m.key===q.moduleKey))==='Prêt à jouer').length
  const visible=data.quests.filter(q=>filter==='all'||(filter==='ready'?readiness(q,data.modules.find(m=>m.key===q.moduleKey))==='Prêt à jouer':q.kind===filter))
  const synced=data.quests.map(q=>q.syncedAt).sort().at(-1)
  const linkedCampaigns=new Set(data.quests.filter(q=>q.campaignId&&q.kind==='mission').map(q=>q.campaignId))
  const activeWorks=sortedWorks(props.activeWorks ?? data.campaigns)
  const selectedCampaign=activeWorks.some(c=>c.id===campaignFilter)?campaignFilter:activeWorks.find(c=>linkedCampaigns.has(c.id))?.id||activeWorks[0]?.id||''
  const campaignModules=data.modules.filter(m=>moduleInWork(m,selectedCampaign)).sort((a,b)=>(a.campaignOrder[selectedCampaign]??a.order)-(b.campaignOrder[selectedCampaign]??b.order))
  const listedModules=campaignModules.filter(m=>templateFilter==='all'||(templateFilter==='yes'?m.hasTemplate:!m.hasTemplate))
  const templateModule=props.mode==='modules'?data.modules.find(m=>m.key===props.requestedModuleKey):undefined
  const names=sortedWorks([...data.campaigns,...activeWorks])
  if(templateModule)return <SessionPreparations key={templateModule.key} {...props} templateModule={{key:templateModule.key,title:moduleDisplayTitle(templateModule,activeWorks.some(w=>moduleInWork(templateModule,w.id))?activeWorks:names,selectedCampaign)}} templateChecklist={<ModuleEditor key={templateModule.key+JSON.stringify(templateModule.checklist)+templateModule.progress+templateModule.remainingTasks} module={templateModule} save={saveModule}/>} onBack={()=>{const owner=activeWorks.find(w=>moduleInWork(templateModule,w.id));if(owner)setCampaignFilter(owner.id);props.closeTemplate();void load()}}/>
  if(props.mode==='modules'&&props.requestedModuleKey)return <section className="choice-panel"><p>Module introuvable.</p><button onClick={props.closeTemplate}>Retour aux modèles</button></section>
  if(props.mode==='modules')return <section className="choice-panel"><h2>Préparation permanente des modules</h2><div className="choice-toolbar"><label>Campagne / scénario<select value={selectedCampaign} onChange={e=>{setCampaignFilter(e.target.value)}}><option value="">Choisir</option>{activeWorks.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label><button disabled={loading} onClick={()=>void load()}>Actualiser</button></div>
    <label>Modèles <select value={templateFilter} onChange={e=>setTemplateFilter(e.target.value)}><option value="all">Tous</option><option value="yes">Avec contenu</option><option value="no">Sans contenu</option></select></label>
    <p>{campaignModules.filter(m=>m.hasTemplate).length}/{campaignModules.length} modèles enregistrés</p>
    <p>{campaignModules.filter(m=>m.progress!=='done'&&moduleReady(m)).length} module(s) prêt(s) non terminé(s) · {campaignModules.filter(m=>m.progress==='done').length} joué(s)</p>
    <div className="choice-list">{listedModules.map(m=><article key={m.key} className="choice-quest"><div className="choice-head"><div><strong>{moduleDisplayTitle(m,activeWorks,selectedCampaign)}</strong>{m.group&&<div className="choice-meta">{m.group}</div>}</div><span className={'choice-status '+(moduleReady(m)?'choice-ok':'')}>{moduleStateLabel(m)}</span></div><p className="choice-meta">{checklistCount(m)}/5 vérifiés · {m.hasTemplate?'Modèle enregistré':'Sans modèle'}</p><div className="choice-actions"><button onClick={()=>props.openTemplate(m)}>{m.hasTemplate?'Modifier le modèle':'Créer le modèle'}</button></div></article>)}</div></section>
  return <section className="choice-panel"><h2>Journal de quêtes · Choix libre</h2><p>{data.quests.length} quêtes ouvertes · {ready} prêtes à jouer · dernière synchronisation : {synced||'inconnue'}</p><p>Les votes sont ceux des comptes Discord ; les PJ affichés sont leurs personnages connus, pas une attribution certaine du vote à un PJ.</p><div className="choice-toolbar"><label>Filtrer <select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Toutes</option><option value="ready">Prêtes à jouer</option>{Object.entries(kinds).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label><input type="checkbox" checked={showVotes} onChange={e=>setShowVotes(e.target.checked)}/> Intéressés / verrouillés</label><button disabled={loading} onClick={()=>void load()}>Actualiser</button></div>{error&&<p role="alert">{error}</p>}<div className="choice-list">{visible.map(q=><QuestCard key={q.id} quest={q} data={data} activeWorks={activeWorks} showVotes={showVotes} save={saveQuest} openTemplate={props.openTemplate}/>)}</div>{!visible.length&&<p>Aucune quête pour ce filtre.</p>}</section>
}
export default function ChoiceLibreWorkspace(props:WorkspaceProps) {
  const location=useLocation()
  const navigate=useNavigate()
  const query=new URLSearchParams(location.search)
  const tab=query.get('tab')==='templates'?'templates':location.search?'session':'choice'
  const switchTab=(next:'choice'|'templates'|'session')=>navigate({pathname:location.pathname,search:next==='choice'?'':`?tab=${next}`})
  const openTemplate=(m:Module)=>navigate({pathname:location.pathname,search:'?tab=templates&moduleKey='+encodeURIComponent(m.key)})
  const closeTemplate=()=>navigate({pathname:location.pathname,search:'?tab=templates'},{replace:true})
  return <><nav className="choice-tabs"><button className={tab==='choice'?'active':''} onClick={()=>switchTab('choice')}>Journal de quêtes · Choix libre</button><button className={tab==='templates'?'active':''} onClick={()=>switchTab('templates')}>Modèles de préparation</button><button className={tab==='session'?'active':''} onClick={()=>switchTab('session')}>Préparation des séances</button></nav><div hidden={tab==='session'}><ChoiceLibre {...props} mode={tab==='templates'?'modules':'quests'} requestedModuleKey={query.get('moduleKey')||''} openTemplate={openTemplate} closeTemplate={closeTemplate}/></div><div hidden={tab!=='session'}><SessionPreparations {...props}/></div></>
}
