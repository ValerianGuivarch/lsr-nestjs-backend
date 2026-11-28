import {MODULES,LABELS,COLORS,RUNE_KEYS,SIMON_COLORS,simonVisual,simonDue,DIALS,initialState,tick,apply,adjust,playerState} from "./engine.js";
import {MANUALS,STATIONS,MANUAL_POSITIONS} from "./manuals.js";
import {ILLUSTRATED_LAYOUT} from "./layouts.js";
import {privateOwnership,hasPrivateOwnership} from "./permissions.js";
const NS="pf2e-val-toolkit", CHANNEL="module."+NS, KEY="cooperativeTrial";
const BASE="modules/"+NS+"/icons/cooperative/";
const COLORS_HEX={R:0xff4141,B:0x4ca7ff,J:0xffd343,V:0x45dd78};
const COLOR_CSS=["#ec5656","#55a0ff","#e8cf55","#55a0ff","#eeeeee"];
const esc=x=>foundry.utils.escapeHTML(String(x??""));
const clock=()=>game.time?.serverTime??Date.now();
let authority=null, view=null, panel=null, consolePanel=null, queue=Promise.resolve(), busy=false;
const hasAuthority=()=>game.user?.isGM && game.users.activeGM?.id===game.user.id;
const trialScene=()=>canvas.scene?.getFlag(NS,"cooperativeLayout")===true;
const sceneById=id=>game.scenes.get(id);
const statusLabels={running:"En cours",paused:"En pause",success:"Stabilisé",failed:"Arrêt d’urgence",stopped:"Arrêté"};
const send=data=>game.socket.emit(CHANNEL,data);
function getSaved(){return game.settings.get(NS,KEY);}
function runSerial(fn){queue=queue.then(fn).catch(e=>{console.error("Épreuves coopératives",e);ui.notifications.error("Épreuve : "+e.message);});return queue;}
function role(id,s){return game.users.get(id)?.isGM||id===s.operatorId?"operator":"expert";}
function near(note,userId,tokenId) {
 const user=game.users.get(userId),scene=note?.parent;
 if(!scene||!user||!user.active)return false;
 const close=String(noteStation(note)??"").startsWith("simon-")||!!noteManual(note);
 if(user.isGM&&!close)return true;
 const token=scene.tokens.get(tokenId);
 if(!token||token.hidden||!token.actor?.testUserPermission(user,"OWNER"))return false;
 const g=scene.grid.size||100;
 const dx=token.x+(token.width||1)*g/2-note.x,dy=token.y+(token.height||1)*g/2-note.y;
 return Math.hypot(dx,dy)<=g*(close?1.5:2.5);
}
function selectedNear(note) {
 if(game.user.isGM&&!noteManual(note)&&!String(noteStation(note)??"").startsWith("simon-"))return {id:null};
 // Only selected, owned tokens are accepted. No action from a remote location.
 return (canvas.tokens.controlled??[]).map(t=>t.document).find(t=>near(note,game.user.id,t.id));
}
function noteStation(note){return note?.getFlag(NS,"cooperativeStation");}
function noteManual(note){return note?.getFlag(NS,"cooperativeManual");}
function makeNote(entry,x,y,text,icon,flag) {
 return {entryId:entry.id,x,y,text,iconSize:70,global:false,fontSize:20,texture:{src:BASE+icon+".svg"},flags:{[NS]:flag}};
}
async function verifyIllustratedAsset(layout){
 const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error("Carte rati.png introuvable."));img.src=layout.src;});
 if(img.naturalWidth!==1000||img.naturalHeight!==1136)throw Error("Dimensions inattendues pour rati.png.");
}
async function repairIllustratedBackground(scene=canvas.scene){
 if(!game.user.isGM||scene?.getFlag(NS,"cooperativePreset")!=="illustrated")throw Error("Sélectionnez la salle illustrée.");
 const level=scene.initialLevel??scene.levels.contents[0];
 if(!level)throw Error("Niveau de scène introuvable.");
 if(level.background?.src===ILLUSTRATED_LAYOUT.src){ui.notifications.info("Le fond rati.png est déjà enregistré. Vérifiez le niveau affiché et la visibilité.");return;}
 if(level.background?.src)throw Error("Un autre fond existe déjà : aucune modification automatique.");
 await verifyIllustratedAsset(ILLUSTRATED_LAYOUT);
 await level.update({"background.src":ILLUSTRATED_LAYOUT.src});
 if(level.background?.src!==ILLUSTRATED_LAYOUT.src)throw Error("Le fond n’a pas été enregistré.");
 ui.notifications.info("Fond du Ratisseur réparé, sans modifier les repères ni les murs.");
}
async function createLayout(preset="blank"){
 const illustrated=preset==="illustrated",layout=illustrated?ILLUSTRATED_LAYOUT:null;
 if(!game.user.isGM)return;
 const folders=game.folders.filter(f=>f.type==="Scene");
 const chosen=folders.find(f=>f.name.replace(/[’']/g,"'")==="Agents d'Absalom");
 const opts=await foundry.applications.api.DialogV2.wait({
  window:{title:"Créer une salle d’épreuves coopératives"},
  content:'<label>Nom <input name="name" value="'+esc(layout?.name??"Le Ratisseur de tombes")+'"></label><label>Dossier <select name="folder"><option value="">Racine</option>'+folders.map(f=>'<option value="'+esc(f.id)+'" '+(f.id===chosen?.id?'selected':'')+'>'+esc(f.name)+'</option>').join("")+'</select></label><p>'+(illustrated?"Carte rati.png, 30 × 34 cases environ, salle des machines au nord et bureau au sud, séparés par une cloison de jeu.":"Scène vide 26 × 19 cases, deux zones séparées.")+' Six manuels et dix mécanismes. Ne crée aucun Actor, ne remplace aucune scène.</p>',
  buttons:[{action:"create",label:"Créer",callback:(_e,b)=>Object.fromEntries(new FormData(b.form))},{action:"cancel",label:"Annuler",callback:()=>null}],close:()=>null
 });
 if(!opts)return;
 const name=String(opts.name||"Épreuves coopératives").trim();
 if(game.scenes.some(s=>s.name===name)){ui.notifications.warn("Une scène porte déjà ce nom. Choisissez un autre nom.");return;}
 if(illustrated)await verifyIllustratedAsset(layout);
 const levelId=foundry.utils.randomID();
 const scene=await Scene.create({name,folder:opts.folder||null,width:layout?.width??2600,height:layout?.height??1900,padding:0,levels:[{_id:levelId,name:"Rez-de-chaussée",background:{src:layout?.src??null,color:"#242b31"}}],initialLevel:levelId,tokenVision:true,fog:{mode:CONST.FOG_EXPLORATION_MODES.DISABLED},environment:{darknessLevel:0,darknessLock:true,globalLight:{enabled:true}},grid:{type:CONST.GRID_TYPES.SQUARE,size:layout?.grid??100,distance:5,units:"ft",alpha:illustrated?0:0.2},navigation:false,flags:{[NS]:{cooperativeLayout:true,cooperativePreset:illustrated?"illustrated":"blank"}}});
 if(illustrated&&scene.initialLevel?.background?.src!==layout.src)await repairIllustratedBackground(scene);
 const journalFolder=game.folders.find(f=>f.type==="JournalEntry"&&f.name===chosen?.name);
 // A dedicated folder avoids scattering journals; no existing documents are changed.
 const jf=await Folder.create({name:name+" — épreuves",type:"JournalEntry",folder:journalFolder?.id??null});
 const anchor=await JournalEntry.create({name:name+" — mécanismes",folder:jf.id,ownership:{default:2},pages:[{name:"Interaction",type:"text",text:{content:"<p>Double-cliquez sur un repère avec un personnage à proximité. L’épreuve est lancée par le MJ.</p>",format:1}}],flags:{[NS]:{cooperativeScene:scene.id}}});
 const notes=[];
 for(const [i,[key,manual]] of Object.entries(Object.entries(MANUALS))){
  const j=await JournalEntry.create({name:manual.name,folder:jf.id,ownership:{default:0},pages:[{name:"Instructions",type:"text",text:{content:manual.text,format:1}}],flags:{[NS]:{cooperativeScene:scene.id,cooperativeManual:key}}});
  const [x,y]=(layout?.manuals??MANUAL_POSITIONS)[Number(i)];
  notes.push(makeNote(anchor,x,y,manual.name,"manual-"+key,{cooperativeManual:key}));
 }
 for(const st of STATIONS){const [x,y]=layout?.stations[st.id]??[st.x,st.y];notes.push(makeNote(anchor,x,y,st.label,st.icon,{cooperativeStation:st.id}));}
 // Partition at x=1900; bottom entry to a one-cell-wide passage by the return wall.
 const wall=(c,door=0)=>({c,move:20,sight:20,light:20,sound:0,door,ds:0});
 await scene.createEmbeddedDocuments("Wall",illustrated?layout.walls.map(w=>wall(w.c,w.door)):[
  wall([50,50,2550,50]),wall([2550,50,2550,1850]),wall([2550,1850,50,1850]),wall([50,1850,50,50]),
  wall([1900,50,1900,1650]),wall([1900,1650,1900,1750],1),wall([1900,1750,1900,1850]),
  wall([2100,50,2100,1300]),wall([1900,1300,2100,1300])
 ]);
 await scene.createEmbeddedDocuments("Note",notes);
 await scene.view();
 ui.notifications.info(name+" : "+notes.length+" repères créés. Déplacez les PJ puis ouvrez Épreuves coopératives.");
}
async function grantManuals(s) {
 // Only the harmless interaction anchor is readable by players. Manual text is
 // displayed by the proximity-gated client panel, never by a sidebar Journal.
 const scene=sceneById(s.sceneId);
 const anchor=game.journal.find(j=>j.getFlag(NS,"cooperativeScene")===s.sceneId&&!j.getFlag(NS,"cooperativeManual"));
 if(!scene||!anchor)throw Error("Ancrage des mécanismes introuvable.");
 for(const j of game.journal.filter(j=>j.getFlag(NS,"cooperativeScene")===s.sceneId&&j.getFlag(NS,"cooperativeManual"))){
  // V14 validates the ownership diff itself: deletion markers and null
  // values are not valid ownership entries. Use explicit NONE levels.
  if(!hasPrivateOwnership(j.ownership))await j.update({ownership:privateOwnership(j.ownership)});
  if(!hasPrivateOwnership(j.ownership))throw Error("Permissions du manuel non révoquées : "+j.name);
  for(const page of j.pages){
   const own=page.ownership??{};
   // Inherit (-1) is safe when the parent is private; revoke explicit access.
   if(Object.values(own).some(level=>level>0)){
    await page.update({ownership:privateOwnership(own)});
    if(!hasPrivateOwnership(page.ownership))throw Error("Permissions de la page non révoquées : "+page.name);
   }
  }
  const manual=MANUALS[j.getFlag(NS,"cooperativeManual")],page=j.pages.find(p=>p.type==="text");
  if(manual&&page&&page.text.content!==manual.text)await page.update({"text.content":manual.text});
 }
 const updates=scene.notes.filter(n=>Object.hasOwn(MANUALS,noteManual(n)??"")).flatMap(n=>{
  const src=BASE+"manual-"+noteManual(n)+".svg";
  if(n.entryId===anchor.id&&!n.pageId&&n.texture.src===src)return [];
  return [{_id:n.id,entryId:anchor.id,pageId:null,"texture.src":src}];
 });
 if(updates.length)await scene.updateEmbeddedDocuments("Note",updates);
}
function canReadManual(note){
 return !!note&&canvas.scene?.id===note.parent?.id&&view?.sceneId===note.parent.id&&
 ["running","paused"].includes(view.status)&&Object.hasOwn(MANUALS,noteManual(note)??"")&&
 (game.user.isGM||game.user.id!==view.operatorId)&&!!selectedNear(note);
}
async function chat(label,pressure,delta=0,error=false){
 const color=error?"#b83e3e":"inherit";
 await ChatMessage.create({speaker:{alias:"Couplage de quintessence"},content:'<p style="color:'+color+'"><b>'+esc(label)+'</b> — Pression : <b>'+pressure+' %</b>'+(delta?(' ('+(delta>0?"+":"")+delta+')'):"")+'</p>'});
}
async function persist(next,announce=true) {
 authority=next;
 const events=next.events??[];
 const saved={...next,events:[]};
 await game.settings.set(NS,KEY,saved);
 authority=saved;
 publish();
 if(announce)for(const e of events)await chat(e.label,e.pressure,e.delta,e.error);
}
function publish(target=null) {
 if(!authority)return;
 for(const u of game.users.filter(u=>u.active&&(!target||u.id===target))){
  const v=u.isGM?{...playerState(authority,true),...playerState(authority,false),mazePos:authority.mazePos}:playerState(authority,role(u.id,authority)==="operator");
  if(u.id===game.user.id){view=v;refresh();}
  else send({kind:"view",to:u.id,from:game.user.id,view:v});
 }
}
async function start(data){
 if(!hasAuthority()||!trialScene())throw Error("Activez une scène d’épreuves et utilisez le MJ actif.");
 const old=getSaved();if(["running","paused"].includes(old?.status))throw Error("Arrêtez d’abord l’épreuve précédente.");
 const op=game.users.get(data.operator);
 if(!op?.active)throw Error("Choisissez un opérateur connecté.");
 const duration=Math.max(60,Math.min(1800,Number(data.duration)||600));
 const interval=Math.max(10,Math.min(120,Number(data.interval)||30));
 const increment=Math.max(1,Math.min(20,Number(data.increment)||5));
 const seq=[...SIMON_COLORS];for(let k=seq.length-1;k>0;k--){const j=Math.floor(Math.random()*(k+1));[seq[k],seq[j]]=[seq[j],seq[k]];}
 while(seq.length<12)seq.push(SIMON_COLORS[Math.floor(Math.random()*SIMON_COLORS.length)]);
 const s=initialState(clock(),{duration,interval,increment,operatorId:op.id,sceneId:canvas.scene.id,sessionId:foundry.utils.randomID(),simonSequence:seq});
 await grantManuals(s);
 await persist(s,false);await chat("Début de l’épreuve",7);
}
async function gmAction(action,value){
 if(!hasAuthority())throw Error("Seul le MJ actif peut piloter cette épreuve.");
 authority=getSaved();
 if(!authority?.sessionId)return;
 let s=structuredClone(authority),now=clock();
 if(action==="adjust")return persist(adjust(s,value,now));
 if(action==="pause"&&s.status==="running"){s=tick(s,now);if(s.status==="running"){s.status="paused";s.pausedAt=now;}return persist(s);}
 if(action==="resume"&&s.status==="paused"){
  const shift=now-s.pausedAt;for(const k of ["deadline","nextTick","simonShow","simonAt","dialDue","purgeReady","purgeStart"])if(s[k]!==null&&typeof s[k]==="number")s[k]+=shift;
  s.status="running";delete s.pausedAt;return persist(s);
 }
 if(action==="stop"&&["running","paused"].includes(s.status)){s.status="stopped";await persist(s,false);return chat("Épreuve arrêtée par le MJ",s.pressure);}
 if(action==="resolve"&&["running","paused"].includes(s.status)){s.solved=Object.fromEntries(MODULES.map(m=>[m,true]));s.status="success";await persist(s,false);return chat("Couplage stabilisé — décision MJ",s.pressure);}
}
function stationModule(id){return id?.startsWith("simon-")?"simon":id;}
function canAct(note,userId,tokenId,s){
 if(!note||note.parent.id!==s.sceneId||!near(note,userId,tokenId))return false;
 const st=noteStation(note);if(!st)return false;
 return game.users.get(userId)?.isGM || (st==="pressure"?role(userId,s)==="expert":role(userId,s)==="operator");
}
async function accept(msg){
 if(!hasAuthority())return;
 authority=getSaved();const s=authority;
 if(!s||s.status!=="running"||msg.sessionId!==s.sessionId)return;
 const note=sceneById(s.sceneId)?.notes.get(msg.noteId);
 if(!canAct(note,msg.userId,msg.tokenId,s))return;
 const id=noteStation(note),module=stationModule(id);
 // A station may only submit its own command, especially individual Simon buttons.
 const value=id.startsWith("simon-")?(id==="simon-show"?"show":id.slice(-1)):msg.value;
 const next=apply(s,{module,value},clock());
 await persist(next);
}
function command(note,value){
 if(!view||view.status!=="running"||view.sceneId!==canvas.scene?.id)return ui.notifications.warn("L’épreuve n’est pas en cours.");
 const tok=selectedNear(note);
 if(!tok)return ui.notifications.warn("Sélectionnez un jeton à proximité (1,5 case pour les pulsations, 2,5 pour les autres mécanismes).");
 const message={kind:"action",userId:game.user.id,tokenId:tok.id,noteId:note.id,sessionId:view.sessionId,value};
 if(hasAuthority())runSerial(()=>accept(message));else send(message);
}
function panelClass(){
 const App=foundry.applications.api.ApplicationV2;
 return class TrialPanel extends App{
  static DEFAULT_OPTIONS={classes:["pf2e-val-cooperative"],window:{title:"Épreuves coopératives",resizable:true},position:{width:470,height:"auto"}};
  constructor(type,note=null){super({id:type==="gm"?"pf2e-val-cooperative-gm":"pf2e-val-cooperative-console",window:{title:type==="gm"?"Épreuves coopératives — MJ":type==="manual"?note.text:"Mécanisme — "+note.text}});this.type=type;this.note=note;}
  async _renderHTML(){const root=document.createElement("div");root.className="val-trial-content";this.root=root;this.updateContent();return root;}
  _replaceHTML(result,content){content.replaceChildren(result);}
  updateContent(){
   if(!this.root)return;
   // Keep the setup form intact while the GM selects duration and operator.
   const active=this.type==="gm"&&["running","paused"].includes(view?.status);
   if(this.type==="gm"&&!active&&this.root.querySelector("[data-start-form]")&&this.lastStatus===view?.status&&this.lastScene===canvas.scene?.id)return;
   this.lastScene=canvas.scene?.id;
   this.lastStatus=view?.status;
   this.root.innerHTML=this.type==="gm"?gmHtml():this.type==="manual"?manualHtml(this.note):consoleHtml(this.note);
   this.root.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{
    const act=button.dataset.action,val=button.dataset.value;
    if(this.type==="gm"){
     if(act==="create")runSerial(()=>createLayout());
     else if(act==="create-map")runSerial(()=>createLayout("illustrated"));
     else if(act==="repair-map")runSerial(()=>repairIllustratedBackground());
     else if(act==="start"){const form=this.root.querySelector("[data-start-form]");runSerial(()=>start(Object.fromEntries(new FormData(form))));}
     else runSerial(()=>gmAction(act,Number(val)));
    }else command(this.note,act==="number"?Number(val):val);
   }));
  }
 }
}
let PanelClass;
const btn=(label,action,value="",disabled=false)=>'<button type="button" data-action="'+esc(action)+'" data-value="'+esc(value)+'" '+(disabled?'disabled':'')+'>'+esc(label)+'</button>';
function timeLabel(s){return s?Math.max(0,Math.ceil((s.deadline-(s.status==="paused"?s.pausedAt??clock():clock()))/1000)):0;}
function gmHtml(){
 const s=view,active=["running","paused"].includes(s?.status);
 const details=s?{conduits:(s.isolated??[]).map((v,i)=>v?i+1:null).filter(Boolean).join(", ")||"aucun isolé",runes:"série "+Math.min(3,(s.runeRound??0)+1)+"/3 · "+(s.runeStep??0)+"/4",simon:s.solved.simon?"12/12":(s.simonLength??4)+" couleurs · "+(s.simonStep??0)+" saisies",maze:"case "+String.fromCharCode(65+(s.mazePos??0)%5)+(1+Math.floor((s.mazePos??0)/5)),dial:["Nord","Est","Sud","Ouest"][s.dialAngle??0]+" · configuration "+((s.dialIndex??0)+1),pressure:(s.purgeStart!==null&&s.purgeStart!==undefined?"maintien en cours":clock()<(s.purgeReady??0)?"recharge":"prêt")}:{};
 let html='<p><b>Scène :</b> '+esc(canvas.scene?.name||"Aucune")+'</p>';
 if(s)html+='<div class="val-trial-dashboard"><div class="val-trial-meter"><b>PRESSION '+s.pressure+' %</b><div class="val-trial-track"><i style="width:'+s.pressure+'%"></i></div></div><div class="val-trial-clock"><span data-time>'+timeLabel(s)+'</span> s</div></div><p><b>'+esc(statusLabels[s.status])+'</b> · Erreurs '+s.errors+'</p><ul class="val-trial-status-list">'+MODULES.map(m=>'<li>'+esc(LABELS[m])+' : '+(s.solved[m]?"stabilisé":"à résoudre")+" — "+esc(details[m])+'</li>').join("")+'</ul>';
 if(active)return html+'<div class="val-trial-buttons">'+btn("−10","adjust","-10",s.status!=="running")+btn("+5","adjust","5",s.status!=="running")+btn(s.status==="paused"?"Reprendre":"Pause",s.status==="paused"?"resume":"pause")+btn("Résoudre (MJ)","resolve")+btn("Arrêter","stop")+'</div>';
 const users=game.users.filter(u=>u.active).sort((a,b)=>Number(a.isGM)-Number(b.isGM));
 return html+'<form data-start-form><label>Opérateur <select name="operator">'+users.map(u=>'<option value="'+esc(u.id)+'" '+(!u.isGM?"":"")+'>'+esc(u.name)+(u.isGM?" (MJ test)":"")+'</option>').join("")+'</select></label><label>Durée (s) <input name="duration" type="number" value="600" min="60" max="1800"></label><label>Intervalle (s) <input name="interval" type="number" value="30" min="10" max="120"></label><label>Hausse par intervalle <input name="increment" type="number" value="5" min="1" max="20"></label></form><div class="val-trial-buttons">'+btn("Démarrer","start","",!trialScene())+btn("Créer une salle","create")+btn("Créer salle illustrée","create-map")+(canvas.scene?.getFlag(NS,"cooperativePreset")==="illustrated"?btn("Réparer le fond","repair-map"):"")+'</div><p class="hint">Créer la salle, placer les PJ, puis démarrer. Un seul opérateur ; les autres joueurs connectés reçoivent les manuels.</p>';
}
function consoleHtml(note){
 const s=view,id=noteStation(note);
 if(!s||s.sceneId!==note.parent.id)return "<p>Attendez le lancement par le MJ.</p>";
 if(s.status!=="running")return "<p>"+esc(statusLabels[s.status])+"</p>";
 const op=game.user.isGM||game.user.id===s.operatorId;
 if((id==="pressure"?op&&!game.user.isGM:!op))return "<p>Ce mécanisme appartient à l’autre équipe.</p>";
 let html='<div class="val-trial-instrument"><div class="val-trial-heading"><span>'+esc(LABELS[stationModule(id)])+'</span><b class="'+(s.solved[stationModule(id)]?"is-solved":"")+'">'+(s.solved[stationModule(id)]?"STABILISÉ":"EN SERVICE")+'</b></div><div class="val-trial-meter"><b>PRESSION '+s.pressure+' %</b><div class="val-trial-track"><i style="width:'+s.pressure+'%"></i></div></div>';
 const close='</div>';
 if(id==="conduits"){
  return html+'<div class="val-trial-conduits">'+COLORS.map((c,k)=>'<div class="val-trial-conduit"><span class="conduit-color" style="--conduit:'+COLOR_CSS[k]+'"></span><b>'+(k+1)+'. '+esc(c.charAt(0).toUpperCase()+c.slice(1))+'</b><span class="conduit-state">'+(s.isolated[k]?"Isolé":"Actif")+'</span>'+btn(s.isolated[k]?"Rétablir":"Isoler","number",k)+'</div>').join("")+'</div>'+close;
 }
 if(id==="runes"){
  const progress=Array.from({length:4},(_,k)=>'<i class="'+(k<s.runeStep||s.solved.runes?"on":"")+'"></i>').join("");
  return html+'<div class="val-trial-readout">SÉRIE '+Math.min(3,s.runeRound+1)+' / 3</div><div class="val-trial-pips">'+progress+'</div>'+(s.solved.runes?'':'<div class="val-trial-grid">'+RUNE_KEYS[s.runeRound].map(r=>btn(r,"value",r)).join("")+'</div>')+close;
 }
 if(id==="maze"){
  const feedback={initial:"En attente d’une direction",move:"Déplacement accepté",wall:"Obstacle — déplacement refusé",reset:"Retour au point de départ",success:"Circuit stabilisé"}[s.solved.maze?"success":s.mazeFeedback??"initial"];
  return html+'<div class="val-trial-direction-status '+(s.mazeFeedback==="wall"?"is-error":s.solved.maze?"is-success":"")+'" role="status"><i></i>'+esc(feedback)+'</div>'+(s.solved.maze?'':'<div class="val-trial-dpad">'+[["↑","U","Nord"],["←","L","Ouest"],["↓","D","Sud"],["→","R","Est"]].map(([arrow,v,label])=>'<button type="button" data-action="value" data-value="'+v+'" aria-label="'+label+'"><span>'+arrow+'</span><small>'+label+'</small></button>').join("")+'<div class="val-trial-dpad-center" aria-hidden="true"><i></i></div></div><div class="val-trial-reset">'+btn("↺ Réinitialiser en position initiale","value","reset")+'</div><p class="val-trial-direction-hint">Suivez les directions données par les experts.</p>')+close;
 }
 if(id==="dial"){
  return html+'<div class="val-trial-lights">'+Array.from({length:12},(_,k)=>'<span class="'+(DIALS[s.dialIndex].lights.includes(k)?"on":"")+'">'+(k+1)+'</span>').join("")+'</div><svg class="val-trial-dial" viewBox="0 0 220 190" aria-hidden="true"><defs><radialGradient id="val-knob"><stop stop-color="#9c9074"/><stop offset="1" stop-color="#332d27"/></radialGradient></defs><circle cx="110" cy="95" r="65" fill="#11191d" stroke="#a98c56" stroke-width="3"/><circle cx="110" cy="95" r="50" fill="url(#val-knob)" stroke="#c8ad74" stroke-width="2"/><path d="M102 102V59L110 49 118 59V102Z" fill="#f4d27d" transform="rotate('+(90*s.dialAngle)+' 110 95)"/><circle cx="110" cy="95" r="8" fill="#302a25" stroke="#d1b16c"/><g fill="#e9d8ae" text-anchor="middle" font-size="14" font-weight="bold"><text x="110" y="20">N</text><text x="193" y="100">E</text><text x="110" y="181">S</text><text x="27" y="100">O</text></g></svg><div class="val-trial-readout">'+["NORD","EST","SUD","OUEST"][s.dialAngle]+'</div><div class="val-trial-buttons">'+btn("↻ Tourner","value","turn")+btn("✓ Valider","value","check")+'</div>'+close;
 }
 if(id==="pressure"){
  const t=clock(),ready=t>=s.purgeReady;
  return html+'<svg class="val-trial-gauge" viewBox="0 0 220 115"><path d="M25 95 A85 85 0 0 1 195 95" fill="none" stroke="#3a4446" stroke-width="17"/><path d="M25 95 A85 85 0 0 1 195 95" fill="none" stroke="'+(s.pressure>=75?"#db6551":"#9bc879")+'" stroke-width="11" pathLength="100" stroke-dasharray="'+s.pressure+' 100"/><path d="M110 95L110 27" transform="rotate('+(-90+1.8*s.pressure)+' 110 95)" stroke="#ead0a0" stroke-width="4"/><circle cx="110" cy="95" r="8" fill="#d6af70"/><text x="110" y="80" text-anchor="middle" fill="#f8ebcf" font-size="20">'+s.pressure+'%</text></svg><p class="val-trial-readout" data-purge-status>'+(!ready?"Recharge en cours":s.purgeStart!==null?"Maintien en cours — relâcher après 3 s":"Prêt à purger")+'</p><div class="val-trial-purge">'+btn("PURGE","value","begin",!ready||s.purgeStart!==null)+btn("Relâcher","value","release",s.purgeStart===null)+'</div><p>Maintenez 3 à 10 secondes ; recharge 60 s.</p>'+close;
 }
 return html+close;
}
function manualHtml(note){
 if(!canReadManual(note))return "<p>Approchez le personnage du repère.</p>";
 const key=noteManual(note),manual=MANUALS[key];
 return '<div class="val-trial-manual"><div class="val-trial-manual-heading"><img src="'+BASE+'manual-'+key+'.svg" alt=""><strong>'+esc(manual.name)+'</strong></div>'+manual.text+'</div>';
}
function checkManual(){
 if(consolePanel?.type==="manual"&&consolePanel.rendered&&!canReadManual(consolePanel.note)){
  const app=consolePanel;consolePanel=null;void app.close();
 }
}
function refresh(){
 panel?.updateContent();checkManual();consolePanel?.updateContent();
}
function openGM(){
 if(!game.user.isGM)return;
 if(!PanelClass)PanelClass=panelClass();
 panel??=new PanelClass("gm");if(!panel.rendered)panel.render({force:true});else panel.updateContent();
 if(hasAuthority()){authority=getSaved();if(authority?.sessionId)publish(game.user.id);}
}
function openConsole(note,type="console"){
 if(!PanelClass)PanelClass=panelClass();
 if(consolePanel?.rendered)void consolePanel.close();
 consolePanel=new PanelClass(type,note);consolePanel.render({force:true});
}
function renderSimon(){
 if(!trialScene()||!view||view.sceneId!==canvas.scene?.id)return;
 const op=game.user.isGM||game.user.id===view.operatorId;
 const visual=op?simonVisual(view,clock()):{lit:[]};
 for(const n of canvas.notes?.placeables??[]){
  const id=noteStation(n.document);
  if(!/^simon-[RBJV]$/.test(id??""))continue;
  const col=id.slice(-1),icon=n.controlIcon,sprite=icon?.icon,lit=visual.lit.includes(col);
  if(sprite){sprite.tint=lit?0xffffff:0x454545;sprite.alpha=1;}
  if(icon?.border){icon.border.tint=lit?COLORS_HEX[col]:0x545454;icon.border.visible=true;}
  if(icon?.bg){icon.bg.tint=lit?COLORS_HEX[col]:0x000000;icon.bg.alpha=lit?0.8:0.4;}
 }

}
function noteClick(note){
 const doc=note.document,st=noteStation(doc),manual=noteManual(doc);
 if(!st&&!manual)return;
 if(!selectedNear(doc)){ui.notifications.warn("Approchez et sélectionnez votre personnage.");return false;}
 if(manual){
  if(!canReadManual(doc)){ui.notifications.warn("Manuel réservé aux experts : approchez et sélectionnez votre personnage (1,5 case).");return false;}
  openConsole(doc,"manual");return false;
 }
 if(!view||view.sceneId!==doc.parent.id){ui.notifications.warn("Attendez le lancement de l’épreuve.");return false;}
 if(!game.user.isGM&&!canAct(doc,game.user.id,selectedNear(doc)?.id,view)){ui.notifications.warn("Ce mécanisme n’est pas accessible à votre rôle.");return false;}
 if(st.startsWith("simon-"))command(doc,"");else openConsole(doc);
 return false;
}
export function registerCooperativeTrials(){
 game.settings.register(NS,KEY,{scope:"world",config:false,restricted:true,type:Object,default:{}});
 Hooks.on("getSceneControlButtons",controls=>{
  if(!game.user.isGM||!controls.tokens?.tools)return;
  controls.tokens.tools.pf2eValCooperative={name:"pf2eValCooperative",title:"Épreuves coopératives",icon:"fa-solid fa-puzzle-piece",button:true,visible:true,order:Object.keys(controls.tokens.tools).length,onChange:openGM};
 });
}
export function initCooperativeTrials(){
 Hooks.on("activateNote",noteClick);
 game.socket.on(CHANNEL,msg=>{
  if(msg?.kind==="view"&&msg.to===game.user.id&&msg.from===game.users.activeGM?.id){view=msg.view;refresh();}
  if(msg?.kind==="request"&&hasAuthority()&&game.users.get(msg.userId)?.active){authority=getSaved();if(authority?.sessionId)publish(msg.userId);}
  if(msg?.kind==="action"&&hasAuthority())runSerial(()=>accept(msg));
 });
 Hooks.on("canvasReady",()=>{if(hasAuthority()){authority=getSaved();if(authority?.sessionId)publish();}else send({kind:"request",userId:game.user.id});if(panel?.rendered)panel.updateContent();});
 Hooks.on("updateUser",()=>{if(hasAuthority()&&authority?.sessionId)publish();});
 Hooks.on("controlToken",checkManual);
 Hooks.on("updateToken",checkManual);
 game.pf2eValToolkit??={};game.pf2eValToolkit.cooperativeTrials={open:openGM,createLayout};
 if(hasAuthority()){authority=getSaved();if(authority?.sessionId)publish();}else send({kind:"request",userId:game.user.id});
 setInterval(()=>{
  renderSimon();checkManual();
  if(panel?.rendered){const node=panel.root?.querySelector("[data-time]");if(node)node.textContent=timeLabel(view);}
  if(consolePanel?.rendered&&noteStation(consolePanel.note)==="pressure"&&view?.status==="running"){
   const now=clock(),ready=now>=view.purgeReady,started=view.purgeStart!==null;
   const b=consolePanel.root?.querySelector('[data-value="begin"]');if(b)b.disabled=!ready||started;
   const c=consolePanel.root?.querySelector('[data-value="release"]');if(c)c.disabled=!started;
   const p=consolePanel.root?.querySelector("[data-purge-status]");if(p)p.textContent=started?"Maintien : "+Math.floor((now-view.purgeStart)/1000)+" s":ready?"Prêt à purger":"Recharge : "+Math.ceil((view.purgeReady-now)/1000)+" s";
  }
  if(!hasAuthority()||busy)return;
  const s=getSaved(),now=clock();
  if(s?.status!=="running"||now<Math.min(s.nextTick,s.deadline,s.dialDue,simonDue(s),s.purgeStart===null?Infinity:s.purgeStart+10001))return;
  busy=true;runSerial(async()=>{const old=getSaved();if(old?.status==="running"){const n=tick(old,clock());if(n.purgeStart!==null&&clock()-n.purgeStart>10000)n.purgeStart=null;await persist(n);}}).finally(()=>busy=false);
 },125);
}
