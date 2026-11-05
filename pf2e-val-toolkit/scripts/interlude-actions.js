// Generic PF2e Val Toolkit downtime shortcuts. No campaign-specific actor IDs or world data.
const LABELS = {
  create: 'Créer un contact',
  maintain: 'Entretenir une relation',
  community: 'Rendre service à une communauté'
};
const DESCRIPTIONS = {
  create: 'Recueillir des informations (Diplomatie). Réussite : +1 et création d’une relation ; critique : +1 et possibilité de tenter Entretenir une relation.',
  maintain: 'Faire bonne impression (Diplomatie), contre le DD de Volonté. Proposition maison : critique +2, réussite +1, échec 0, échec critique −1.',
  community: 'Service à une communauté. Le MJ décide du DD et de la compétence. Proposition de réputation personnelle selon le service réellement rendu.'
};
function isHobnobber(actor) {
  return actor?.type === 'character' && actor.items?.some(item =>
    item.slug === 'hobnobber' || item.system?.slug === 'hobnobber'
    || /^(animal social|hobnobber)$/i.test(item.name || '')
  );
}
function currentActor() {
  const token = canvas?.tokens?.controlled?.[0];
  return token?.actor || game.user?.character || null;
}
async function openInterlude(actor, kind) {
  if (!actor || (!actor.isOwner && !game.user.isGM)) {
    ui.notifications.warn('Vous ne pouvez pas lancer cette activité avec ce personnage.');
    return;
  }
  if (!LABELS[kind]) return;
  const isCommunity = kind === 'community';
  const skill = isCommunity ? '' : 'diplomacy';
  const skills = isCommunity
    ? ['diplomacy', 'nature', 'survival', 'society', 'medicine', 'athletics', 'crafting', 'religion', 'occultism', 'arcana']
        .filter(id => actor.getStatistic?.(id))
    : [];
  let communities = [];
  if (isCommunity) {
    try {
      const response = await fetch('https://l7r.fr/apil7r/pf2-mj/reputations/visible', {
        signal: AbortSignal.timeout(3000)
      });
      if (response.ok) communities = await response.json();
    } catch (error) {
      console.debug('PF2e Val Toolkit | Catalogue des réputations non disponible :',error);
    }
  }
  const communityOptions = communities.map(c =>
    '<option value="' + foundry.utils.escapeHTML(c.name) + '">' +
    foundry.utils.escapeHTML(c.group+' — '+c.name) + '</option>'
  ).join('');
  const selectedTargetName = foundry.utils.escapeHTML(kind==='maintain' ? (game.user.targets?.first()?.actor?.name || '') : '');
  const communityField = isCommunity && communities.length
    ? '<label>Communauté <select name="target">' + communityOptions + '</select></label>'
    : '<label>Personne ou milieu visé <input name="target" maxlength="130" required value="' + selectedTargetName + '" placeholder="Ex. marins d’Absalom"></label>';
  const targetActor = game.user.targets?.first()?.actor;
  const suggestedDc = kind==='maintain'
    ? Number(targetActor?.getStatistic?.('will')?.dc?.value)||15
    : 15;
  const options = skills.map(id => {
    const statistic = actor.getStatistic(id);
    return '<option value="' + foundry.utils.escapeHTML(id) + '">' + foundry.utils.escapeHTML(statistic.label) + '</option>';
  }).join('');
  const form = [
    '<div class="pf2e-val-interlude-form">',
    '<p>' + foundry.utils.escapeHTML(DESCRIPTIONS[kind]) + '</p>',
    communityField,
    isCommunity ? '<label>Compétence utilisée <select name="skill">' + options + '</select></label>' : '',
    '<label>DD décidé par le MJ <input name="dc" type="number" min="5" max="60" value="' + suggestedDc + '" required></label>',
    '<p class="hint">DD Créer un contact suggérés : 15 courant, 20 spécialisé, 25 difficile, 30 très fermé. Entretenir : DD de Volonté de la personne.</p>',
    '</div>'
  ].join('');
  let choices;
  try {
    // Foundry V14: DialogV2 wraps content in its own form. Use the button's
    // native form elements rather than nesting a legacy Dialog V1 form.
    choices = await foundry.applications.api.DialogV2.wait({
      window: {title: LABELS[kind] + ' — ' + actor.name},
      content: form,
      rejectClose: false,
      buttons: [{
        action: 'roll', label: 'Lancer le test', default: true,
        callback: (_event, button) => {
          const elements = button.form.elements;
          return {
            target: elements.namedItem('target')?.value?.trim() || '',
            dc: Number(elements.namedItem('dc')?.value),
            skill: isCommunity ? elements.namedItem('skill')?.value : skill
          };
        }
      }]
    });
  } catch(error) {
    console.warn('PF2e Val Toolkit | Intermède annulé :', error);
    return;
  }
  if (!choices) return;
  if (!choices.target || !Number.isInteger(choices.dc) || choices.dc<5 || choices.dc>60) {
    ui.notifications.warn('Indiquez un milieu ou une personne et un DD valide.');return;
  }
  const statistic = actor.getStatistic?.(choices.skill);
  if (!statistic?.roll) {ui.notifications.error('Compétence introuvable : '+choices.skill);return;}
  const note = foundry.utils.escapeHTML(choices.target);
  const source = foundry.utils.escapeHTML(DESCRIPTIONS[kind]);
  try {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({actor}),
      content: '<p><strong>Intermède — ' + LABELS[kind] + '</strong></p><p>Cible : ' + note
        + '</p><p>' + source + '</p><small>Récompense non automatique : validation et saisie par le MJ dans le wiki.</small>'
    });
    await statistic.roll({
      dc:{value:choices.dc,label:LABELS[kind]},
      ...(kind==='create' ? {rollMode:'blindroll'} : {})
    });
  } catch(error) {
    console.error('PF2e Val Toolkit | Intermède :',error);
    ui.notifications.error('Échec du test : '+error.message);
  }
}
export function decorateInterludeExtras(actorOverride = null, root = document) {
  if (!game.modules.get('pf2e-hud')?.active) return;
  // In Foundry V14's render hook, root is the pending ApplicationV2 element.
  // Using it directly avoids racing the HUD's asynchronous DOM replacement.
  const extras = root.matches?.('[data-sidebar="extras"]')
    ? root : root.querySelector?.('#pf2e-hud-sidebar [data-sidebar="extras"], [data-sidebar="extras"]');
  if (!extras) return;
  const actor = actorOverride || currentActor();
  const existing = extras.querySelector('.pf2e-val-interlude-shortcuts');
  if (existing?.dataset.actorUuid === actor?.uuid) return;
  existing?.remove();
  if (!isHobnobber(actor) || (!actor.isOwner && !game.user.isGM)) return;
  const box = document.createElement('div');
  box.dataset.actorUuid = actor.uuid;
  box.className='pf2e-val-interlude-shortcuts';
  const title = document.createElement('strong');
  title.textContent='Intermèdes — Relations et réputations';
  box.append(title);
  for (const [kind,label] of Object.entries(LABELS)) {
    const btn=document.createElement('button');
    btn.type='button';btn.className='pf2e-val-interlude-button';
    btn.textContent=label;
    btn.title=DESCRIPTIONS[kind];
    btn.addEventListener('click',()=>{
      if (!btn.isConnected || !extras.contains(btn)) return;
      void openInterlude(actor,kind);
    });
    box.append(btn);
  }
  extras.append(box);
}
export function openInterludeActivity(actor,kind){return openInterlude(actor,kind)}
