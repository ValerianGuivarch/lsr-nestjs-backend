/** PF2e familiar abilities: daily picker driven by the master's derived statistics. */
const PACK = 'pf2e.familiar-abilities';
const NAMESPACE = 'pf2e-val-toolkit';
const LOCKED_WITCH = { 'spinner-of-threads': 'Familier de la chance équilibrée' };
const requires = {
  'item-delivery': ['manual-dexterity'],
  'elemental': ['resistance'],
};
const spellRanks = { 'spell-battery': 4, 'spellcasting': 6 };

function familiarMaster(familiar) {
  const id = familiar.system?.master?.id;
  return id ? game.actors.get(id) : null;
}
function witchLocked(master) {
  if (!master.items.some(i => i.system?.slug === 'familiar-witch')) return [];
  return master.items.filter(i => LOCKED_WITCH[i.system?.slug]).map(i => LOCKED_WITCH[i.system.slug]);
}
function isFamiliarAbility(item) { return item.type === 'action' && item.system?.category === 'familiar'; }
function abilityId(item) { return item.system?.slug || item.name; }
function reasons(item, master, selected, rank) {
  const slug = item.system?.slug;
  const errors = [];
  for (const dep of requires[slug] || []) if (!selected.has(dep)) errors.push(`Nécessite ${dep}`);
  if (spellRanks[slug] && rank < spellRanks[slug]) errors.push(`Nécessite des sorts de rang ${spellRanks[slug]}`);
  if (slug === 'familiar-focus' && !(master.system?.resources?.focus?.max > 0)) errors.push('Nécessite une réserve de focalisation');
  if (['extra-reagents','extra-alchemy'].includes(slug) && !master.items.some(i => /infused-reagents|advanced-alchemy/.test(i.system?.slug || ''))) errors.push('Nécessite une capacité alchimique');
  if (slug === 'extra-vial' && !master.items.some(i => /versatile-vials/.test(i.system?.slug || ''))) errors.push('Nécessite les fioles polyvalentes');
  if (slug === 'cantrip-connection' && !master.items.some(i => i.type === 'spell' && i.system?.traits?.value?.includes('cantrip'))) errors.push('Nécessite des tours de magie');
  return errors;
}
function highestRank(master) {
  const entries = master.items.filter(i => i.type === 'spellcastingEntry' && ['prepared','spontaneous'].includes(i.system?.prepared?.value));
  return Math.max(0,...entries.flatMap(i=>Object.entries(i.system?.slots || {}).filter(([k,v])=>/^slot\d+$/.test(k) && Number(v.max)>0).map(([k])=>Number(k.slice(4)))));
}
function escapeHTML(text) { return foundry.utils.escapeHTML(String(text ?? '')); }

export async function openFamiliarSelector(familiar) {
  if (!familiar || familiar.type !== 'familiar') return;
  const master = familiarMaster(familiar);
  if (!master) return ui.notifications.warn('Familier : maître introuvable.');
  const pack = game.packs.get(PACK);
  if (!pack) return ui.notifications.error(`Compendium introuvable : ${PACK}`);
  const docs = (await pack.getDocuments()).filter(isFamiliarAbility).sort((a,b)=>a.name.localeCompare(b.name,'fr'));
  const current = familiar.items.filter(isFamiliarAbility);
  const fixed = witchLocked(master);
  const maximum = Number(master.system?.attributes?.familiarAbilities?.value ?? 2);
  const free = Math.max(0, maximum - fixed.length);
  const selected = new Set(current.map(abilityId));
  const rank = highestRank(master);
  const unknown = current.filter(i=>!docs.some(d=>abilityId(d)===abilityId(i)));
  for (const item of unknown) selected.add(abilityId(item));
  const details = `<p><b>${escapeHTML(familiar.name)}</b> — ${escapeHTML(master.name)} · ${maximum} capacités, dont ${fixed.length} imposée(s). <b>${free} choix libres</b>.</p>
  ${fixed.map(name=>`<p>🔒 ${escapeHTML(name)} (capacité du patron, appliquée par la fiche du maître)</p>`).join('')}
  <p class="hint">L'apparence du familier n'impose aucune capacité dans ce sélecteur. Les restrictions textuelles non codées restent soumises au MJ.</p>
  <div class="val-familiar-counter" aria-live="polite"></div>
  <div class="val-familiar-list" style="max-height:48vh;overflow:auto;display:grid;gap:4px">${docs.map(doc=>{
    const id=abilityId(doc); const checked=selected.has(id);
    return `<label style="display:flex;align-items:start;gap:8px;padding:4px;border-bottom:1px solid var(--color-border-light-tertiary)"><input type="checkbox" data-ability="${escapeHTML(id)}" ${checked?'checked':''}/><span><b>${escapeHTML(doc.name)}</b> <small class="val-familiar-reason"></small></span></label>`;
  }).join('')}</div>${unknown.length?`<p class="hint">${unknown.length} capacité(s) personnalisée(s) hors compendium conservée(s) : ${unknown.map(i=>escapeHTML(i.name)).join(', ')}</p>`:''}`;
  const dlg = new foundry.applications.api.DialogV2({
    window:{title:`Préparatifs du familier — ${familiar.name}`},
    content:details,
    buttons:[
      {action:'cancel',label:'Annuler'},
      {action:'save',label:'Enregistrer',default:true,callback:async(_event,_button,dialog)=>{
        const root=dialog.element;
        const chosen=new Set([...root.querySelectorAll('[data-ability]:checked')].map(e=>e.dataset.ability));
        const all=new Set([...chosen,...unknown.map(abilityId)]);
        if(all.size>free){ui.notifications.error(`Maximum ${free} capacités libres (dont ${unknown.length} personnalisées).`);return false;}
        for(const d of docs.filter(d=>chosen.has(abilityId(d)))){
          const failed=reasons(d,master,all,rank);
          if(failed.length){ui.notifications.error(`${d.name} : ${failed.join(', ')}`);return false;}
        }
        if(!familiar.isOwner){ui.notifications.error('Modification du familier non autorisée.');return false;}
        const removable=current.filter(i=>!all.has(abilityId(i)));
        const add=docs.filter(d=>chosen.has(abilityId(d))&&!current.some(i=>abilityId(i)===abilityId(d)));
        if(add.length) await familiar.createEmbeddedDocuments('Item',add.map(i=>i.toObject()));
        if(removable.length) await familiar.deleteEmbeddedDocuments('Item',removable.map(i=>i.id));
        ui.notifications.info(`Capacités de ${familiar.name} enregistrées.`);
        return true;
      }}
    ]
  });
  const hook = Hooks.on('renderDialogV2', app=>{
    if(app!==dlg)return;
    Hooks.off('renderDialogV2',hook);
    const root=app.element;
    const update=()=>{
      const checked=new Set([...root.querySelectorAll('[data-ability]:checked')].map(el=>el.dataset.ability));
      const all=new Set([...checked,...unknown.map(abilityId)]);
      const counter=root.querySelector('.val-familiar-counter');
      counter.textContent=`${all.size}/${free} choix libres`;
      counter.style.color=all.size>free?'var(--color-text-danger)':'';
      for(const el of root.querySelectorAll('[data-ability]')){
        const doc=docs.find(d=>abilityId(d)===el.dataset.ability);
        const errors=reasons(doc,master,all,rank);
        const desc=el.closest('label').querySelector('.val-familiar-reason');
        desc.textContent=errors.length?` — Indisponible : ${errors.join(', ')}`:'';
        el.disabled=!el.checked&&(!!errors.length||all.size>=free);
      }
    };
    root.addEventListener('change',update);update();
  });
  dlg.render(true);
}

export function initFamiliarSelector(){
  const add=(app, element)=>{
    const actor=app.actor || app.document;
    if(actor?.type!=='familiar')return;
    const root=element instanceof HTMLElement?element:element?.[0];
    const header=root?.querySelector('.window-header');
    if(!header||header.querySelector('.val-familiar-open'))return;
    const btn=document.createElement('button');
    btn.type='button';btn.className='val-familiar-open';btn.title='Choisir les capacités quotidiennes';
    btn.innerHTML='<i class="fa-solid fa-paw"></i> Capacités';
    btn.addEventListener('click',()=>openFamiliarSelector(actor));header.append(btn);
  };
  Hooks.on('renderActorSheetV2',add);
  Hooks.on('renderActorSheet',add);
  game.pf2eValToolkit ??= {};
  game.pf2eValToolkit.openFamiliarSelector=openFamiliarSelector;
}
