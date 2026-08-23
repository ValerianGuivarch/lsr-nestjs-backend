import canonical from "./data/catalogue-pf2.json";

export type Possession="Complet"|"Partiel"|"Absent"|"Incertain";
export type Langue="FR"|"EN";
export type Usage="CORE"|"OPTION"|"RÉSERVE"|"ÉCARTÉ"|"ENDGAME"|"FUTUR";
export type Playability="Prêt"|"À adapter"|"Simple inspiration";
export type Progress="Non spécifié"|"À jouer"|"En cours"|"Joué";

export type DocumentLocal={fileId:string;label:string;chemin:string;variante:string;completude:string;langue:Langue};
export type Part={id:string;titleFr?:string|null;titleOriginal?:string|null;kind:string;sequence?:number|null;number?:string|null;levels?:string|null;requiredForCore?:boolean;notes?:string;documents?:Array<{fileId:string;variant:string;completeness:string}>};
export type OpenTable={rating:number;relevance?:string;rationale?:string;adaptation?:string;fixedGroupDependency?:string;missionBreakdown?:string;societyIntegration?:string;reviewStatus?:string};
export type Story={thread?:string;usage?:Usage;period?:string;golarionDate?:string;acquisitionPriority?:string;gmStatus?:string};

export type Entry={
  id:string;legacyIds:string[];sectionId:string;collectionId:string|null;kind:string;edition:string;
  titleFr:string|null;titleOriginal:string|null;aliases:string[];number?:string|null;
  publicationStatus:string;releaseDate?:string|null;levels:string|null;regions:string[];locationStatus:string;locationNote?:string;
  tags:string[];arcIds:string[];synopsis:string|null;gmDetails:string|null;openTable:OpenTable;story:Story;
  characterHooks:Array<{characterId:string;rationale:string}>;documents:Array<{fileId:string;variant:string;completeness:string}>;
  parts:Part[];coverage:{status:string;requiredItems:number;presentItems:number;missingItemIds:string[];supplementItems:string[]};notes:string;
  timeline?:{yearAR:number|null;estimated:boolean};organizedPlay?:{repeatable?:boolean;ruleAsOf?:string};researchStatus?:string;
};
export type Collection={id:string;sectionId:string;parentId:string|null;kind:string;titleFr:string;titleOriginal?:string;season?:number;order:number;entryCount?:number;aggregateRegions?:string[];publishedCount?:number};
export type Arc={id:string;titleFr:string;season?:number;entryIds:string[];order?:string;description?:string};
export type Section={id:string;title:string;order:number;description:string};

const raw=canonical as unknown as {schemaVersion:number;meta:any;files:any[];entries:Entry[];collections:Collection[];arcs:Arc[];sections:Section[]};
const fileMap=new Map(raw.files.map(file=>[file.id,file]));
export const entries:Entry[]=raw.entries;
export const entryMap=new Map(entries.map(entry=>[entry.id,entry]));
export const collections:Collection[]=raw.collections;
export const collectionMap=new Map(collections.map(collection=>[collection.id,collection]));
export const arcs:Arc[]=raw.arcs;
export const arcMap=new Map(arcs.map(arc=>[arc.id,arc]));
export const sections:Section[]=raw.sections.slice().sort((a,b)=>a.order-b.order);

const translationVariants=new Set(["traduction_partielle","traduction_non_officielle"]);
const kindNames:Record<string,string>={
  campaign:"Campagne longue",adventure:"Aventure autonome",quest:"Quest",bounty:"Bounty","one-shot":"One-Shot",
  "community-adventure":"Aventure communautaire","pfs-scenario":"Scénario PFS","pfs-intro":"Intro PFS","pfs-special":"Spécial PFS","pfs1e-special":"PFS 1e (legacy)"
};
const possessionNames:Record<string,Possession>={complet:"Complet",partiel:"Partiel",absent:"Absent",incertain:"Incertain"};

export function kindLabel(entry:Entry){return kindNames[entry.kind]??entry.kind;}
export function titleOf(entry:Entry){return entry.titleFr||entry.titleOriginal||entry.id;}
export function originalTitleOf(entry:Entry){return entry.titleFr&&entry.titleOriginal&&entry.titleFr!==entry.titleOriginal?entry.titleOriginal:null;}
export function collectionOf(entry:Entry){return entry.collectionId?collectionMap.get(entry.collectionId):undefined;}
export function arcNames(entry:Entry){return entry.arcIds.map(id=>arcMap.get(id)?.titleFr).filter(Boolean) as string[];}
export function possessionOf(entry:Entry):Possession{return possessionNames[entry.coverage?.status]??"Incertain";}
export function sourceDocuments(entry:Entry){return entry.documents.filter(document=>!translationVariants.has(document.variant));}
export function hasTranslation(entry:Entry){return entry.documents.some(document=>translationVariants.has(document.variant));}
export function localDocuments(entry:Entry):DocumentLocal[]{
  const docs=[...entry.documents,...entry.parts.flatMap(part=>part.documents??[])];
  return docs.flatMap(document=>{
    const file=fileMap.get(document.fileId);if(!file)return [];
    const lang:Langue=file.languageHint==="fr"?"FR":"EN";
    return [{fileId:document.fileId,label:file.filename,chemin:`/bibliotheque/${file.path.split("/").map(encodeURIComponent).join("/")}`,variante:document.variant,completude:document.completeness,langue:lang}];
  });
}
export function languageOf(entry:Entry):Langue{
  const docs=sourceDocuments(entry).flatMap(document=>{const file=fileMap.get(document.fileId);return file?[file]:[]});
  if(docs.some(file=>file.languageHint==="en"))return "EN";
  if(docs.some(file=>file.languageHint==="fr"))return "FR";
  const partDocs=entry.parts.flatMap(part=>part.documents??[]).filter(document=>!translationVariants.has(document.variant)).flatMap(document=>{const file=fileMap.get(document.fileId);return file?[file]:[]});
  return partDocs.some(file=>file.languageHint==="en")?"EN":"FR";
}
export function isPfsMission(entry:Entry){return ["pfs-scenario","pfs-intro","pfs-special","quest","bounty"].includes(entry.kind);}
export function isPfsScenario(entry:Entry){return ["pfs-scenario","pfs-intro","pfs-special"].includes(entry.kind);}
export function isOwned(entry:Entry){return sourceDocuments(entry).length>0||entry.parts.some(part=>(part.documents??[]).some(document=>!translationVariants.has(document.variant)));}
export function readyFr(entry:Entry){const language=languageOf(entry);return possessionOf(entry)==="Complet"&&(language==="FR"||hasTranslation(entry));}
export function entriesForCollection(id:string){return entries.filter(entry=>entry.collectionId===id);}
export function childCollections(id:string){return collections.filter(collection=>collection.parentId===id).sort((a,b)=>a.order-b.order);}
export function relevanceOf(entry:Entry){return entry.openTable.relevance||entry.story.acquisitionPriority||"À évaluer";}
export function yearOf(entry:Entry){return entry.timeline?.yearAR??null;}
export function locationLabel(entry:Entry){return entry.regions.length?entry.regions.join(", "):entry.locationStatus==="variable"?"Variable / à placer":"À documenter";}

export const pfsSeasons=collections.filter(collection=>collection.kind==="pfs-season").sort((a,b)=>(a.season??0)-(b.season??0));
export const pfsQuests=entries.filter(entry=>entry.kind==="quest");
export const pfsBounties=entries.filter(entry=>entry.kind==="bounty");
export const legacyEntries=entries.filter(entry=>entry.sectionId==="legacy");
export const scanMeta={total:raw.files.length,campagnes:raw.files.filter(file=>file.path.startsWith("Campagnes/")).length,regles:raw.files.filter(file=>file.path.startsWith("Règles/")).length,univers:raw.files.filter(file=>file.path.startsWith("Univers/")).length,verifiedAt:raw.meta.lastVerifiedAt,schemaVersion:raw.schemaVersion};
