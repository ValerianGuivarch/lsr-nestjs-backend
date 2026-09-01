"use client";

import {useEffect,useMemo,useState,type ClipboardEvent,type DragEvent} from "react";

type Pnj={
  id:string;
  nom:string;
  description:string;
  factions:{faction_id:string;role:string;statut:string}[];
  tags:string[];
  portrait?:string;
  foundryActorUuid?:string|null;
  image?:string;
  aliases?:string[];
  lieux?:string[];
  regions?:string[];
  evenements?:string[];
  role?:string;
  importance?:"Majeure"|"Récurrente"|"Secondaire"|"Figurant";
  statut?:"Actif"|"Disparu"|"Mort"|"Inconnu";
  notes?:string;
};

type Draft={
  nom:string;
  description:string;
  factions:string;
  tags:string;
  portrait:string;
  foundryActorUuid:string;
  image:string;
  aliases:string;
  lieux:string;
  regions:string;
  evenements:string;
  role:string;
  importance:Pnj["importance"];
  statut:Pnj["statut"];
  notes:string;
};

const emptyDraft:Draft={
  nom:"",description:"",factions:"",tags:"",portrait:"",foundryActorUuid:"",image:"",aliases:"",lieux:"",regions:"",evenements:"",role:"",
  importance:"Secondaire",statut:"Actif",notes:""
};

const jsonTemplate=[{
  id:"",
  nom:"",
  description:"",
  factions:[],
  tags:[],
  portrait:"",
  foundryActorUuid:null,
  aliases:[],
  lieux:[],
  regions:[],
  evenements:[],
  role:"",
  importance:"Secondaire",
  statut:"Actif",
  notes:""
}];

const csv=(value:string)=>[...new Set(value.split(",").map(v=>v.trim()).filter(Boolean))];
const slug=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const unique=(values:string[])=>[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,"fr"));
const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();

const resolveImageSrc=(value:string)=>{
  const image=value.trim();
  if(!image)return "";
  if(/^https?:\/\//i.test(image))return image;
  if(image.startsWith("/apil7r/pf2-mj/"))return image;
  if(image.startsWith("/"))return `/apil7r/pf2-mj${image}`;
  return `/${image.replace(/^\.\//,"")}`;
};

export const resolvePnjImage=(pnj:Pick<Pnj,"portrait"|"image">)=>{
  const portrait=pnj.portrait?.trim()??"";
  const match=/^assets\/l7r\/portraits\/pnj\/([^/]+)$/i.exec(portrait);
  if(match)return `/apil7r/pf2-mj/portraits/${encodeURIComponent(match[1])}`;
  if(/^portraits\/[^/]+$/i.test(portrait))return `/apil7r/pf2-mj/portraits/${encodeURIComponent(portrait.split("/").at(-1)??"")}`;
  if(/^https?:\/\//i.test(portrait))return portrait;
  return resolveImageSrc(pnj.image??"");
};

const draftFromPnj=(p:Pnj):Draft=>({
  nom:p.nom,
  description:p.description??"",
  factions:(p.factions??[]).map(f=>f.faction_id).join(", "),
  tags:(p.tags??[]).join(", "),
  portrait:p.portrait??"",
  foundryActorUuid:p.foundryActorUuid??"",
  image:p.image??"",
  aliases:(p.aliases??[]).join(", "),
  lieux:(p.lieux??[]).join(", "),
  regions:(p.regions??[]).join(", "),
  evenements:(p.evenements??[]).join(", "),
  role:p.role??"",
  importance:p.importance??"Secondaire",
  statut:p.statut??"Actif",
  notes:p.notes??""
});

function isPnj(value:unknown):value is Pnj{
  if(!value||typeof value!=="object")return false;
  const item=value as Partial<Pnj>;
  return typeof item.nom==="string"&&item.nom.trim().length>0
    &&typeof item.description==="string"
    &&Array.isArray(item.factions)
    &&Array.isArray(item.tags)
    &&(item.image===undefined||typeof item.image==="string")
    &&(item.portrait===undefined||typeof item.portrait==="string");
}

async function imageAsPng(url:string){
  const response=await fetch(url,{cache:"no-store"});
  if(!response.ok)throw new Error(`Image inaccessible (${response.status})`);
  const blob=await response.blob();
  if(blob.type==="image/png")return blob;
  const objectUrl=URL.createObjectURL(blob);
  try{
    const img=new Image();
    img.src=objectUrl;
    await img.decode();
    const canvas=document.createElement("canvas");
    canvas.width=img.naturalWidth;
    canvas.height=img.naturalHeight;
    const ctx=canvas.getContext("2d");
    if(!ctx)throw new Error("Canvas indisponible");
    ctx.drawImage(img,0,0);
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("Conversion PNG impossible")),"image/png"));
  }finally{URL.revokeObjectURL(objectUrl)}
}

export default function PnjPage(){
  const [pnjs,setPnjs]=useState<Pnj[]>([]);
  const [factionRefs,setFactionRefs]=useState<{id:string;nom:string}[]>([]);
  const [lieuRefs,setLieuRefs]=useState<{id:string;nom:string}[]>([]);
  const [regionRefs,setRegionRefs]=useState<{id:string;nom:string}[]>([]);
  const [eventRefs,setEventRefs]=useState<{id:string;nom:string}[]>([]);
  const [query,setQuery]=useState("");
  const [faction,setFaction]=useState("");
  const [tag,setTag]=useState("");
  const [lieu,setLieu]=useState("");
  const [importance,setImportance]=useState("");
  const [selected,setSelected]=useState<Pnj|null>(null);
  const [showEditor,setShowEditor]=useState(false);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [draft,setDraft]=useState<Draft>(emptyDraft);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [showImport,setShowImport]=useState(false);
  const [importText,setImportText]=useState("");
  const [imageUrl,setImageUrl]=useState("");
  const [imageBusy,setImageBusy]=useState(false);
  const [foundryInfo,setFoundryInfo]=useState<{actorUuid:string|null;actor:{uuid:string;name:string;type:string;level:number|null;hp:number|null;img:string|null}|null;status:"not-linked"|"available"|"unavailable";message?:string}|null>(null);
  const [foundryCandidates,setFoundryCandidates]=useState<{uuid:string;name:string;type:string}[]>([]);
  const [foundryBusy,setFoundryBusy]=useState(false);
  const [showFoundryAssociator,setShowFoundryAssociator]=useState(false);
  const [foundryQuery,setFoundryQuery]=useState("");

  const load=async()=>{
    const get=async(url:string)=>{const response=await fetch(url,{cache:"no-store"});if(!response.ok)throw new Error(`Impossible de charger ${url}.`);const payload=await response.json();return Array.isArray(payload)?payload:payload.items??[]};
    const [people,factions,lieux,regions,events]=await Promise.all([get("/apil7r/pf2-mj/pnj"),get("/apil7r/pf2-mj/factions"),get("/apil7r/pf2-mj/lieux"),get("/apil7r/pf2-mj/regions"),get("/apil7r/pf2-mj/evenements")]);
    setPnjs(people);setFactionRefs(factions);setLieuRefs(lieux);setRegionRefs(regions);setEventRefs(events);
  };

  useEffect(()=>{void Promise.resolve().then(load).catch(error=>setMessage(error instanceof Error?error.message:String(error)))},[]);
  useEffect(()=>{if(!selected){queueMicrotask(()=>setFoundryInfo(null));return}void fetch(`/apil7r/pf2-mj/pnj/${encodeURIComponent(selected.id)}/foundry`,{cache:"no-store"}).then(async response=>{const payload=await response.json();if(!response.ok)throw new Error(payload?.message??"Foundry indisponible.");setFoundryInfo(payload)}).catch(error=>setFoundryInfo({actorUuid:selected.foundryActorUuid??null,actor:null,status:"unavailable",message:error instanceof Error?error.message:String(error)}))},[selected]);

  const factionNames=useMemo(()=>new Map(factionRefs.map(item=>[item.id,item.nom])),[factionRefs]);
  const lieuNames=useMemo(()=>new Map(lieuRefs.map(item=>[item.id,item.nom])),[lieuRefs]);
  const regionNames=useMemo(()=>new Map(regionRefs.map(item=>[item.id,item.nom])),[regionRefs]);
  const eventNames=useMemo(()=>new Map(eventRefs.map(item=>[item.id,item.nom])),[eventRefs]);
  const factions=useMemo(()=>unique(pnjs.flatMap(p=>p.factions.map(f=>f.faction_id))),[pnjs]);
  const tags=useMemo(()=>unique(pnjs.flatMap(p=>p.tags)),[pnjs]);
  const lieux=useMemo(()=>unique(pnjs.flatMap(p=>p.lieux??[])),[pnjs]);

  const filtered=useMemo(()=>{
    const q=normalize(query.trim());
    return pnjs.filter(p=>{
      const haystack=normalize([
        p.nom,p.description,p.role,p.notes,
        ...(p.aliases??[]),...p.factions.map(f=>`${factionNames.get(f.faction_id)??f.faction_id} ${f.role}`),...(p.tags??[]),...(p.lieux??[]).map(id=>lieuNames.get(id)??id),...(p.regions??[]).map(id=>regionNames.get(id)??id),...(p.evenements??[]).map(id=>eventNames.get(id)??id)
      ].filter(Boolean).join(" "));
      return (!q||haystack.includes(q))
        &&(!faction||p.factions.some(value=>value.faction_id===faction))
        &&(!tag||p.tags.includes(tag))
        &&(!lieu||(p.lieux??[]).includes(lieu))
        &&(!importance||p.importance===importance);
    }).sort((a,b)=>a.nom.localeCompare(b.nom,"fr"));
  },[pnjs,query,faction,tag,lieu,importance]);

  const openCreate=()=>{
    setEditingId(null);
    setDraft(emptyDraft);
    setImageUrl("");
    setShowEditor(true);
  };

  const openEdit=(p:Pnj)=>{
    setEditingId(p.id);
    setDraft(draftFromPnj(p));
    setImageUrl("");
    setSelected(null);
    setShowEditor(true);
  };

  const closeEditor=()=>{
    if(busy||imageBusy)return;
    setShowEditor(false);
    setEditingId(null);
    setDraft(emptyDraft);
    setImageUrl("");
  };

  const uploadImage=async(file:File,source:"envoyée"|"collée")=>{
    if(!["image/png","image/jpeg","image/webp","image/gif"].includes(file.type)){setMessage("Format non supporté. Utilise PNG, JPEG, WebP ou GIF.");return}
    if(file.size>10*1024*1024){setMessage("Image trop volumineuse (maximum 10 Mo).");return}
    setImageBusy(true);setMessage("");
    try{
      const form=new FormData();form.set("file",file);form.set("pnjId",editingId??(slug(draft.nom)||"pnj"));
      const response=await fetch(editingId?`/apil7r/pf2-mj/pnj/${encodeURIComponent(editingId)}/portrait`:"/apil7r/pf2-mj/pnj/portrait",{method:"POST",body:form});const payload=await response.json().catch(()=>null);
      if(!response.ok||typeof payload?.portrait!=="string")throw new Error(payload?.message||payload?.error||"Impossible d’envoyer l’image.");
      setDraft(current=>({...current,portrait:payload.portrait}));setMessage(`Portrait ${source} enregistré.${payload?.foundry==="synchronized"?" Foundry synchronisé.":payload?.foundry==="unavailable"?" Portrait local conservé ; Foundry indisponible.":""}`);
    }catch(error){setMessage(error instanceof Error?error.message:String(error))}finally{setImageBusy(false)}
  };

  const importImageUrl=async()=>{
    if(!imageUrl.trim()){setMessage("Indique une URL d’image.");return}
    setImageBusy(true);setMessage("");
    try{
      const response=await fetch(editingId?`/apil7r/pf2-mj/pnj/${encodeURIComponent(editingId)}/portrait/url`:"/apil7r/pf2-mj/pnj/portrait-from-url",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:imageUrl.trim(),pnjId:editingId??(slug(draft.nom)||"pnj")})});const payload=await response.json().catch(()=>null);
      if(!response.ok||typeof payload?.portrait!=="string")throw new Error(payload?.message||payload?.error||"Impossible de récupérer cette URL.");
      setDraft(current=>({...current,portrait:payload.portrait}));setImageUrl("");setMessage("Portrait importé dans le stockage PF2.");
    }catch(error){setMessage(error instanceof Error?error.message:String(error))}finally{setImageBusy(false)}
  };

  const pasteImage=(event:ClipboardEvent<HTMLDivElement>)=>{
    const item=[...event.clipboardData.items].find(value=>value.type.startsWith("image/"));
    if(!item){setMessage("Aucune image trouvée dans le presse-papiers.");return}
    const file=item.getAsFile();if(!file){setMessage("Aucune image trouvée dans le presse-papiers.");return}
    event.preventDefault();void uploadImage(file,"collée");
  };

  const dropImage=(event:DragEvent<HTMLDivElement>)=>{
    event.preventDefault();const file=[...event.dataTransfer.files].find(value=>value.type.startsWith("image/"));
    if(!file){setMessage("Format non supporté. Dépose une image PNG, JPEG, WebP ou GIF.");return}
    void uploadImage(file,"envoyée");
  };

  const savePnj=async()=>{
    if(!draft.nom.trim()){setMessage("Le nom est obligatoire.");return}
    setBusy(true);setMessage("");
    try{
      const item:Pnj={
        id:editingId??(slug(draft.nom)||`pnj-${Date.now()}`),
        nom:draft.nom.trim(),
        description:draft.description.trim(),
        factions:csv(draft.factions).map(faction_id=>({faction_id,role:"",statut:"Actuel"})),
        tags:csv(draft.tags),
        portrait:draft.portrait||undefined,
        foundryActorUuid:draft.foundryActorUuid||null,
        image:draft.image.trim()||undefined,
        aliases:csv(draft.aliases),
        lieux:csv(draft.lieux),
        regions:csv(draft.regions),
        evenements:csv(draft.evenements),
        role:draft.role.trim(),
        importance:draft.importance,
        statut:draft.statut,
        notes:draft.notes.trim()
      };
      const response=await fetch("/apil7r/pf2-mj/pnj",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"upsert",item})});
      const payload=await response.json().catch(()=>null);
      if(!response.ok)throw new Error(payload?.error||`Erreur HTTP ${response.status}`);
      const items:Pnj[]=payload.items??[];
      setPnjs(items);
      const saved=items.find(p=>p.id===item.id)??item;
      setDraft(emptyDraft);
      setEditingId(null);
      setShowEditor(false);
      setSelected(saved);
      setMessage(`${saved.nom} ${editingId?"modifié":"enregistré"}.`);
    }catch(error){setMessage(error instanceof Error?error.message:String(error))}
    finally{setBusy(false)}
  };

  const importJson=async()=>{
    if(!importText.trim()){setMessage("Colle d’abord du JSON dans le champ d’import.");return}
    setBusy(true);setMessage("");
    try{
      const parsed=JSON.parse(importText);
      const rawItems=Array.isArray(parsed)?parsed:Array.isArray(parsed?.items)?parsed.items:[parsed];
      if(!rawItems.length)throw new Error("Le JSON ne contient aucun PNJ.");
      const items:Pnj[]=rawItems.map((raw:any)=>({
        id:raw.id||slug(raw.nom||"")||`pnj-${crypto.randomUUID()}`,
        nom:raw.nom||"",
        description:raw.description||"",
        factions:Array.isArray(raw.factions)?raw.factions.filter((value:any)=>value&&typeof value.faction_id==="string"):[],
        tags:Array.isArray(raw.tags)?raw.tags:[],
        portrait:typeof raw.portrait==="string"?raw.portrait:undefined,
        foundryActorUuid:typeof raw.foundryActorUuid==="string"?raw.foundryActorUuid:null,
        image:raw.image||undefined,
        aliases:Array.isArray(raw.aliases)?raw.aliases:[],
        lieux:Array.isArray(raw.lieux)?raw.lieux:[],
        regions:Array.isArray(raw.regions)?raw.regions:[],
        evenements:Array.isArray(raw.evenements)?raw.evenements:[],
        role:raw.role||"",
        importance:raw.importance,
        statut:raw.statut,
        notes:raw.notes||""
      }));
      const invalidIndex=items.findIndex(item=>!isPnj(item));
      if(invalidIndex>=0)throw new Error(`Le PNJ n°${invalidIndex+1} est invalide : nom obligatoire, description/image en texte, factions/tags en tableaux.`);
      const response=await fetch("/apil7r/pf2-mj/pnj",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"import",items})});
      const payload=await response.json().catch(()=>null);
      if(!response.ok)throw new Error(payload?.error||`Erreur HTTP ${response.status}`);
      setPnjs(payload.items);
      setShowImport(false);
      setImportText("");
      const summary=payload.summary;
      setMessage(summary?`${summary.added} ajouté${summary.added>1?"s":""} · ${summary.updated} mis à jour · ${summary.total} traité${summary.total>1?"s":""}.`:`${items.length} PNJ importé${items.length>1?"s":""}.`);
    }catch(error){setMessage(error instanceof Error?error.message:String(error))}
    finally{setBusy(false)}
  };

  const pasteImport=async()=>{
    try{
      if(!navigator.clipboard?.readText)throw new Error("Lecture du presse-papiers indisponible dans ce navigateur.");
      setImportText(await navigator.clipboard.readText());
    }catch(error){setMessage(error instanceof Error?error.message:String(error))}
  };

  const downloadJson=(filename:string,data:unknown)=>{
    const blob=new Blob([JSON.stringify(data,null,2)+"\n"],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
  };

  const updateSelected=(pnj:Pnj)=>{setPnjs(items=>items.map(item=>item.id===pnj.id?pnj:item));setSelected(pnj);setFoundryInfo(null)};
  const loadFoundryCandidates=async()=>{setFoundryBusy(true);setMessage("");try{const response=await fetch("/apil7r/pf2-mj/pnj/foundry/candidates",{cache:"no-store"});const payload=await response.json();if(!response.ok)throw new Error(payload?.message??"Foundry indisponible.");setFoundryCandidates(Array.isArray(payload)?payload:[]);setShowFoundryAssociator(true)}catch(error){setMessage(error instanceof Error?error.message:String(error))}finally{setFoundryBusy(false)}};
  const associateFoundry=async(actorUuid:string)=>{if(!selected)return;setFoundryBusy(true);try{const response=await fetch(`/apil7r/pf2-mj/pnj/${encodeURIComponent(selected.id)}/foundry`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({actorUuid})});const payload=await response.json();if(!response.ok)throw new Error(payload?.message??"Association impossible.");updateSelected(payload as Pnj);setShowFoundryAssociator(false);setMessage("Actor Foundry associé.")}catch(error){setMessage(error instanceof Error?error.message:String(error))}finally{setFoundryBusy(false)}};
  const detachFoundry=async()=>{if(!selected||!window.confirm("Dissocier cet Actor ? Il ne sera pas supprimé de Foundry."))return;setFoundryBusy(true);try{const response=await fetch(`/apil7r/pf2-mj/pnj/${encodeURIComponent(selected.id)}/foundry`,{method:"DELETE"});const payload=await response.json();if(!response.ok)throw new Error(payload?.message??"Dissociation impossible.");updateSelected(payload as Pnj);setMessage("Actor Foundry dissocié ; aucun Actor n’a été supprimé.")}catch(error){setMessage(error instanceof Error?error.message:String(error))}finally{setFoundryBusy(false)}};
  const createFoundryPlaceholder=async()=>{if(!selected||!window.confirm(`Créer un Actor PNJ minimal pour ${selected.nom} ?`))return;setFoundryBusy(true);try{const response=await fetch(`/apil7r/pf2-mj/pnj/${encodeURIComponent(selected.id)}/foundry/create-placeholder`,{method:"POST"});const payload=await response.json();if(!response.ok)throw new Error(payload?.message??"Création du pion impossible.");updateSelected(payload.pnj as Pnj);setMessage(`Pion Foundry créé : ${payload.actor.uuid}.`)}catch(error){setMessage(error instanceof Error?error.message:String(error))}finally{setFoundryBusy(false)}};
  const syncFoundryPortrait=async()=>{if(!selected)return;setFoundryBusy(true);try{const response=await fetch(`/apil7r/pf2-mj/pnj/${encodeURIComponent(selected.id)}/foundry/sync-portrait`,{method:"POST"});const payload=await response.json();if(!response.ok)throw new Error(payload?.message??"Synchronisation impossible.");setFoundryInfo(current=>current?{...current,status:payload.foundry==="synchronized"?"available":"unavailable"}:current);setMessage(payload.foundry==="synchronized"?"Portrait synchronisé dans Foundry.":"Portrait local conservé ; Foundry indisponible.")}catch(error){setMessage(error instanceof Error?error.message:String(error))}finally{setFoundryBusy(false)}};

  const copyImage=async(p:Pnj)=>{
    const image=resolvePnjImage(p);
    if(!image){setMessage(`Aucune image définie pour ${p.nom}.`);return}
    try{
      if(!navigator.clipboard||typeof ClipboardItem==="undefined")throw new Error("Le navigateur ne permet pas la copie d’image dans le presse-papiers.");
      const png=await imageAsPng(image);
      await navigator.clipboard.write([new ClipboardItem({"image/png":png})]);
      setMessage(`Image de ${p.nom} copiée dans le presse-papiers.`);
    }catch(error){setMessage(`${error instanceof Error?error.message:String(error)} Une URL distante peut refuser la copie via CORS.`)}
  };

  return <main className="pnj-page">
    <style>{`
      .pnj-page{max-width:1500px;margin:0 auto;padding:24px;color:#252a25}.pnj-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}.pnj-toolbar h1{font-size:24px;margin:0 auto 0 0}.pnj-button{border:1px solid #c9b98f;background:#fffaf0;color:#6e5319;border-radius:8px;padding:9px 12px;font:inherit;font-weight:700;cursor:pointer}.pnj-button.primary{background:#765719;color:#fff;border-color:#765719}.pnj-button:disabled{opacity:.55;cursor:not-allowed}.pnj-message{min-height:22px;margin:4px 0 12px;color:#5d614f;font-size:13px}.pnj-filters{display:grid;grid-template-columns:minmax(220px,2fr) repeat(4,minmax(130px,1fr));gap:9px;margin-bottom:18px}.pnj-filters input,.pnj-filters select,.pnj-form input,.pnj-form select,.pnj-form textarea,.pnj-dialog>input{width:100%;box-sizing:border-box;border:1px solid #d6cdbd;border-radius:8px;background:#fffdf8;padding:9px 10px;font:inherit;color:inherit}.pnj-count{font-size:12px;color:#71756c;margin:0 0 8px}.pnj-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}.pnj-card{border:1px solid #ded7cb;background:#fffdf9;border-radius:12px;overflow:hidden;min-width:0}.pnj-card-image{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:#ece8df;cursor:copy;border:0;padding:0}.pnj-card-image.placeholder{display:grid;place-items:center;font-size:42px;color:#8c877d}.pnj-card-body{padding:12px}.pnj-card h2{font-size:17px;margin:0 0 4px}.pnj-role{font-size:12px;color:#777269;margin-bottom:8px}.pnj-description{font-size:13px;line-height:1.45;margin:0 0 9px}.pnj-chips{display:flex;gap:5px;flex-wrap:wrap}.pnj-chip{border:1px solid #d9cfba;border-radius:999px;padding:3px 7px;font-size:10px;background:#faf5e9}.pnj-chip.faction{border-color:#bca66e;background:#fff7de}.pnj-card-more{width:100%;border:0;border-top:1px solid #eee7da;background:#faf7f0;padding:8px;cursor:pointer;font:inherit;font-size:11px;font-weight:700;color:#66542b}.pnj-dialog-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);display:grid;place-items:center;padding:20px;z-index:50}.pnj-dialog{width:min(780px,100%);max-height:90vh;overflow:auto;background:#fffdf9;border-radius:14px;padding:18px}.pnj-dialog-head{display:flex;align-items:center;gap:8px;margin-bottom:12px}.pnj-dialog-head h2{margin:0 auto 0 0}.pnj-form{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pnj-form .wide{grid-column:1/-1}.pnj-form label{font-size:12px;font-weight:700;display:grid;gap:5px}.pnj-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}.pnj-detail-image{width:180px;max-width:38%;aspect-ratio:1;object-fit:cover;border-radius:10px;cursor:copy;float:left;margin:0 14px 10px 0}.pnj-detail dl{display:grid;grid-template-columns:110px 1fr;gap:7px 10px;font-size:13px}.pnj-detail dt{font-weight:700;color:#6b675f}.pnj-detail dd{margin:0}.pnj-empty{padding:40px;text-align:center;border:1px dashed #cfc7b8;border-radius:12px;color:#777}.pnj-hint{font-size:11px;color:#777;margin-top:6px}.pnj-import-textarea{width:100%;box-sizing:border-box;min-height:420px;resize:vertical;border:1px solid #cfc6b6;border-radius:9px;background:#fffdf8;padding:12px;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace;color:#252a25;tab-size:2}.pnj-import-help{font-size:12px;line-height:1.45;color:#6d6b65;margin:0 0 10px}.pnj-import-tools{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 0}.pnj-image-drop{grid-column:1/-1;min-height:190px;border:2px dashed #c9b98f;border-radius:12px;background:#faf7f0;display:grid;place-items:center;text-align:center;padding:14px;outline:none;cursor:pointer}.pnj-image-drop:focus{border-color:#765719;box-shadow:0 0 0 3px #eadfbf}.pnj-image-drop img{width:150px;height:150px;object-fit:cover;border-radius:9px;border:1px solid #d6cdbd}.pnj-image-drop strong{display:block;margin:7px 0 3px}.pnj-image-drop small{display:block;color:#6d6b65}.pnj-image-tools{grid-column:1/-1;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.pnj-image-tools input{flex:1;min-width:220px}.pnj-file-choice input{display:none}.pnj-foundry-section{clear:both;border-top:1px solid #ded7cb;margin-top:18px;padding-top:12px}.pnj-foundry-section h3{margin:0 0 8px}.pnj-foundry-section p{font-size:13px}.pnj-foundry-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.pnj-foundry-candidates{display:grid;gap:8px;margin-top:12px;max-height:46vh;overflow:auto}.pnj-foundry-candidate{display:grid;grid-template-columns:1fr auto;gap:3px 10px;text-align:left;border:1px solid #ded7cb;background:#fffdf9;border-radius:8px;padding:10px;cursor:pointer;font:inherit;color:inherit}.pnj-foundry-candidate small{grid-column:1;color:#6d6b65}.pnj-foundry-candidate span{grid-column:2;grid-row:1/3;color:#765719;font-weight:700;align-self:center}@media(max-width:900px){.pnj-filters{grid-template-columns:1fr 1fr}.pnj-filters input{grid-column:1/-1}}@media(max-width:560px){.pnj-page{padding:14px}.pnj-filters,.pnj-form{grid-template-columns:1fr}.pnj-form .wide{grid-column:auto}.pnj-grid{grid-template-columns:1fr 1fr}.pnj-toolbar h1{width:100%;margin-bottom:4px}}@media(max-width:390px){.pnj-grid{grid-template-columns:1fr}}
    `}</style>

    <div className="pnj-toolbar">
      <h1>Répertoire des PNJ</h1>
      <button className="pnj-button primary" onClick={openCreate}>+ Ajouter</button>
      <button className="pnj-button" onClick={()=>{setImportText("");setShowImport(true)}}>Importer JSON</button>
      <button className="pnj-button" onClick={()=>downloadJson("pnj-modele.json",jsonTemplate)}>Modèle JSON</button>
      <button className="pnj-button" onClick={()=>downloadJson("pnj-export.json",pnjs)}>Exporter</button>
    </div>

    <div className="pnj-message" aria-live="polite">{busy?"Enregistrement…":message}</div>

    <section className="pnj-filters" aria-label="Filtres PNJ">
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher nom, description, faction, tag, lieu…"/>
      <select value={faction} onChange={e=>setFaction(e.target.value)}><option value="">Toutes les factions</option>{factions.map(id=><option key={id} value={id}>{factionNames.get(id)??id}</option>)}</select>
      <select value={tag} onChange={e=>setTag(e.target.value)}><option value="">Tous les tags</option>{tags.map(v=><option key={v}>{v}</option>)}</select>
      <select value={lieu} onChange={e=>setLieu(e.target.value)}><option value="">Tous les lieux</option>{lieux.map(v=><option key={v}>{v}</option>)}</select>
      <select value={importance} onChange={e=>setImportance(e.target.value)}><option value="">Toute importance</option><option>Majeure</option><option>Récurrente</option><option>Secondaire</option><option>Figurant</option></select>
    </section>

    <p className="pnj-count">{filtered.length} PNJ affiché{filtered.length>1?"s":""} sur {pnjs.length} · clic sur un portrait = copie de l’image</p>

    {filtered.length?<section className="pnj-grid">
      {filtered.map(p=><article className="pnj-card" key={p.id}>
        {resolvePnjImage(p)?<img className="pnj-card-image" src={resolvePnjImage(p)} alt={`Portrait de ${p.nom}`} title="Cliquer pour copier l'image" onClick={()=>copyImage(p)}/>:<button className="pnj-card-image placeholder" onClick={()=>setSelected(p)} aria-label={`Ouvrir ${p.nom}`}>?</button>}
        <div className="pnj-card-body">
          <h2>{p.nom}</h2>
          <div className="pnj-role">{[p.role,p.importance,p.statut].filter(Boolean).join(" · ")}</div>
          <p className="pnj-description">{p.description||"Aucune description."}</p>
          <div className="pnj-chips">{p.factions.slice(0,3).map(v=><span className="pnj-chip faction" key={v.faction_id}>{factionNames.get(v.faction_id)??v.faction_id}{v.role?` — ${v.role}`:""}</span>)}{p.tags.slice(0,4).map(v=><span className="pnj-chip" key={v}>{v}</span>)}</div>
        </div>
        <button className="pnj-card-more" onClick={()=>setSelected(p)}>Voir la fiche</button>
      </article>)}
    </section>:<div className="pnj-empty">Aucun PNJ ne correspond aux filtres.</div>}

    {showImport&&<div className="pnj-dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setShowImport(false)}}>
      <section className="pnj-dialog" role="dialog" aria-modal="true" aria-label="Importer des PNJ en JSON">
        <div className="pnj-dialog-head"><h2>Importer du JSON</h2><button className="pnj-button" disabled={busy} onClick={()=>setShowImport(false)}>Fermer</button></div>
        <p className="pnj-import-help">Colle ici un PNJ unique, un tableau <code>[...]</code>, ou un objet <code>{'{ "items": [...] }'}</code>. Les nouveaux IDs sont ajoutés ; les IDs déjà présents sont mis à jour. Aucun autre PNJ n’est supprimé.</p>
        <textarea className="pnj-import-textarea" value={importText} onChange={e=>setImportText(e.target.value)} spellCheck={false} placeholder={`[\n  {\n    "id": "janira-gavix",\n    "nom": "Janira Gavix",\n    "description": "...",\n    "factions": ["Société des Éclaireurs"],\n    "tags": [],\n    "image": "https://..."\n  }\n]`}/>
        <div className="pnj-import-tools">
          <button className="pnj-button" disabled={busy} onClick={pasteImport}>Coller depuis le presse-papiers</button>
          <button className="pnj-button" disabled={busy} onClick={()=>setImportText(JSON.stringify(jsonTemplate,null,2))}>Insérer le modèle</button>
          <button className="pnj-button" disabled={busy||!importText} onClick={()=>setImportText("")}>Vider</button>
        </div>
        <div className="pnj-dialog-actions"><button className="pnj-button" disabled={busy} onClick={()=>setShowImport(false)}>Annuler</button><button className="pnj-button primary" disabled={busy||!importText.trim()} onClick={importJson}>{busy?"Import…":"Importer"}</button></div>
      </section>
    </div>}

    {showEditor&&<div className="pnj-dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeEditor()}}>
      <section className="pnj-dialog" role="dialog" aria-modal="true" aria-label={editingId?"Modifier un PNJ":"Ajouter un PNJ"}>
        <div className="pnj-dialog-head"><h2>{editingId?"Modifier le PNJ":"Ajouter un PNJ"}</h2><button className="pnj-button" onClick={closeEditor}>Fermer</button></div>
        <div className="pnj-form">
          <label>Nom<input value={draft.nom} onChange={e=>setDraft({...draft,nom:e.target.value})}/></label>
          <label>Rôle<input value={draft.role} onChange={e=>setDraft({...draft,role:e.target.value})} placeholder="Venture-Captain, marchand…"/></label>
          <label className="wide">Description<textarea rows={4} value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label>
          <label>Factions (IDs)<input list="pnj-factions" value={draft.factions} onChange={e=>setDraft({...draft,factions:e.target.value})} placeholder="faction_societe_des_eclaireurs"/><datalist id="pnj-factions">{factionRefs.map(item=><option key={item.id} value={item.id}>{item.nom}</option>)}</datalist></label>
          <label>Tags<input value={draft.tags} onChange={e=>setDraft({...draft,tags:e.target.value})} placeholder="allié, marchand, occultisme"/></label>
          <label>Lieux (IDs)<input list="pnj-lieux" value={draft.lieux} onChange={e=>setDraft({...draft,lieux:e.target.value})}/><datalist id="pnj-lieux">{lieuRefs.map(item=><option key={item.id} value={item.id}>{item.nom}</option>)}</datalist></label>
          <label>Régions (IDs)<input list="pnj-regions" value={draft.regions} onChange={e=>setDraft({...draft,regions:e.target.value})}/><datalist id="pnj-regions">{regionRefs.map(item=><option key={item.id} value={item.id}>{item.nom}</option>)}</datalist></label>
          <label>Événements (IDs)<input list="pnj-events" value={draft.evenements} onChange={e=>setDraft({...draft,evenements:e.target.value})}/><datalist id="pnj-events">{eventRefs.map(item=><option key={item.id} value={item.id}>{item.nom}</option>)}</datalist></label>
          <label>Alias<input value={draft.aliases} onChange={e=>setDraft({...draft,aliases:e.target.value})}/></label>
          <div className="pnj-image-drop" tabIndex={0} role="group" aria-label="Dépose, choisis ou colle une image ici" onPaste={pasteImage} onDragOver={event=>event.preventDefault()} onDrop={dropImage}>
            {resolvePnjImage(draft)?<><img src={resolvePnjImage(draft)} alt="Aperçu du portrait"/><strong>{imageBusy?"Envoi de l’image…":"Portrait actuel — dépose, choisis ou colle une image pour le remplacer"}</strong><small>{draft.portrait?draft.portrait:`Image historique : ${draft.image}`}</small></>:<div><strong>{imageBusy?"Envoi de l’image…":"Dépose, choisis ou colle une image ici"}</strong><small>Le fichier sera stocké dans le stockage PF2.</small></div>}
          </div>
          <div className="pnj-image-tools">
            <label className="pnj-button pnj-file-choice">{resolvePnjImage(draft)?"Remplacer le portrait":"Choisir une image"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={imageBusy} onChange={event=>{const file=event.target.files?.[0];event.target.value="";if(file)void uploadImage(file,"envoyée")}}/></label>
            {draft.portrait&&<button type="button" className="pnj-button" disabled={imageBusy} onClick={()=>setDraft(current=>({...current,portrait:""}))}>Retirer le portrait</button>}
          </div>
          <div className="pnj-image-tools"><input value={imageUrl} onChange={event=>setImageUrl(event.target.value)} placeholder="https://… — importer et stocker localement"/><button type="button" className="pnj-button" disabled={imageBusy||!imageUrl.trim()} onClick={importImageUrl}>Importer l’image</button></div>
          <label>Importance<select value={draft.importance} onChange={e=>setDraft({...draft,importance:e.target.value as Draft["importance"]})}><option>Majeure</option><option>Récurrente</option><option>Secondaire</option><option>Figurant</option></select></label>
          <label>Statut<select value={draft.statut} onChange={e=>setDraft({...draft,statut:e.target.value as Draft["statut"]})}><option>Actif</option><option>Disparu</option><option>Mort</option><option>Inconnu</option></select></label>
          <label className="wide">Notes MJ<textarea rows={3} value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})}/></label>
        </div>
        <div className="pnj-dialog-actions"><button className="pnj-button" onClick={closeEditor}>Annuler</button><button className="pnj-button primary" disabled={busy} onClick={savePnj}>{editingId?"Enregistrer les modifications":"Enregistrer"}</button></div>
      </section>
    </div>}

    {showFoundryAssociator&&selected&&<div className="pnj-dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!foundryBusy)setShowFoundryAssociator(false)}}>
      <section className="pnj-dialog" role="dialog" aria-modal="true" aria-label="Associer un Actor Foundry">
        <div className="pnj-dialog-head"><h2>Associer un Actor Foundry</h2><button className="pnj-button" disabled={foundryBusy} onClick={()=>setShowFoundryAssociator(false)}>Fermer</button></div>
        <input value={foundryQuery} onChange={event=>setFoundryQuery(event.target.value)} placeholder="Rechercher par nom ou UUID…"/>
        <div className="pnj-foundry-candidates">{foundryCandidates.filter(actor=>normalize(`${actor.name} ${actor.uuid}`).includes(normalize(foundryQuery))).map(actor=><button type="button" className="pnj-foundry-candidate" disabled={foundryBusy} key={actor.uuid} onClick={()=>void associateFoundry(actor.uuid)}><strong>{actor.name}</strong><small>{actor.type} · {actor.uuid}</small><span>Associer</span></button>)}</div>
      </section>
    </div>}

    {selected&&<div className="pnj-dialog-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
      <article className="pnj-dialog pnj-detail" role="dialog" aria-modal="true" aria-label={selected.nom}>
        <div className="pnj-dialog-head"><h2>{selected.nom}</h2><button className="pnj-button primary" onClick={()=>openEdit(selected)}>Modifier</button><button className="pnj-button" onClick={()=>setSelected(null)}>Fermer</button></div>
        {resolvePnjImage(selected) ? <img className="pnj-detail-image" src={resolvePnjImage(selected)} alt={`Portrait de ${selected.nom}`} title="Cliquer pour copier l'image" onClick={()=>copyImage(selected)}/> : null}
        <p>{selected.description}</p>
        <dl>
          <dt>Rôle</dt><dd>{selected.role||"—"}</dd>
          <dt>Factions</dt><dd>{selected.factions.map(value=>`${factionNames.get(value.faction_id)??value.faction_id}${value.role?` — ${value.role}`:""}${value.statut?` (${value.statut})`:""}`).join(" · ")||"—"}</dd>
          <dt>Tags</dt><dd>{selected.tags.join(" · ")||"—"}</dd>
          <dt>Lieux</dt><dd>{selected.lieux?.map(id=>lieuNames.get(id)??id).join(" · ")||"—"}</dd>
          <dt>Régions</dt><dd>{selected.regions?.map(id=>regionNames.get(id)??id).join(" · ")||"—"}</dd>
          <dt>Événements</dt><dd>{selected.evenements?.map(id=>eventNames.get(id)??id).join(" · ")||"—"}</dd>
          <dt>Alias</dt><dd>{selected.aliases?.join(" · ")||"—"}</dd>
          <dt>Importance</dt><dd>{selected.importance||"—"}</dd>
          <dt>Statut</dt><dd>{selected.statut||"—"}</dd>
          <dt>Notes MJ</dt><dd>{selected.notes||"—"}</dd>
        </dl>
        <section className="pnj-foundry-section">
          <h3>Foundry</h3>
          {!foundryInfo?<p>Vérification de l’Actor associé…</p>:foundryInfo.status==="not-linked"?<p>Aucun Actor associé.</p>:foundryInfo.status==="unavailable"?<p>Actor associé <code>{foundryInfo.actorUuid}</code>, mais Foundry est indisponible ou l’Actor est introuvable.</p>:<div><strong>✓ {foundryInfo.actor?.name}</strong><br/><code>{foundryInfo.actorUuid}</code><br/><small>{foundryInfo.actor?.type}{foundryInfo.actor?.level!==null?` · niveau ${foundryInfo.actor?.level}`:""}{foundryInfo.actor?.hp!==null?` · PV ${foundryInfo.actor?.hp}`:""}</small></div>}
          <div className="pnj-foundry-actions">
            {!selected.foundryActorUuid&&<button className="pnj-button primary" disabled={foundryBusy} onClick={()=>void createFoundryPlaceholder()}>Créer un pion</button>}
            {!selected.foundryActorUuid&&<button className="pnj-button" disabled={foundryBusy} onClick={()=>void loadFoundryCandidates()}>Associer un Actor existant</button>}
            {selected.foundryActorUuid&&<><button className="pnj-button" disabled={foundryBusy||!selected.portrait} onClick={()=>void syncFoundryPortrait()}>Resynchroniser le portrait</button><button className="pnj-button" disabled={foundryBusy} onClick={()=>void loadFoundryCandidates()}>Changer l’association</button><button className="pnj-button" disabled={foundryBusy} onClick={()=>void detachFoundry()}>Dissocier</button></>}
            <button className="pnj-button" disabled title="La génération complète des statistiques PF2 n’est pas encore implémentée.">Générer / compléter PF2</button>
          </div>
        </section>
      </article>
    </div>}
  </main>;
}
