/**
 * One-page private session-end form. The URL holds a 192-bit short-lived bearer
 * token generated only after Discord verifies the admin invoking /fin-seance.
 * All user-supplied strings are inserted using textContent/value, never HTML.
 */
export function discordFinishHtml(nonce: string): string {
  const html = String.raw`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fin de séance · Outil MJ</title>
<style>
:root{font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;color-scheme:light dark}
*{box-sizing:border-box}body{margin:0;background:#f5f4f0;color:#242321;line-height:1.45}
main{max-width:920px;margin:auto;padding:24px 18px 70px}
h1{font-size:1.8rem;margin:0 0 8px}h2{font-size:1.14rem;margin:0 0 12px}
p{margin:0 0 14px}.muted{color:#636058;font-size:.91rem}
section{padding:20px 22px;margin:15px 0;background:white;border:1px solid #dedbd3;border-radius:12px}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}
label{display:grid;gap:5px;font-weight:600;font-size:.93rem}
input,textarea{display:block;width:100%;font:inherit;background:#fff;color:#242321;border:1px solid #aaa69e;border-radius:7px;padding:10px 11px}
input:focus,textarea:focus{outline:2px solid #3b65b4;outline-offset:1px}
textarea{resize:vertical;min-height:126px}#actions,#loot{min-height:156px}
.faction-group{border-top:1px solid #e7e4df;padding:14px 0 4px}
.faction-group h3{font-size:1rem;margin:0 0 10px}
.faction-entry{display:grid;grid-template-columns:minmax(0,1fr) 82px;gap:14px;align-items:center;margin-bottom:7px}
.faction-entry label{font-weight:400;font-size:.94rem}.faction-entry input{text-align:center}
.spaced{margin-top:14px}.actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
button{font:inherit;font-weight:650;border:1px solid #817c72;border-radius:8px;padding:11px 17px;background:#fff;color:#242321;cursor:pointer}
button.primary{background:#254c91;color:white;border-color:#254c91}button.danger{background:#a92a2a;color:white;border-color:#a92a2a}
button:disabled{cursor:wait;opacity:.6}.hidden{display:none!important}
#error{padding:12px 15px;background:#fff1ef;color:#9d2222;border:1px solid #cf9d99;border-radius:8px;white-space:pre-wrap}
#success{padding:18px 20px;background:#e9f4eb;color:#20572f;border-radius:10px}
#preview-text{font:inherit;font-size:.95rem;white-space:pre-wrap;overflow-wrap:anywhere;background:#f7f7f6;padding:15px;border-radius:8px;border:1px solid #ddd}
.pill{display:inline-block;font-size:.76rem;padding:3px 9px;border-radius:20px;background:#eee5d5;margin-bottom:12px}
@media(max-width:640px){.grid,.grid.three{grid-template-columns:1fr}section{padding:15px}main{padding:17px 10px}.faction-entry{grid-template-columns:minmax(0,1fr) 72px}}
@media(prefers-color-scheme:dark){body{background:#17191c;color:#edece8}section{background:#24272a;border-color:#42474b}
input,textarea{background:#202224;color:#f1eeea;border-color:#757b80}
.muted{color:#aca9a3}.faction-group{border-color:#444}
button{background:#292e33;color:#eee;border-color:#74797f}
#preview-text{background:#202224;border-color:#555}
#error{background:#3e2323;color:#ffd3cf}#success{background:#1d3724;color:#ccf6d9}
.pill{background:#413b31}}
</style></head><body><main>
<div class="pill" id="status-pill">Outil MJ privé</div>
<h1>Fin de séance</h1>
<p class="muted" id="intro">Lien privé issu de Discord. Valable 30 minutes. Aucune récompense n'est appliquée avant confirmation.</p>
<div id="error" class="hidden" role="alert"></div>
<div id="loading">Chargement de la séance et de toutes les réputations…</div>
<form id="form" class="hidden">
<section><h2>Séance</h2><div class="grid">
<label>Numéro de séance<input name="number" id="number" type="number" min="1" step="1" required></label>
<label>Nombre de jours écoulés<input name="days" id="days" type="number" min="0" step="1" required></label>
</div></section>
<section><h2>Expérience</h2><div class="grid">
<label>XP total du groupe<input name="xpTotal" id="xpTotal" type="number" min="0" step="1" required></label>
<label>XP par PJ<input name="xpPerPlayer" id="xpPerPlayer" type="number" min="0" step="1" required></label>
</div><label class="spaced">Actions réalisées (une ligne par action)
<textarea id="actions" maxlength="12000" placeholder="Gnome libéré : 30XP&#10;Chef vaincu : 2000 XP"></textarea></label>
<p class="muted">Chaque ligne sera publiée comme une puce. Pas besoin d'écrire « Actions : ».</p></section>
<section><h2>Pièces et butin</h2>
<div class="grid three">
<label>Or · po par PJ<input name="gp" id="gp" type="number" min="0" step="1" required></label>
<label>Argent · pa par PJ<input name="sp" id="sp" type="number" min="0" step="1" required></label>
<label>Cuivre · pc par PJ<input name="cp" id="cp" type="number" min="0" step="1" required></label>
</div>
<label class="spaced">Objets obtenus (une ligne par objet)
<textarea id="loot" maxlength="12000" placeholder="Potion de soins&#10;Anneau magique"></textarea></label>
<p class="muted">Seuls les montants numériques des pièces seront crédités automatiquement aux PJ ; les objets restent du texte.</p></section>
<section><h2>Réputations</h2><p class="muted">Toutes les catégories, y compris Abberton et les cirques. Chaque variation est initialisée à zéro. Entre -50 et +50 par modification, selon le score actuel.</p>
<p id="reputation-count" class="muted"></p><div id="factions"></div>
</section>
<div class="actions"><button type="submit" class="primary" id="preview">Voir l'aperçu</button></div>
</form>
<section id="review" class="hidden"><h2>Aperçu privé</h2><p class="muted">Le message ci-dessous sera publié dans le salon Discord de la séance.</p>
<div id="preview-text"></div><div class="actions">
<button type="button" class="primary" id="confirm">Confirmer et publier</button>
<button type="button" id="edit">Modifier</button></div></section>
<div id="success" class="hidden" role="status"></div>
</main>
<script>
(function(){
'use strict';
const root = location.pathname.replace(/\/$/,'');
const error = document.getElementById('error');
const form = document.getElementById('form');
const review = document.getElementById('review');
const fields = ['number','days','xpTotal','xpPerPlayer','gp','sp','cp','actions','loot'];
let session = null, busy = false, finished = false;
function showError(message) { error.textContent=String(message); error.classList.remove('hidden'); }
function clearError() { error.textContent=''; error.classList.add('hidden'); }
function field(id){return document.getElementById(id);}
async function api(action,data) {
 const response = await fetch(root + '/' + action,{method:data ? 'POST':'GET',
  headers: data ? {'Content-Type':'application/json'} : {},
  body: data ? JSON.stringify(data) : undefined, cache:'no-store',credentials:'omit'});
 const result = await response.json().catch(()=>({}));
 if(!response.ok) throw new Error(result.message || result.error || 'Erreur HTTP '+response.status);
 return result;
}
function setBusy(value) {
 busy=value;
 for(const element of document.querySelectorAll('button')) element.disabled=value;
}
function renderGroups(groups,values) {
 const container=field('factions');
 container.replaceChildren();
 let count=0;
 for(const group of groups) {
  const section=document.createElement('div');section.className='faction-group';
  const heading=document.createElement('h3');heading.textContent=group.name;section.appendChild(heading);
  for(const reputation of group.entries) {
   count++;
   const row=document.createElement('div');row.className='faction-entry';
   const label=document.createElement('label');
   const input=document.createElement('input');
   const key='faction-'+reputation.id;
   input.type='number';input.id=key;input.min='-50';input.max='50';input.step='1';input.required=true;
   input.dataset.reputationId=String(reputation.id);
   input.value=String(values && values[reputation.id] !== undefined ? values[reputation.id] : 0);
   label.htmlFor=key;label.textContent=reputation.name;
   const meta=document.createElement('span');meta.className='muted';meta.textContent='Actuel : '+reputation.score;
   const title=document.createElement('div');title.append(label,meta);
   row.append(title,input);section.appendChild(row);
  }
  container.appendChild(section);
 }
 field('reputation-count').textContent=groups.length+' catégories · '+count+' réputations';
}
function readValues() {
 const payload={};
 for(const name of fields) payload[name]=['actions','loot'].includes(name)?field(name).value: Number(field(name).value);
 payload.reputations=Array.from(document.querySelectorAll('[data-reputation-id]'))
   .map(input=>({id:Number(input.dataset.reputationId),delta:Number(input.value)}));
 return payload;
}
async function load(){
 try{
  session=await api('state');
  field('number').value=session.number;field('days').value=session.days;
  field('xpTotal').value=session.xpTotal;field('xpPerPlayer').value=session.xpPerPlayer;
  field('gp').value=session.gp;field('sp').value=session.sp;field('cp').value=session.cp;
  field('actions').value=session.actions;field('loot').value=session.loot;
  const previous=Object.fromEntries((session.changes||[]).map(change=>[change.id,change.delta]));
  renderGroups(session.groups,previous);
  field('loading').classList.add('hidden');form.classList.remove('hidden');
  if(session.mock){field('status-pill').textContent='SIMULATION · canal #mj';field('intro').textContent='Séance fictive n°7 : publication d’un aperçu dans #mj, sans modifier SQLite, Foundry ni les réputations.';}
  if(session.step==='review'){field('preview-text').textContent=(session.parts||[]).join('\n\n');review.classList.remove('hidden');form.classList.add('hidden');}
 }catch(err){field('loading').classList.add('hidden');showError(err.message);}
}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy || finished) return;
 clearError();setBusy(true);
 try{
  const result=await api('preview',readValues());
  field('preview-text').textContent=result.parts.join('\n\n');
  form.classList.add('hidden');review.classList.remove('hidden');
  if(review.scrollIntoView)review.scrollIntoView({behavior:'smooth'});
 }catch(err){showError(err.message);}finally{setBusy(false);}
});
field('edit').addEventListener('click',()=>{if(finished)return;clearError();review.classList.add('hidden');form.classList.remove('hidden');if(form.scrollIntoView)form.scrollIntoView();});
field('confirm').addEventListener('click',async()=>{
 if(busy || finished)return;
 clearError();setBusy(true);
 try{
  const result=await api('confirm',{confirm:true});
  finished=true;
  review.classList.add('hidden');form.classList.add('hidden');
  const success=field('success');success.textContent=result.message;success.classList.remove('hidden');
 }catch(err){showError('Confirmation non terminée : '+err.message+' Vérifie Discord et les inventaires avant de réessayer.');}
 finally{setBusy(false);}
});
load();
})();
</script></body></html>`;
  return html.replace('<style>', '<style nonce="'+nonce+'">').replace('<script>', '<script nonce="'+nonce+'">')
}
