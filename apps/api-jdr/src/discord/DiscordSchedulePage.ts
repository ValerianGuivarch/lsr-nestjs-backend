export function discordScheduleHtml(nonce:string):string {
return String.raw`<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Planification · Outil MJ</title>
<style nonce="__NONCE__">
:root{font-family:system-ui,sans-serif;color-scheme:light dark;line-height:1.5}body{margin:0;background:#f5f4f0;color:#242321}main{max-width:1080px;margin:auto;padding:24px 14px 60px}h1{margin:0}h2{font-size:1.15rem;margin:0 0 12px}p{margin:6px 0 12px}section{background:white;border:1px solid #dcd9d0;padding:18px;margin:14px 0;border-radius:12px}button,select{font:inherit;border:1px solid #999;border-radius:7px;padding:9px 12px;background:white;color:inherit}button{cursor:pointer;font-weight:600}button.primary{background:#254c91;color:white;border-color:#254c91}button:disabled{opacity:.5;cursor:default}.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:10px 0}.muted{color:#67635b;font-size:.9rem}.table-scroll{overflow:auto}table{border-collapse:collapse;width:100%;font-size:.9rem}td,th{padding:8px;border-bottom:1px solid #ddd;text-align:center;white-space:nowrap}td:first-child,th:first-child{text-align:left}.yes{color:#16784b;font-weight:bold}.no{color:#a33434}.dates{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.dates label{display:grid;gap:5px}.proposal{border:1px solid #d2cfc7;border-radius:8px;padding:12px;margin:8px 0}.proposal strong{display:block}.proposal.selected{border:2px solid #254c91}#error{color:#ad2929;white-space:pre-wrap}#result{white-space:pre-wrap}.hidden{display:none!important}#review{border-color:#254c91}.grow{flex:1}.pill{display:inline-block;padding:3px 9px;border:1px solid #bbb;border-radius:20px;font-size:.8rem}@media(prefers-color-scheme:dark){body{background:#18191b;color:#eee}section,button,select{background:#24272a;border-color:#555}.muted{color:#bbb}td,th,.proposal{border-color:#555}.yes{color:#80d4a0}.no,#error{color:#ff9990}}@media(max-width:600px){section{padding:12px}main{padding:12px 8px}}
</style></head><body><main>
<span class="pill">Outil MJ privé · lien temporaire</span><h1>Planification des séances</h1>
<p class="muted">Calcule les groupes à partir du sondage Discord. Aucun message avant publication.</p>
<p id="error" role="alert"></p><div id="loading">Chargement…</div>
<div id="app" class="hidden">
<section><h2>1. Disponibilités</h2><div class="table-scroll" id="votes"></div><p class="muted">✓ Disponible · ? incertain · × indisponible · — pas de vote positif pour cette date. Le nombre de séances jouées sert à la priorité.</p></section>
<section><h2>2. Nombre de séances et dates</h2><div class="row"><label for="count">Séances à organiser</label><select id="count"></select><span id="max" class="muted"></span></div><div id="dates" class="dates"></div><p class="muted">Retenir = date obligatoire. Exclure = ne pas jouer ce jour. Libre = aucune préférence. Chaque joueur peut participer à une seule séance de la répartition.</p></section>
<section><h2>3. Propositions</h2><div class="row"><label><input type="checkbox" id="all" checked> Toutes les répartitions compatibles</label><button id="random">Tirer au sort parmi les meilleures</button></div><p id="stats" aria-live="polite"></p><div id="proposals"></div><div class="row"><button id="prev">Précédentes</button><span id="page" class="muted"></span><button id="next">Suivantes</button></div><p class="muted">Les propositions sont classées par nombre total de séances déjà jouées, du plus faible au plus élevé. Le tirage est uniforme entre toutes les propositions de meilleure priorité.</p></section>
<section id="review" class="hidden"><h2>4. Récapitulatif avant publication</h2><div id="selection"></div><p id="omitted"></p><p class="muted">Le bot crée les fils de mission puis publie les groupes dans le fil de planification et mentionne uniquement les joueurs disponibles non retenus.</p><button class="primary" id="publish">Publier les groupes</button></section>
</div><section id="result" class="hidden" role="status"></section></main>
<script nonce="__NONCE__">
(function(){
'use strict';
const root=location.pathname.replace(/\/$/,'');
const el=id=>document.getElementById(id);
let state,offset=0,last=null,generation=0,choice=null,busy=false;
const show=(id,on)=>el(id).classList.toggle('hidden',!on);
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
function error(e){el('error').textContent=e instanceof Error?e.message:String(e)}
async function api(path,body){
 const r=await fetch(root+'/'+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',credentials:'same-origin'});
 const d=await r.json();if(!r.ok)throw new Error(Array.isArray(d.message)?d.message.join(' '):d.message||'Erreur '+r.status);return d;
}
function filters(){return {count:Number(el('count').value),required:state.dates.filter(d=>el('date-'+d.key).value==='yes').map(d=>d.key),excluded:state.dates.filter(d=>el('date-'+d.key).value==='no').map(d=>d.key),all:el('all').checked}}
function clear(){choice=null;show('review',false)}
function build(){
 const t=node('table'),head=node('tr');['Joueur','Séances',...state.dates.map(d=>d.label)].forEach(x=>head.append(node('th',x)));t.append(head);
 for(const p of state.players){
  const tr=node('tr');tr.append(node('td',p.name),node('td',String(p.played)));
  for(const d of state.dates){const yes=state.availability[d.key].includes(p.id);const cell=node('td',yes?'✓':state.unavailable.includes(p.id)?'×':state.uncertain.includes(p.id)?'?':'—');cell.className=yes?'yes':state.unavailable.includes(p.id)?'no':'';tr.append(cell)}t.append(tr)
 }el('votes').replaceChildren(t);
 el('max').textContent=state.max+' maximum';
 for(let i=1;i<=state.max;i++){const o=node('option',String(i));o.value=String(i);el('count').append(o)}
 el('count').value=String(state.max);
 for(const d of state.dates){const label=node('label',d.label),select=node('select');select.id='date-'+d.key;for(const [v,s] of [['free','Libre'],['yes','Retenir'],['no','Exclure']]){const o=node('option',s);o.value=v;select.append(o)}select.addEventListener('change',reset);label.append(select);el('dates').append(label)}
 el('count').addEventListener('change',reset);el('all').addEventListener('change',reset);
 show('loading',false);show('app',true);
 if(state.max)reset();else{el('stats').textContent='Aucun groupe de quatre disponible.';for(const id of ['count','all','random','prev','next'])el(id).disabled=true}
}
function groupText(g){return g.label+' : '+g.players.map(p=>p.name+' ('+p.played+')').join(', ')}
function render(data){
 last=data;el('stats').textContent=data.total+' possibilités compatibles · '+data.optimal+' optimales'+(data.bestScore===null?'':' · meilleur score '+data.bestScore);
 el('proposals').replaceChildren();
 for(const p of data.entries){const box=node('div');box.className='proposal'+(choice?.index===p.index?' selected':'');box.append(node('strong','Proposition '+(p.index+1)+' · score '+p.score+(p.score===data.bestScore?' · optimale':'')));for(const g of p.groups)box.append(node('div',groupText(g)));const button=node('button','Choisir cette proposition');button.addEventListener('click',()=>choose({index:p.index}));box.append(button);el('proposals').append(box)}
 el('page').textContent=data.visible?((offset+1)+'–'+Math.min(offset+20,data.visible)+' / '+data.visible):'0 résultat';el('prev').disabled=offset===0;el('next').disabled=offset+20>=data.visible;el('random').disabled=!data.optimal;
}
async function load(){const g=++generation;el('error').textContent='';el('proposals').replaceChildren(node('p','Calcul des répartitions…'));for(const id of ['random','prev','next'])el(id).disabled=true;try{const data=await api('options',{...filters(),offset});if(g===generation)render(data)}catch(e){if(g===generation)error(e)}}
function reset(){clear();offset=0;load()}
async function choose(params){const g=++generation;clear();el('error').textContent='';try{const data=await api('choose',{...filters(),...params});if(g!==generation)return;choice=data;el('selection').replaceChildren(node('strong','Proposition '+(data.index+1)+' · score '+data.score),...data.groups.map(x=>node('p',groupText(x))));el('omitted').textContent='Non sélectionnés : '+(data.omitted.map(p=>p.name).join(', ')||'Aucun');show('review',true);el('review').scrollIntoView({block:'nearest'});if(last)render(last)}catch(e){if(g===generation)error(e)}}
el('prev').addEventListener('click',()=>{offset=Math.max(0,offset-20);load()});el('next').addEventListener('click',()=>{offset+=20;load()});el('random').addEventListener('click',()=>choose({random:true}));
el('publish').addEventListener('click',async()=>{if(!choice||busy)return;busy=true;el('publish').disabled=true;el('error').textContent='';try{const result=await api('confirm',{confirm:true,index:choice.index,...filters()});show('app',false);el('result').textContent=result.message;show('result',true)}catch(e){error(e);el('publish').disabled=false}finally{busy=false}});
api('state').then(data=>{state=data;build()}).catch(e=>{show('loading',false);error(e)});
})();
</script></body></html>`.split('__NONCE__').join(nonce)
}
