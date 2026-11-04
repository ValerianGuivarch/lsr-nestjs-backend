/**
 * One-time requested map cleanup. Run via regular Foundry Document APIs.
 * Deliberately isolated from general toolkit features for later removal.
 * Triggered on GM ready, world-specific and idempotent.
 * Removes only exact source duplicates, translates scene and folder labels.
 */
const MODULE="pf2e-val-toolkit";
const SETTING="mapCleanupOneTime20261104";
const translationsUrl="modules/pf2e-val-toolkit/scripts/map-maintenance-translations.json";

export function registerOneTimeMapCleanup(){
  game.settings.register(MODULE,SETTING,{
    name:"Nettoyage ponctuel des cartes 2026-11-04",
    scope:"world",config:false,type:Object,
    default:{finished:false,running:false,report:null}
  });
}
const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
const count=(x,key)=>x[key]?.size??x[key]?.length??0;
function sourceKey(scene,translate){
  return [
    scene.folder?.id||"",
    translate(scene.name).toLowerCase().trim().replace(/\s+/g," "),
    scene.getFlag("racooze-map-library","mapSlug")||"",
    scene.getFlag("racooze-map-library","sceneFile")||"",
    scene.getFlag("racooze-map-library","resolvedVariant")||""
  ].join("\u0001");
}
function fingerprint(scene){
  return JSON.stringify({
    slug:scene.getFlag("racooze-map-library","mapSlug"),
    sceneFile:scene.getFlag("racooze-map-library","sceneFile"),
    resolvedVariant:scene.getFlag("racooze-map-library","resolvedVariant"),
    sourceFingerprint:scene.getFlag("racooze-map-library","scenesFingerprint"),
    assetFingerprint:scene.getFlag("racooze-map-library","assetsFingerprint"),
    width:scene.width,height:scene.height,
    grid:{size:scene.grid?.size,type:scene.grid?.type,distance:scene.grid?.distance},
    backgrounds:[...(scene.levels||[])].map(l=>l.background?.src||""),
    foregrounds:[...(scene.levels||[])].map(l=>l.foreground?.src||"")
  });
}
function priority(scene){
  return (scene.active?1000000000:0) + (scene.navigation?10000000:0)+
    50000*count(scene,"tokens") + 20000*count(scene,"notes") +
    10000*count(scene,"drawings") + 5000*count(scene,"regions")+
    1000*count(scene,"tiles") + 100*count(scene,"sounds")+
    10*count(scene,"walls") + count(scene,"lights");
}
function translationFactory(dict){
  const names=new Map(Object.entries(dict.scenes));
  const folders=new Map(Object.entries(dict.folders));
  const variants=new Map(Object.entries(dict.variants||{}));
  function translate(name){
    if(names.has(name))return names.get(name);
    const m=/^(\d+[.]\s*)?(.+?)(?:\s*\(([^()]*)\))?$/.exec(name);
    if(!m)return name;
    const base=names.get(m[2])||dict.phandelver?.[m[2]]||null;
    if(!base)return name;
    const suffix=m[3] ? " ("+m[3].split("|").map(v=>variants.get(v.trim())||v.trim()).join(" | ")+")":"";
    return (m[1]||"")+base+suffix;
  }
  return {scene:translate,folder:name=>folders.get(name)||translate(name)};
}
async function downloadReport(report,backups){
  // Use native client-side download; data stays accessible through the
  // world setting below even if the browser blocks the download.
  if(typeof saveDataToFile==="function"){
    if(backups.length)saveDataToFile(JSON.stringify(backups,null,2),"application/json","sauvegarde-cartes-supprimees-20261104.json");
    saveDataToFile(JSON.stringify(report,null,2),"application/json","rapport-nettoyage-cartes-20261104.json");
  }
}
async function perform(){
  if(game.world?.id!=="test-pf2" || !game.user?.isGM||game.users.activeGM?.id!==game.user.id)return;
  const state=game.settings.get(MODULE,SETTING);
  if(state?.finished || state?.running)return;
  // The world may have changed since the last audit; always recompute.
  const response=await fetch(translationsUrl,{cache:"no-store"});
  if(!response.ok)throw Error("Fichier des traductions absent : "+response.status);
  const labels=translationFactory(await response.json());
  const all=[...game.scenes];
  const groups=new Map();
  for(const scene of all){
    if(!scene.getFlag("racooze-map-library","mapSlug"))continue;
    const key=sourceKey(scene,labels.scene);const group=groups.get(key)||[];
    group.push(scene);groups.set(key,group);
  }
  const removals=[],skipped=[];
  for(const entries of groups.values()){
    if(entries.length<2)continue;
    const fingerprints=new Set(entries.map(fingerprint));
    if(fingerprints.size>1){
      skipped.push({name:entries[0].name,reason:"sources ou géométries différentes",ids:entries.map(x=>x.id)});
      continue;
    }
    const ranked=[...entries].sort((a,b)=>priority(b)-priority(a) ||
      (a._stats?.createdTime||0)-(b._stats?.createdTime||0));
    const winner=ranked[0];
    for(const scene of ranked.slice(1)){
      if(scene.active || count(scene,"tokens")>count(winner,"tokens") ||
        count(scene,"walls")>count(winner,"walls") ||
        count(scene,"tiles")>count(winner,"tiles")){
        skipped.push({name:scene.name,reason:"possible enrichissement manuel",id:scene.id});
        continue;
      }
      removals.push({scene,winner});
    }
  }
  const doomedIds=new Set(removals.map(x=>x.scene.id));
  const renames=all.filter(s=>!doomedIds.has(s.id)).map(scene=>({
    scene,name:labels.scene(scene.name)
  })).filter(x=>x.name!==x.scene.name);
  const folderRenames=[...game.folders].filter(f=>f.type==="Scene").map(folder=>({
    folder,name:labels.folder(folder.name)
  })).filter(x=>x.name!==x.folder.name);
  const report={
    date:new Date().toISOString(),scenesBefore:all.length,
    expected:{duplicates:removals.length,sceneRenames:renames.length,folderRenames:folderRenames.length},
    deleted:[],renamed:[],foldersRenamed:[],skipped,errors:[]
  };
  console.info("PF2e Val Toolkit | Map cleanup plan",report.expected);
  await game.settings.set(MODULE,SETTING,{finished:false,running:true,report});
  // Save the full source of all documents targeted for deletion before
  // any mutation. Backups use document.toObject() and retain embedded data.
  const backups=removals.map(({scene,winner})=>({keptId:winner.id,
    folder:scene.folder?.name,document:scene.toObject()}));
  if(backups.length && typeof saveDataToFile!=="function"){
    await game.settings.set(MODULE,SETTING,{finished:false,running:false,report:{
      ...report,errors:[{reason:"Impossible de sauvegarder les scènes. Rien n'a été supprimé."}]
    }});
    throw Error("Sauvegarde JSON indisponible : suppression annulée.");
  }
  try {
    if(backups.length)saveDataToFile(JSON.stringify(backups,null,2),"application/json",
      "sauvegarde-cartes-supprimees-20261104.json");
    for(const {scene,winner} of removals){
      try{
        if(!game.scenes.get(scene.id))continue;
        await scene.delete();
        report.deleted.push({id:scene.id,name:scene.name,keptId:winner.id});
      }catch(error){report.errors.push({action:"delete",id:scene.id,error:String(error)});}
    }
    for(const {scene,name} of renames){
      try{
        if(!game.scenes.get(scene.id))continue;
        const old=scene.name;await scene.update({name});
        report.renamed.push({id:scene.id,from:old,to:name});
      }catch(error){report.errors.push({action:"rename",id:scene.id,error:String(error)});}
    }
    for(const {folder,name} of folderRenames){
      try{
        if(!game.folders.get(folder.id))continue;
        const old=folder.name;await folder.update({name});
        report.foldersRenamed.push({id:folder.id,from:old,to:name});
      }catch(error){report.errors.push({action:"folder",id:folder.id,error:String(error)});}
    }
  }finally{
    report.scenesAfter=game.scenes.size;
    report.finishedAt=new Date().toISOString();
    await game.settings.set(MODULE,SETTING,{finished:true,running:false,report});
    if(typeof saveDataToFile==="function")
      saveDataToFile(JSON.stringify(report,null,2),"application/json",
        "rapport-nettoyage-cartes-20261104.json");
  }
  const msg="Nettoyage cartes : "+report.deleted.length+" doublons supprimés, "+
    report.renamed.length+" scènes et "+report.foldersRenamed.length+
    " dossiers traduits ; "+report.errors.length+" erreurs.";
  if(report.errors.length)ui.notifications.warn(msg);else ui.notifications.info(msg);
  console.info("PF2e Val Toolkit | Map cleanup complete",report);
}
export function startOneTimeMapCleanup(){
  if(game.world?.id!=="test-pf2" || !game.user?.isGM||game.users.activeGM?.id!==game.user.id)return;
  // This temporary hook is explicitly authorized by the GM. It only runs
  // once per world and becomes inert after storing finished=true.
  void perform().catch(async error=>{
    console.error("PF2e Val Toolkit | Map cleanup failed",error);
    ui.notifications?.error?.("Nettoyage cartes impossible : "+error.message);
    const previous=game.settings.get(MODULE,SETTING);
    if(previous?.running)await game.settings.set(MODULE,SETTING,{
      finished:false,running:false,report:previous.report
    });
  });
}