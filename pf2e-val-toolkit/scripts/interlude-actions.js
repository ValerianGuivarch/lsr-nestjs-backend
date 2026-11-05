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
  const communityField = isCommunity && communities.length
    ? '<label>Communauté <select name="target">' + communityOptions + '</select></label>'
    : '<label>Personne ou milieu visé <input name="target" maxlength="130" required placeholder="Ex. marins d’Absalom"></label>';
  const suggestedDc = kind==='maintain'
    ? Number(game.user.targets?.first()?.actor?.getStatistic?.('will')?.dc?.value)||15
    : 15;
  const options = skills.map(id => {
    const statistic = actor.getStatistic(id);
    return '<option value="' + foundry.utils.escapeHTML(id) + '">' + foundry.utils.escapeHTML(statistic.label) + '</option>';
  }).join('');
  const form = [
    '<form class="pf2e-val-interlude-form">',
    '<p>' + foundry.utils.escapeHTML(DESCRIPTIONS[kind]) + '</p>',
    communityField,
    isCommunity ? '<label>Compétence utilisée <select name="skill">' + options + '</select></label>' : '',
    '<label>DD décidé par le MJ <input name="dc" type="number" min="5" max="60" value="' + suggestedDc + '" required></label>',
    '<p class="hint">DD Créer un contact suggérés : 15 courant, 20 spécialisé, 25 difficile, 30 très fermé. Entretenir : DD de Volonté de la personne.</p>',
    '</form>'
  ].join('');
  let choices;
  try {
    choices = await Dialog.prompt({
      title: LABELS[kind] + ' — ' + actor.name,
      content: form,
      label: 'Lancer le test',
      callback: html => {
        const element = html?.[0] || html;
        const target = element.querySelector('[name="target"]')?.value?.trim() || '';
        const dc = Number(element.querySelector('input[name="dc"]')?.value);
        const rollSkill = isCommunity ? element.querySelector('select[name="skill"]')?.value : skill;
        return {target,dc,skill:rollSkill};
      }
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
        + ' · DD ' + choices.dc + '</p><p>' + source + '</p><small>Récompense non automatique : validation et saisie par le MJ dans le wiki.</small>'
    });
    await statistic.roll({dc:{value:choices.dc,label:LABELS[kind]}});
  } catch(error) {
    console.error('PF2e Val Toolkit | Intermède :',error);
    ui.notifications.error('Échec du test : '+error.message);
  }
}
export function decorateInterludeExtras() {
  if (!game.modules.get('pf2e-hud')?.active) return;
  const extras = document.querySelector('#pf2e-hud-sidebar [data-sidebar="extras"]');
  if (!extras || extras.querySelector('.pf2e-val-interlude-shortcuts')) return;
  const actor = currentActor();
  if (!isHobnobber(actor) || (!actor.isOwner && !game.user.isGM)) return;
  const box = document.createElement('div');
  box.className='pf2e-val-interlude-shortcuts';
  const title = document.createElement('strong');
  title.textContent='Intermèdes — Relations et réputations';
  box.append(title);
  for (const [kind,label] of Object.entries(LABELS)) {
    const btn=document.createElement('button');
    btn.type='button';btn.className='pf2e-val-interlude-button';
    btn.textContent=label;
    btn.title=DESCRIPTIONS[kind];
    btn.addEventListener('click',()=>void openInterlude(actor,kind));
    box.append(btn);
  }
  extras.append(box);
}
export function openInterludeActivity(actor,kind){return openInterlude(actor,kind)}
