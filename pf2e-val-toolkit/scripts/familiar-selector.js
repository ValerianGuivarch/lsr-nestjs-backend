/** PF2e familiar abilities: daily picker driven by the master's derived statistics. */
const PACK = 'pf2e.familiar-abilities';
const NAMESPACE = 'pf2e-val-toolkit';
const LOCKED_WITCH = { 'spinner-of-threads': 'familiar-of-balanced-luck' };
const requires = {
  'item-delivery': ['manual-dexterity'],
  'elemental': ['resistance'],
};
const spellRanks = { 'spell-battery': 4, 'spellcasting': 6, 'medic': 3 };

export const HUNT_FORMS = {
  falcon: { name: 'Faucon', fixed: ['flier'], suggested: ['fast-movement'], choices: { 'fast-movement': { speed: 'fly' } }, role: 'Reconnaissance aérienne' },
  wildcat: { name: 'Chat sauvage', fixed: [], suggested: ['touch-telepathy', 'ambassador'], role: 'Lien mental et interactions sociales' },
  hound: { name: 'Chien de chasse', fixed: [], suggested: ['soul-sight', 'share-senses'], role: 'Détection surnaturelle et partage sensoriel' },
  wolf: { name: 'Loup', fixed: [], suggested: ['threat-display', 'echolocation'], role: 'Intimidation et vigilance' },
  otter: { name: 'Loutre', fixed: ['amphibious'], suggested: ['manual-dexterity'], role: 'Exploration aquatique et récupération' },
  fox: { name: 'Renard', fixed: [], suggested: ['burrower', 'tremorsense'], role: 'Exploration souterraine' },
  raven: { name: 'Corbeau', fixed: ['flier'], suggested: ['speech'], role: 'Communication et messagerie' },
  ermine: { name: 'Hermine', fixed: [], suggested: ['familiar-focus', 'cantrip-connection'], role: 'Soutien magique' },
  genet: { name: 'Genette', fixed: [], suggested: ['climber', 'darkvision'], role: 'Espionnage et infiltration nocturne' },
};
const FORM_FLAG = 'familiarHuntForms';
const FAVORITES_SEED_VERSION = 2;
const FORM_ASSET = 'modules/pf2e-val-toolkit/assets/familiar-forms';
const formFor = id => Object.hasOwn(HUNT_FORMS, id) ? HUNT_FORMS[id] : null;
const formImage = id => `${FORM_ASSET}/${id}.webp`;

export function hasHuntForms(familiar) {
  return familiar?.type === 'familiar' && ['Prism', 'Prisme'].includes(familiar.name);
}

export function huntFavorites(existing = []) {
  return [...new Set([...existing, 'scent', ...Object.values(HUNT_FORMS).flatMap(form => [...form.fixed, ...form.suggested])])];
}

export function presetSelection(id, patron, maximum, reserved, available) {
  const form = formFor(id);
  if (!form) return null;
  const fixed = new Set([...patron, ...form.fixed]);
  const result = new Set(reserved);
  if ([...fixed].some(slug => !available.has(slug)) || new Set([...fixed, ...result]).size > maximum) return null;
  for (const slug of [...form.fixed, ...form.suggested]) {
    if (available.has(slug) && new Set([...patron, ...result, slug]).size <= maximum) result.add(slug);
  }
  return { selected: result, fixed, choices: form.choices || {} };
}

export function presetSource(doc, choices = {}) {
  const source = doc.toObject();
  for (const rule of source.system?.rules || []) {
    if (rule.key === 'ChoiceSet' && Object.hasOwn(choices, rule.flag) && rule.choices?.some?.(c => c.value === choices[rule.flag])) {
      rule.selection = choices[rule.flag];
    }
  }
  return source;
}

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
export function reasons(item, master, selected, rank) {
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
// Descriptions from PF2e compendia contain Foundry UUID inline links. Enrich them
// using the official renderer instead of printing raw @UUID[...] expressions.
async function renderDescription(doc) {
  const raw = doc.system?.description?.value || '<em>Aucune description.</em>';
  try {
    return await TextEditor.enrichHTML(raw, { async: true, documents: true, relativeTo: doc });
  } catch (error) {
    console.warn('PF2e Val Toolkit | Impossible de convertir la description', doc.name, error);
    return escapeHTML(raw.replace(/<[^>]*>/g, '').replace(/@UUID\[[^\]]+\]\{([^}]+)\}/g, '$1'));
  }
}

export async function openFamiliarSelector(familiar) {
  if (!familiar || familiar.type !== 'familiar') return;
  const master = familiarMaster(familiar);
  if (!master) return ui.notifications.warn('Familier : maître introuvable.');
  const pack = game.packs.get(PACK);
  if (!pack) return ui.notifications.error(`Compendium introuvable : ${PACK}`);
  const docs = (await pack.getDocuments()).filter(isFamiliarAbility).sort((a,b)=>a.name.localeCompare(b.name,'fr'));
  const fixed = witchLocked(master);
  const fixedDocuments = fixed.map(slug => docs.find(doc => abilityId(doc) === slug)).filter(Boolean);
  if (fixedDocuments.length !== fixed.length) {
    return ui.notifications.error('Capacité de patron introuvable dans le compendium : aucune modification.');
  }
  // Patron abilities are real embedded familiar abilities, not merely display labels.
  // On opening the selector, reconcile an older familiar whose mandatory ability
  // was previously counted but never created on the actor.
  if (fixedDocuments.length && familiar.isOwner) {
    const missing = fixedDocuments.filter(doc => !familiar.items.some(item => abilityId(item) === abilityId(doc)));
    if (missing.length) await familiar.createEmbeddedDocuments('Item', missing.map(doc => doc.toObject()));
  }
  const current = familiar.items.filter(isFamiliarAbility);
  const fixedSet = new Set(fixed);
  const freeCurrent = current.filter(item => !fixedSet.has(abilityId(item)));
  const maximum = Number(master.system?.attributes?.familiarAbilities?.value ?? 2);
  const free = Math.max(0, maximum - fixed.length);
  const selected = new Set(freeCurrent.map(abilityId));
  const rank = highestRank(master);
  const unknown = freeCurrent.filter(i=>!docs.some(d=>abilityId(d)===abilityId(i)));
  for (const item of unknown) selected.add(abilityId(item));
  const formConfig = familiar.getFlag(NAMESPACE, FORM_FLAG) || {};
  const formsEnabled = hasHuntForms(familiar);
  let activeForm = formsEnabled && formFor(formConfig.form) ? formConfig.form : '';
  let pendingChoices = {};
  const visibleForms = formsEnabled;
  const available = new Set(docs.map(abilityId));
  const formPanel = visibleForms ? `
    <div class="val-familiar-forms" style="margin:8px 0;padding:8px;border:1px solid var(--color-border-light-tertiary)">
      <div style="display:flex;gap:12px;align-items:center"><img class="val-familiar-form-portrait" src="${escapeHTML(activeForm ? formImage(activeForm) : familiar.img)}" style="width:96px;height:96px;object-fit:contain;flex:0 0 96px" alt="Portrait du familier"/>
      <div style="flex:1"><label>Forme du jour <select class="val-familiar-form"><option value="">Choisir une forme</option>${Object.entries(HUNT_FORMS).map(([id,form])=>`<option value="${id}" ${activeForm===id?'selected':''}>${escapeHTML(form.name)}</option>`).join('')}</select></label>
      <p class="val-familiar-form-role"></p><button type="button" class="val-familiar-reset-form">Rétablir les capacités suggérées</button></div></div>
      <p class="hint">La forme réserve ses capacités naturelles. Les autres restent libres. Le portrait et les capacités ne changent qu'à l'enregistrement.</p>
    </div>` : '';
  const favorites = new Set(familiar.getFlag(NAMESPACE, 'familiarFavorites') || []);
  if (formsEnabled && familiar.isOwner && Number(familiar.getFlag(NAMESPACE, 'familiarHuntFavoritesVersion') || 0) < FAVORITES_SEED_VERSION) {
    for (const slug of huntFavorites(favorites)) favorites.add(slug);
    try {
      await familiar.update({
        [`flags.${NAMESPACE}.familiarFavorites`]: [...favorites],
        [`flags.${NAMESPACE}.familiarHuntFavoritesVersion`]: FAVORITES_SEED_VERSION,
      });
    } catch (error) {
      console.warn('PF2e Val Toolkit | Impossible de préremplir les favoris de Prisme', error);
      ui.notifications.warn('Les favoris proposés seront réessayés à la prochaine ouverture.');
    }
  }
  const descriptions = await Promise.all(docs.map(renderDescription));
  const descriptionById = new Map(docs.map((doc, index) => [abilityId(doc), descriptions[index]]));
  const details = `<p><b>${escapeHTML(familiar.name)}</b> — ${escapeHTML(master.name)} · ${maximum} capacités, dont ${fixed.length} imposée(s). <b>${free} choix libres</b>.</p>
  ${fixedDocuments.map(doc=>`<p>🔒 ${escapeHTML(doc.name)} (capacité obligatoire du patron, présente sur la fiche du familier)</p>`).join('')}
  ${formPanel}
  <p class="hint">Les restrictions textuelles non codées restent soumises au MJ.</p>
  <div style="display:flex;gap:1em;align-items:center;flex-wrap:wrap;margin:8px 0">
    <label><input type="checkbox" class="val-familiar-filter" checked /> Masquer les capacités indisponibles</label>
    <label><input type="checkbox" class="val-familiar-favorites-only" /> Favoris uniquement</label>
    <label><input type="checkbox" class="val-familiar-show-info" /> Afficher les informations</label>
  </div>
  <div class="val-familiar-counter" aria-live="polite"></div>
  <div class="val-familiar-list" style="max-height:48vh;overflow-x:hidden;overflow-y:auto;display:block;min-width:0;max-width:100%">${docs.filter(doc => !fixedSet.has(abilityId(doc))).map(doc=>{
    const id=abilityId(doc); const checked=selected.has(id);
    const fav=favorites.has(id);
    return `<div class="val-familiar-row" data-row="${escapeHTML(id)}" style="min-width:0;max-width:100%;padding:5px 3px;border-bottom:1px solid var(--color-border-light-tertiary)">
      <div style="display:flex;min-width:0;gap:8px;align-items:center">
        <input type="checkbox" aria-label="Choisir ${escapeHTML(doc.name)}" data-ability="${escapeHTML(id)}" ${checked?'checked':''}/>
        <span style="flex:1;min-width:0;overflow-wrap:anywhere"><b>${escapeHTML(doc.name)}</b><small class="val-familiar-reason"></small></span>
        <button type="button" class="val-familiar-star" data-favorite="${escapeHTML(id)}" title="${fav?'Retirer des favoris':'Ajouter aux favoris'}" style="flex:0 0 auto;width:32px;padding:3px;color:${fav?'#e6af4a':'inherit'}"><i class="${fav?'fa-solid':'fa-regular'} fa-star"></i></button>
        <button type="button" data-info="${escapeHTML(id)}" title="Voir la description" style="flex:0 0 auto;width:32px;padding:3px"><i class="fa-solid fa-circle-info"></i></button>
      </div>
      <div class="val-familiar-description" hidden style="box-sizing:border-box;min-width:0;max-width:100%;overflow-wrap:anywhere;word-break:break-word;margin:8px 0 8px 30px;padding:8px;border-left:2px solid var(--color-border-light-tertiary)">${descriptionById.get(id)}</div>
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
        const form = formsEnabled ? formFor(activeForm) : null;
        if(formsEnabled && !form){ui.notifications.error('Choisissez une forme animale.');return false;}
        if(form?.fixed.some(slug=>!available.has(slug)||(!all.has(slug)&&!fixedSet.has(slug)))){ui.notifications.error('Les capacités naturelles de la forme sont obligatoires.');return false;}
        if(all.size>free){ui.notifications.error(`Maximum ${free} capacités libres (dont ${unknown.length} personnalisées).`);return false;}
        for(const d of docs.filter(d=>chosen.has(abilityId(d)))){
          const failed=reasons(d,master,new Set([...all,...fixed]),rank);
          if(failed.length){ui.notifications.error(`${d.name} : ${failed.join(', ')}`);return false;}
        }
        if(!familiar.isOwner){ui.notifications.error('Modification du familier non autorisée.');return false;}
        const matchesChoice = item => Object.entries(pendingChoices[abilityId(item)] || {}).every(([flag,value])=>item.flags?.pf2e?.rulesSelections?.[flag]===value || item.system?.rules?.some(r=>r.key==='ChoiceSet'&&r.flag===flag&&r.selection===value));
        const removable=freeCurrent.filter(i=>!all.has(abilityId(i))||!matchesChoice(i));
        const add=docs.filter(d=>!fixedSet.has(abilityId(d))&&chosen.has(abilityId(d))&&!current.some(i=>abilityId(i)===abilityId(d)&&matchesChoice(i)));
        if(add.length) await familiar.createEmbeddedDocuments('Item',add.map(i=>presetSource(i,pendingChoices[abilityId(i)])));
        if(removable.length) await familiar.deleteEmbeddedDocuments('Item',removable.map(i=>i.id));
        if(formsEnabled) {
          const update = { [`flags.${NAMESPACE}.${FORM_FLAG}.form`]: activeForm };
          if(form) { update.img=formImage(activeForm); update['prototypeToken.texture.src']=update.img; }
          await familiar.update(update);
        }
        ui.notifications.info(`Capacités de ${familiar.name} enregistrées.`);
        return true;
      }}
    ]
  });
  const hook = Hooks.on('renderDialogV2', app=>{
    if(app!==dlg)return;
    Hooks.off('renderDialogV2',hook);
    const root=app.element;
    // Keep the dialog at a stable width even for lengthy compendium descriptions.
    app.setPosition?.({ width: Math.min(780, window.innerWidth - 50) });
    root.style.maxWidth='calc(100vw - 32px)';
    root.style.minWidth='0';
    const content=root.querySelector('.window-content');
    if(content){content.style.minWidth='0';content.style.overflowX='hidden';}
    const update=()=>{
      const checked=new Set([...root.querySelectorAll('[data-ability]:checked')].map(el=>el.dataset.ability));
      const all=new Set([...checked,...unknown.map(abilityId)]);
      const form = formsEnabled ? formFor(activeForm) : null;
      const natural = new Set(form?.fixed || []);
      const formRole=root.querySelector('.val-familiar-form-role');
      if(formRole) {
        const suggestion=(form?.suggested || []).map(slug=>{
          const doc=docs.find(d=>abilityId(d)===slug);
          const choice=Object.values(form.choices?.[slug] || {})[0];
          const labels={fly:'vol',survival:'Survie',intimidation:'Intimidation',deception:'Tromperie'};
          return `${doc?.name || slug}${choice ? ` (${labels[choice] || choice})` : ''}`;
        });
        formRole.textContent=form ? `${form.role} — suggéré : ${suggestion.join(', ')}` : '';
      }
      const counter=root.querySelector('.val-familiar-counter');
      counter.textContent=`${all.size+fixed.length}/${maximum} capacités, dont ${new Set([...fixed,...natural]).size} imposée(s)${all.size>free?' — Retirez '+(all.size-free)+' capacité(s) pour enregistrer.':''}`;
      counter.style.color=all.size>free?'var(--color-text-danger)':'';
      for(const el of root.querySelectorAll('[data-ability]')){
        const doc=docs.find(d=>abilityId(d)===el.dataset.ability);
        const errors=reasons(doc,master,new Set([...all,...fixed]),rank);
        const row=el.closest('.val-familiar-row');
        const desc=row.querySelector('.val-familiar-reason');
        const locked=natural.has(el.dataset.ability);
        desc.textContent=locked?' — 🔒 Capacité naturelle obligatoire':errors.length?` — Indisponible : ${errors.join(', ')}`:'';
        el.disabled=locked||(!el.checked&&(!!errors.length||all.size>=free));
        const hideUnavailable=root.querySelector('.val-familiar-filter').checked;
        const onlyFavorites=root.querySelector('.val-familiar-favorites-only').checked;
        row.hidden=(hideUnavailable && errors.length>0 && !el.checked) || (onlyFavorites && !favorites.has(el.dataset.ability) && !el.checked);
      }
    };
    const applyForm = id => {
      const preset=presetSelection(id,fixed,maximum,unknown.map(abilityId),available);
      if(!preset){ui.notifications.warn('Cette forme ne peut pas être appliquée avec les capacités disponibles.');return false;}
      activeForm=id;
      pendingChoices=preset.choices;
      for(const el of root.querySelectorAll('[data-ability]')) {
        const doc=docs.find(d=>abilityId(d)===el.dataset.ability);
        el.checked=preset.selected.has(el.dataset.ability) && (!reasons(doc,master,new Set([...preset.selected,...fixed]),rank).length || preset.fixed.has(el.dataset.ability));
      }
      root.querySelector('.val-familiar-form-portrait').src=formImage(id);
      root.querySelector('.val-familiar-form').value=id;
      update();return true;
    };
    root.addEventListener('change',event=>{
      if(event.target.matches('.val-familiar-form')){
        if(!applyForm(event.target.value))event.target.value=activeForm;
      }
      if(event.target.matches('[data-ability]')&&!event.target.checked){
        pendingChoices={...pendingChoices};delete pendingChoices[event.target.dataset.ability];
      }
      if(event.target.matches('.val-familiar-show-info')){
        const show=event.target.checked;
        for(const detail of root.querySelectorAll('.val-familiar-description'))detail.hidden=!show;
      }
      update();
    });
    root.addEventListener('click',async event=>{
      if(event.target.closest('.val-familiar-reset-form')){if(activeForm)applyForm(activeForm);return;}
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
      if(infoButton){
        const detail=infoButton.closest('.val-familiar-row').querySelector('.val-familiar-description');
        detail.hidden=!detail.hidden;
        const every=[...root.querySelectorAll('.val-familiar-description')];
        root.querySelector('.val-familiar-show-info').checked=every.every(el=>!el.hidden);
      }
    });
    if(activeForm) {
      const form=formFor(activeForm);
      for(const el of root.querySelectorAll('[data-ability]')) if(form.fixed.includes(el.dataset.ability))el.checked=true;
    }
    update();
  });
  dlg.render(true);
}

export function initFamiliarSelector(){
  const add=(app, element)=>{
    const actor=app.actor || app.document;
    if(actor?.type!=='familiar')return;
    const root=element instanceof HTMLElement?element:element?.[0];
    // Inject beside the native "Naviguer" control within the familiar's
    // Capacités section, not in the window title bar.
    const browse=root?.querySelector('[data-action="browse-abilities"][data-action-category="familiar"]');
    const controls=browse?.closest('.controls');
    if(!controls || controls.querySelector('.val-familiar-open'))return;
    // Clean up the obsolete title-bar button if a previous render injected it.
    root.querySelector('.window-header .val-familiar-open')?.remove();
    const btn=document.createElement('a');
    btn.className='val-familiar-open';
    btn.title='Choisir les capacités quotidiennes';
    btn.setAttribute('role','button');
    btn.innerHTML='<i class="fa-solid fa-paw" inert></i> Préparer';
    btn.addEventListener('click',event=>{event.preventDefault();void openFamiliarSelector(actor);});
    controls.insertBefore(btn,browse);
  };
  Hooks.on('renderActorSheetV2',add);
  Hooks.on('renderActorSheet',add);
  game.pf2eValToolkit ??= {};
  game.pf2eValToolkit.openFamiliarSelector=openFamiliarSelector;
}

