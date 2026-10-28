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
  const favorites = new Set(familiar.getFlag(NAMESPACE, 'familiarFavorites') || []);
  const details = `<p><b>${escapeHTML(familiar.name)}</b> — ${escapeHTML(master.name)} · ${maximum} capacités, dont ${fixed.length} imposée(s). <b>${free} choix libres</b>.</p>
  ${fixed.map(name=>`<p>🔒 ${escapeHTML(name)} (capacité du patron, appliquée par la fiche du maître)</p>`).join('')}
  <p class="hint">L'apparence du familier n'impose aucune capacité dans ce sélecteur. Les restrictions textuelles non codées restent soumises au MJ.</p>
  <div style="display:flex;gap:1em;align-items:center;flex-wrap:wrap;margin:8px 0">
    <label><input type="checkbox" class="val-familiar-filter" checked /> Masquer les capacités indisponibles</label>
    <label><input type="checkbox" class="val-familiar-favorites-only" /> Favoris uniquement</label>
  </div>
  <div class="val-familiar-counter" aria-live="polite"></div>
  <div class="val-familiar-list" style="max-height:48vh;overflow:auto;display:grid;gap:4px">${docs.map(doc=>{
    const id=abilityId(doc); const checked=selected.has(id);
    const fav=favorites.has(id);
    return `<div class="val-familiar-row" data-row="${escapeHTML(id)}" style="padding:5px 3px;border-bottom:1px solid var(--color-border-light-tertiary)">
      <div style="display:flex;gap:8px;align-items:center">
        <input type="checkbox" aria-label="Choisir ${escapeHTML(doc.name)}" data-ability="${escapeHTML(id)}" ${checked?'checked':''}/>
        <span style="flex:1"><b>${escapeHTML(doc.name)}</b><small class="val-familiar-reason"></small></span>
        <button type="button" class="val-familiar-star" data-favorite="${escapeHTML(id)}" title="${fav?'Retirer des favoris':'Ajouter aux favoris'}" style="flex:0 0 auto;width:32px;padding:3px;color:${fav?'#e6af4a':'inherit'}"><i class="${fav?'fa-solid':'fa-regular'} fa-star"></i></button>
        <button type="button" data-info="${escapeHTML(id)}" title="Voir la description" style="flex:0 0 auto;width:32px;padding:3px"><i class="fa-solid fa-circle-info"></i></button>
      </div>
      <div class="val-familiar-description" hidden style="margin:8px 0 8px 30px;padding:8px;border-left:2px solid var(--color-border-light-tertiary)">${doc.system?.description?.value || '<em>Aucune description.</em>'}</div>
    </div>`;
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
      counter.textContent=`${all.size}/${free} choix libres${all.size>free?' — Retirez '+(all.size-free)+' capacité(s) pour enregistrer.':''}`;
      counter.style.color=all.size>free?'var(--color-text-danger)':'';
      for(const el of root.querySelectorAll('[data-ability]')){
        const doc=docs.find(d=>abilityId(d)===el.dataset.ability);
        const errors=reasons(doc,master,all,rank);
        const row=el.closest('.val-familiar-row');
        const desc=row.querySelector('.val-familiar-reason');
        desc.textContent=errors.length?` — Indisponible : ${errors.join(', ')}`:'';
        el.disabled=!el.checked&&(!!errors.length||all.size>=free);
        const hideUnavailable=root.querySelector('.val-familiar-filter').checked;
        const onlyFavorites=root.querySelector('.val-familiar-favorites-only').checked;
        row.hidden=(hideUnavailable && errors.length>0 && !el.checked) || (onlyFavorites && !favorites.has(el.dataset.ability) && !el.checked);
      }
    };
    root.addEventListener('change',update);
    root.addEventListener('click',async event=>{
      const favoriteButton=event.target.closest('[data-favorite]');
      if(favoriteButton){
        const id=favoriteButton.dataset.favorite;
        if(favorites.has(id))favorites.delete(id);else favorites.add(id);
        favoriteButton.querySelector('i').className=`${favorites.has(id)?'fa-solid':'fa-regular'} fa-star`;
        favoriteButton.style.color=favorites.has(id)?'#e6af4a':'inherit';
        favoriteButton.title=favorites.has(id)?'Retirer des favoris':'Ajouter aux favoris';
        try{await familiar.setFlag(NAMESPACE,'familiarFavorites',[...favorites]);}
        catch(error){console.error('Favoris du familier',error);ui.notifications.error('Impossible de sauvegarder les favoris.');}
        update();return;
      }
      const infoButton=event.target.closest('[data-info]');
      if(infoButton){const detail=infoButton.closest('.val-familiar-row').querySelector('.val-familiar-description');detail.hidden=!detail.hidden;}
    });
    update();
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
