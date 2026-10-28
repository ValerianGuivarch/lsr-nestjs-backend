/** One-time data migration explicitly requested for Sashka: archetype -> class Familiar feat. */
export async function migrateSashkaFamiliarFeat() {
  if (!game.user?.isGM) return;
  const actor = game.actors.get('nfFuLv8D3BANpUj3');
  if (!actor || !/^Sashka\b/i.test(actor.name)) return;
  const old = actor.items.find(i => i.system?.slug === 'familiar-master-dedication');
  if (!old || actor.items.some(i => i.system?.slug === 'familiar' && i.system?.location === 'class-2')) return;
  try {
    const pack = game.packs.get('pf2e.feats-srd');
    if (!pack) throw new Error('Compendium des dons PF2e introuvable');
    const index = await pack.getIndex({fields:['system.slug','system.traits.value','system.level.value']});
    const entry = index.find(i => i.system?.slug === 'familiar' && i.system?.traits?.value?.includes('sorcerer'));
    if (!entry) throw new Error('Don de classe « Familiar » pour ensorceleur introuvable : aucun changement');
    const feat = await pack.getDocument(entry._id);
    const data = feat.toObject();
    delete data._id;
    data.system.location = old.system.location || 'class-2';
    data.system.level = { ...data.system.level, taken: 2 };
    await actor.createEmbeddedDocuments('Item',[data]);
    await actor.deleteEmbeddedDocuments('Item',[old.id]);
    ui.notifications.info('Sashka : Dévouement Maître familier remplacé par le don de classe Familier.');
  } catch (error) {
    console.error('PF2e Val Toolkit | Migration Sashka impossible', error);
    ui.notifications.error(`Sashka : migration du don non effectuée (${error.message}).`);
  }
}
