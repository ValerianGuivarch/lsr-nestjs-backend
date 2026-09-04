"use client";

import {ChangeEvent,useEffect,useMemo,useState} from "react";

type Reputation={initiale:number;actuelle:number};
type Dirigeant={personnage_id:string;role:string};
type Relation={faction_id:string;type:string;description?:string};

type Faction={
  id:string; nom:string; description:string; description_joueurs?:string; type:string;
  parent_id?:string|null; sous_factions:string[]; dirigeants:Dirigeant[]; membres_cles:string[];
  lieux:string[]; regions_influence:string[]; objectifs:string[]; histoire?:string; relations:Relation[];
  tags:string[]; image:string; aliases:string[]; statut:string; notes?:string; source?:string;
  evenements:string[]; reputation_groupe:Reputation;
};
type RefItem={id:string;nom:string};
type Draft={
  nom:string;description:string;description_joueurs:string;type:string;parent_id:string;sous_factions:string;
  dirigeants:string;membres_cles:string;lieux:string;regions_influence:string;objectifs:string;histoire:string;
  relations:string;tags:string;image:string;aliases:string;statut:string;notes:string;source:string;evenements:string;
  reputation_initiale:string;reputation_actuelle:string;
};

const emptyDraft:Draft={nom:"",description:"",description_joueurs:"",type:"Organisation",parent_id:"",sous_factions:"",
  dirigeants:"[]",membres_cles:"",lieux:"",regions_influence:"",objectifs:"",histoire:"",relations:"[]",tags:"",
  image:"",aliases:"",statut:"Active",notes:"",source:"",evenements:"",reputation_initiale:"0",reputation_actuelle:"0"};

const jsonTemplate:Faction={
  id:"faction_exemple",nom:"Faction exemple",description:"Description MJ.",description_joueurs:"Description courte destinée aux joueurs.",
  type:"Organisation",parent_id:null,sous_factions:[],dirigeants:[],membres_cles:[],lieux:[],regions_influence:[],
  objectifs:[],histoire:"",relations:[],tags:[],image:"",aliases:[],statut:"Active",notes:"",source:"",
  evenements:[],reputation_groupe:{initiale:0,actuelle:0}
};

const csv=(v:string)=>[...new Set(v.split(",").map(x=>x.trim()).filter(Boolean))];
const slugId=(v:string)=>"faction_"+v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
const normalize=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const unique=(v:string[])=>[...new Set(v.filter(Boolean))].sort((a,b)=>a.localeCompare(b,"fr"));
const parseJson=<T,>(value:string,fallback:T):T=>{try{return value.trim()?JSON.parse(value):fallback}catch{return fallback}};
const clampRep=(n:number)=>Math.max(-50,Math.min(50,Number.isFinite(n)?n:0));
const repLabel=(n:number)=>n>=30?"Révéré":n>=15?"Admiré":n>=5?"Apprécié":n>=-4?"Neutre":n>=-14?"Mal vu":n>=-29?"Détesté":"Traqué";

function isFaction(value:unknown):value is Faction{
  if(!value||typeof value!=="object")return false;
  const f=value as Partial<Faction>;
  return typeof f.nom==="string"&&typeof f.description==="string"&&Array.isArray(f.sous_factions)
    &&Array.isArray(f.dirigeants)&&Array.isArray(f.tags)&&typeof f.image==="string"
    &&!!f.reputation_groupe&&typeof f.reputation_groupe.actuelle==="number";
}
const downloadJson=(filename:string,data:unknown)=>{
  const blob=new Blob([JSON.stringify(data,null,2)+"\n"],{type:"application/json"});
  const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
};

export default function FactionsPage({initialSelectedId}:{initialSelectedId?:string}){
  const [items,setItems]=useState<Faction[]>([]),[pnjs,setPnjs]=useState<RefItem[]>([]),[lieux,setLieux]=useState<RefItem[]>([]),
    [regions,setRegions]=useState<RefItem[]>([]),[events,setEvents]=useState<RefItem[]>([]);
  const [query,setQuery]=useState(""),[type,setType]=useState(""),[statut,setStatut]=useState(""),[parent,setParent]=useState("");
  const [selected,setSelected]=useState<Faction|null>(null),[showAdd,setShowAdd]=useState(false),[draft,setDraft]=useState<Draft>(emptyDraft);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");

  const load=async()=>{
    const main=await fetch("/apil7r/pf2-mj/factions",{cache:"no-store"});if(!main.ok)throw new Error("Impossible de charger les factions.");
    const payload=await main.json();setItems(Array.isArray(payload)?payload:payload.items??[]);
    const get=async(url:string)=>{try{const r=await fetch(url,{cache:"no-store"});if(!r.ok)return[];const p=await r.json();return Array.isArray(p)?p:p.items??[]}catch{return[]}};
    const [p,l,r,e]=await Promise.all([get("/apil7r/pf2-mj/pnj"),get("/apil7r/pf2-mj/lieux"),get("/apil7r/pf2-mj/regions"),get("/apil7r/pf2-mj/evenements")]);
    setPnjs(p);setLieux(l);setRegions(r);setEvents(e);
  };
  useEffect(()=>{load().catch(e=>setMessage(e instanceof Error?e.message:String(e)))},[]);
  useEffect(()=>{if(initialSelectedId){const target=items.find(item=>item.id===initialSelectedId);if(target)setSelected(target)}},[initialSelectedId,items]);

  const maps=useMemo(()=>({
    factions:new Map(items.map(x=>[x.id,x.nom])),pnjs:new Map(pnjs.map(x=>[x.id,x.nom])),
    lieux:new Map(lieux.map(x=>[x.id,x.nom])),regions:new Map(regions.map(x=>[x.id,x.nom])),events:new Map(events.map(x=>[x.id,x.nom]))
  }),[items,pnjs,lieux,regions,events]);
  const name=(kind:keyof typeof maps,id?:string|null)=>id?(maps[kind].get(id)??id):"—";
  const types=useMemo(()=>unique(items.map(x=>x.type)),[items]),statuts=useMemo(()=>unique(items.map(x=>x.statut)),[items]);
  const parents=useMemo(()=>items.filter(x=>!x.parent_id).sort((a,b)=>a.nom.localeCompare(b.nom,"fr")),[items]);
  const filtered=useMemo(()=>{const q=normalize(query.trim());return items.filter(f=>{
    const hay=normalize([f.nom,f.description,f.description_joueurs,f.type,f.statut,f.histoire,f.source,f.notes,...f.tags,...f.aliases].filter(Boolean).join(" "));
    return(!q||hay.includes(q))&&(!type||f.type===type)&&(!statut||f.statut===statut)&&(!parent||f.parent_id===parent);
  }).sort((a,b)=>a.nom.localeCompare(b.nom,"fr"))},[items,query,type,statut,parent]);

  const save=async()=>{
    if(!draft.nom.trim()){setMessage("Le nom est obligatoire.");return}
    setBusy(true);setMessage("");
    try{
      const item:Faction={id:slugId(draft.nom),nom:draft.nom.trim(),description:draft.description.trim(),description_joueurs:draft.description_joueurs.trim(),
        type:draft.type.trim()||"Organisation",parent_id:draft.parent_id||null,sous_factions:csv(draft.sous_factions),
        dirigeants:parseJson<Dirigeant[]>(draft.dirigeants,[]),membres_cles:csv(draft.membres_cles),lieux:csv(draft.lieux),
        regions_influence:csv(draft.regions_influence),objectifs:csv(draft.objectifs),histoire:draft.histoire.trim(),
        relations:parseJson<Relation[]>(draft.relations,[]),tags:csv(draft.tags),image:draft.image.trim(),aliases:csv(draft.aliases),
        statut:draft.statut.trim()||"Active",notes:draft.notes.trim(),source:draft.source.trim(),evenements:csv(draft.evenements),
        reputation_groupe:{initiale:clampRep(Number(draft.reputation_initiale)),actuelle:clampRep(Number(draft.reputation_actuelle))}};
      const response=await fetch("/apil7r/pf2-mj/factions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"upsert",item})});
      const payload=await response.json().catch(()=>null);if(!response.ok)throw new Error(payload?.error||`Erreur HTTP ${response.status}`);
      setItems(payload.items);setDraft(emptyDraft);setShowAdd(false);setSelected(item);setMessage(`${item.nom} enregistrée.`);
    }catch(e){setMessage(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
  };
  const importJson=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];event.target.value="";if(!file)return;setBusy(true);setMessage("");
    try{const parsed=JSON.parse(await file.text());const raw=Array.isArray(parsed)?parsed:Array.isArray(parsed?.items)?parsed.items:[parsed];
      const imported:Faction[]=raw.map((x:any)=>({...x,id:x.id||slugId(x.nom||""),description:x.description||"",description_joueurs:x.description_joueurs||"",
        sous_factions:Array.isArray(x.sous_factions)?x.sous_factions:[],dirigeants:Array.isArray(x.dirigeants)?x.dirigeants:[],membres_cles:Array.isArray(x.membres_cles)?x.membres_cles:[],
        lieux:Array.isArray(x.lieux)?x.lieux:[],regions_influence:Array.isArray(x.regions_influence)?x.regions_influence:[],objectifs:Array.isArray(x.objectifs)?x.objectifs:[],
        relations:Array.isArray(x.relations)?x.relations:[],tags:Array.isArray(x.tags)?x.tags:[],aliases:Array.isArray(x.aliases)?x.aliases:[],evenements:Array.isArray(x.evenements)?x.evenements:[],
        image:x.image||"",reputation_groupe:x.reputation_groupe??{initiale:0,actuelle:0}}));
      if(imported.some(x=>!isFaction(x)))throw new Error("Le JSON contient au moins une faction invalide.");
      const response=await fetch("/apil7r/pf2-mj/factions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"import",items:imported})});
      const payload=await response.json().catch(()=>null);if(!response.ok)throw new Error(payload?.error||`Erreur HTTP ${response.status}`);
      setItems(payload.items);setMessage(`${imported.length} faction${imported.length>1?"s":""} importée${imported.length>1?"s":""}.`);
    }catch(e){setMessage(e instanceof Error?e.message:String(e))}finally{setBusy(false)}
  };

  return <main className="ref-page"><style>{`
    .ref-page{max-width:1500px;margin:0 auto;padding:24px;color:#252a25}.bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}.bar h1{font-size:24px;margin:0 auto 0 0}.btn,.file{border:1px solid #c9b98f;background:#fffaf0;color:#6e5319;border-radius:8px;padding:9px 12px;font:inherit;font-weight:700;cursor:pointer}.btn.primary{background:#765719;color:#fff;border-color:#765719}.file input{display:none}.msg{min-height:22px;margin:4px 0 12px;color:#5d614f;font-size:13px}.filters{display:grid;grid-template-columns:minmax(240px,2fr) repeat(3,minmax(150px,1fr));gap:9px;margin-bottom:18px}.filters input,.filters select,.form input,.form select,.form textarea{width:100%;box-sizing:border-box;border:1px solid #d6cdbd;border-radius:8px;background:#fffdf8;padding:9px 10px;font:inherit;color:inherit}.count{font-size:12px;color:#71756c;margin:0 0 8px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}.card{border:1px solid #ded7cb;background:#fffdf9;border-radius:12px;overflow:hidden}.body{padding:13px}.card h2{font-size:17px;margin:0 0 4px}.meta{font-size:12px;color:#777269;margin-bottom:8px}.desc{font-size:13px;line-height:1.45}.chips{display:flex;gap:5px;flex-wrap:wrap}.chip{border:1px solid #d9cfba;border-radius:999px;padding:3px 7px;font-size:10px;background:#faf5e9}.chip.rep{border-color:#bca66e;background:#fff7de}.more{width:100%;border:0;border-top:1px solid #eee7da;background:#faf7f0;padding:8px;cursor:pointer;font-weight:700;color:#66542b}.back{position:fixed;inset:0;background:rgba(0,0,0,.35);display:grid;place-items:center;padding:20px;z-index:50}.dialog{width:min(860px,100%);max-height:90vh;overflow:auto;background:#fffdf9;border-radius:14px;padding:18px}.head{display:flex;align-items:center;gap:12px}.head h2{margin:0 auto 0 0}.form{display:grid;grid-template-columns:1fr 1fr;gap:10px}.form .wide{grid-column:1/-1}.form label{font-size:12px;font-weight:700;display:grid;gap:5px}.actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}.detail dl{display:grid;grid-template-columns:145px 1fr;gap:7px 10px;font-size:13px}.detail dt{font-weight:700;color:#6b675f}.detail dd{margin:0}.empty{padding:40px;text-align:center;border:1px dashed #cfc7b8;border-radius:12px;color:#777}@media(max-width:780px){.filters,.form{grid-template-columns:1fr 1fr}}@media(max-width:560px){.ref-page{padding:14px}.filters,.form{grid-template-columns:1fr}.form .wide{grid-column:auto}}
  `}</style>
    <div className="bar"><h1>Factions</h1><button className="btn primary" onClick={()=>setShowAdd(true)}>+ Ajouter</button>
      <label className="file">Importer JSON<input type="file" accept="application/json,.json" onChange={importJson}/></label>
      <button className="btn" onClick={()=>downloadJson("faction-modele.json",jsonTemplate)}>Modèle JSON</button><button className="btn" onClick={()=>downloadJson("factions-export.json",items)}>Exporter</button></div>
    <div className="msg">{busy?"Enregistrement…":message}</div>
    <section className="filters"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher une faction…"/>
      <select value={type} onChange={e=>setType(e.target.value)}><option value="">Tous les types</option>{types.map(v=><option key={v}>{v}</option>)}</select>
      <select value={statut} onChange={e=>setStatut(e.target.value)}><option value="">Tous les statuts</option>{statuts.map(v=><option key={v}>{v}</option>)}</select>
      <select value={parent} onChange={e=>setParent(e.target.value)}><option value="">Toutes les hiérarchies</option>{parents.map(v=><option key={v.id} value={v.id}>{v.nom}</option>)}</select></section>
    <p className="count">{filtered.length} faction{filtered.length>1?"s":""} sur {items.length}</p>
    {filtered.length?<section className="grid">{filtered.map(f=><article className="card" key={f.id}><div className="body">
      <h2>{f.nom}</h2><div className="meta">{f.type} · {f.statut}{f.parent_id?` · ${name("factions",f.parent_id)}`:""}</div>
      <p className="desc">{f.description||"Aucune description."}</p><div className="chips"><span className="chip rep">Réputation {f.reputation_groupe.actuelle} · {repLabel(f.reputation_groupe.actuelle)}</span>
      {f.tags.slice(0,4).map(t=><span className="chip" key={t}>{t}</span>)}</div></div><button className="more" onClick={()=>setSelected(f)}>Voir la fiche</button></article>)}</section>:<div className="empty">Aucune faction.</div>}
    {showAdd&&<div className="back" onMouseDown={e=>{if(e.target===e.currentTarget)setShowAdd(false)}}><section className="dialog"><div className="head"><h2>Ajouter une faction</h2><button className="btn" onClick={()=>setShowAdd(false)}>Fermer</button></div>
      <div className="form"><label>Nom<input value={draft.nom} onChange={e=>setDraft({...draft,nom:e.target.value})}/></label><label>Type<input value={draft.type} onChange={e=>setDraft({...draft,type:e.target.value})}/></label>
      <label className="wide">Description MJ<textarea rows={3} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label>
      <label className="wide">Description joueurs<textarea rows={2} value={draft.description_joueurs} onChange={e=>setDraft({...draft,description_joueurs:e.target.value})}/></label>
      <label>Faction parente<select value={draft.parent_id} onChange={e=>setDraft({...draft,parent_id:e.target.value})}><option value="">Aucune</option>{items.map(v=><option key={v.id} value={v.id}>{v.nom}</option>)}</select></label>
      <label>Statut<input value={draft.statut} onChange={e=>setDraft({...draft,statut:e.target.value})}/></label>
      <label>Réputation initiale<input type="number" min={-50} max={50} value={draft.reputation_initiale} onChange={e=>setDraft({...draft,reputation_initiale:e.target.value})}/></label>
      <label>Réputation actuelle<input type="number" min={-50} max={50} value={draft.reputation_actuelle} onChange={e=>setDraft({...draft,reputation_actuelle:e.target.value})}/></label>
      <label>Sous-factions (IDs)<input value={draft.sous_factions} onChange={e=>setDraft({...draft,sous_factions:e.target.value})}/></label>
      <label>Membres clés (IDs)<input value={draft.membres_cles} onChange={e=>setDraft({...draft,membres_cles:e.target.value})}/></label>
      <label>Lieux (IDs)<input value={draft.lieux} onChange={e=>setDraft({...draft,lieux:e.target.value})}/></label><label>Régions (IDs)<input value={draft.regions_influence} onChange={e=>setDraft({...draft,regions_influence:e.target.value})}/></label>
      <label className="wide">Objectifs (séparés par virgules)<input value={draft.objectifs} onChange={e=>setDraft({...draft,objectifs:e.target.value})}/></label>
      <label className="wide">Histoire<textarea rows={3} value={draft.histoire} onChange={e=>setDraft({...draft,histoire:e.target.value})}/></label>
      <label className="wide">Dirigeants (JSON)<textarea rows={3} value={draft.dirigeants} onChange={e=>setDraft({...draft,dirigeants:e.target.value})}/></label>
      <label className="wide">Relations (JSON)<textarea rows={3} value={draft.relations} onChange={e=>setDraft({...draft,relations:e.target.value})}/></label>
      <label>Tags<input value={draft.tags} onChange={e=>setDraft({...draft,tags:e.target.value})}/></label><label>Alias<input value={draft.aliases} onChange={e=>setDraft({...draft,aliases:e.target.value})}/></label>
      <label>Événements (IDs)<input value={draft.evenements} onChange={e=>setDraft({...draft,evenements:e.target.value})}/></label><label>Image<input value={draft.image} onChange={e=>setDraft({...draft,image:e.target.value})}/></label>
      <label>Source<input value={draft.source} onChange={e=>setDraft({...draft,source:e.target.value})}/></label><label className="wide">Notes<textarea rows={3} value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})}/></label></div>
      <div className="actions"><button className="btn" onClick={()=>setShowAdd(false)}>Annuler</button><button className="btn primary" disabled={busy} onClick={save}>Enregistrer</button></div></section></div>}
    {selected&&<div className="back" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><article className="dialog detail"><div className="head"><h2>{selected.nom}</h2><button className="btn" onClick={()=>setSelected(null)}>Fermer</button></div>
      <p>{selected.description}</p>{selected.description_joueurs&&<p><strong>Texte joueurs :</strong> {selected.description_joueurs}</p>}
      <dl><dt>Type</dt><dd>{selected.type}</dd><dt>Parent</dt><dd>{name("factions",selected.parent_id)}</dd>
      <dt>Réputation</dt><dd>{selected.reputation_groupe.actuelle} ({repLabel(selected.reputation_groupe.actuelle)}) · initiale {selected.reputation_groupe.initiale}</dd>
      <dt>Sous-factions</dt><dd>{selected.sous_factions.map(id=>name("factions",id)).join(" · ")||"—"}</dd>
      <dt>Dirigeants</dt><dd>{selected.dirigeants.map(d=>`${name("pnjs",d.personnage_id)} — ${d.role}`).join(" · ")||"—"}</dd>
      <dt>Membres clés</dt><dd>{selected.membres_cles.map(id=>name("pnjs",id)).join(" · ")||"—"}</dd>
      <dt>Lieux</dt><dd>{selected.lieux.map(id=>name("lieux",id)).join(" · ")||"—"}</dd><dt>Régions</dt><dd>{selected.regions_influence.map(id=>name("regions",id)).join(" · ")||"—"}</dd>
      <dt>Objectifs</dt><dd>{selected.objectifs.join(" · ")||"—"}</dd><dt>Relations</dt><dd>{selected.relations.map(r=>`${name("factions",r.faction_id)} (${r.type})`).join(" · ")||"—"}</dd>
      <dt>Tags</dt><dd>{selected.tags.join(" · ")||"—"}</dd><dt>Statut</dt><dd>{selected.statut}</dd><dt>Événements</dt><dd>{selected.evenements.map(id=>name("events",id)).join(" · ")||"—"}</dd>
      <dt>Source</dt><dd>{selected.source||"—"}</dd><dt>Notes</dt><dd>{selected.notes||"—"}</dd></dl></article></div>}
  </main>
}
