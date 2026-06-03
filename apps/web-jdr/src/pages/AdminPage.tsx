import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { JdrApiClient } from '../data/JdrApiClient'

const VIKING_SLUG = 'vikingtest'
const HP_FEED_SLUG = 'poudlard'

async function seedVikingTest(): Promise<string> {
  // Delete if exists
  try { await JdrApiClient.deleteJdr(VIKING_SLUG) } catch (_) { /* not found, ok */ }

  // Create JdR
  let jdr = await JdrApiClient.createJdr('JdR Tribal Viking', 'Campagne Viking post-apocalyptique')

  // Stats
  for (const stat of ['Charisme', 'Combat', 'Magie', 'Savoir', 'Agriculture', 'Navigation', 'Nature']) {
    jdr = await JdrApiClient.addStat(jdr.slug, stat)
  }

  // Traits Normaux/Positifs
  const normalTraits = [
    { name: 'Cartographe', mods: [{ statSlug: 'savoir', value: 1 }, { statSlug: 'navigation', value: 1 }] },
    { name: 'Fils de l\'ancien chef', mods: [{ statSlug: 'charisme', value: 1 }] },
    { name: 'Capitaine', mods: [{ statSlug: 'navigation', value: 2 }, { statSlug: 'agriculture', value: -1 }] },
    { name: 'Voyageur', mods: [{ statSlug: 'navigation', value: 1 }, { statSlug: 'nature', value: -1 }] },
    { name: 'Beau comme un dieu', mods: [{ statSlug: 'charisme', value: 1 }] },
    { name: 'Guerrier d\'exception', mods: [{ statSlug: 'combat', value: 2 }] },
    { name: 'Forestier', mods: [{ statSlug: 'savoir', value: 1 }, { statSlug: 'nature', value: 1 }] },
    { name: 'Soigneur de bêtes', mods: [{ statSlug: 'agriculture', value: 2 }] },
    { name: 'Travailleur', mods: [{ statSlug: 'agriculture', value: 1 }] },
    { name: 'Force de la nature', mods: [{ statSlug: 'combat', value: 1 }] },
    { name: 'Tellurge', mods: [{ statSlug: 'magie', value: 1 }] },
    { name: 'Sauvage', mods: [{ statSlug: 'combat', value: 1 }, { statSlug: 'nature', value: 1 }, { statSlug: 'charisme', value: -1 }] },
    { name: 'Mémoire eidétique', mods: [{ statSlug: 'savoir', value: 1 }] },
    { name: 'Formé à la magie', mods: [{ statSlug: 'magie', value: 2 }] },
    { name: 'Guerrier héroïque', mods: [{ statSlug: 'combat', value: 1 }, { statSlug: 'charisme', value: 1 }] },
    { name: 'Vif', mods: [{ statSlug: 'combat', value: 1 }] },
    { name: 'Polyvalent', mods: [] },
    { name: 'Volonté forte', mods: [{ statSlug: 'magie', value: 1 }] },
    { name: 'Main verte', mods: [{ statSlug: 'agriculture', value: 1 }] },
    { name: 'Empathie avec la nature', mods: [{ statSlug: 'nature', value: 1 }] },
    { name: 'Berserker', mods: [{ statSlug: 'combat', value: 1 }] },
    { name: 'Brasseur', mods: [{ statSlug: 'agriculture', value: 1 }] },
    { name: 'Compagne remarquable', mods: [] },
    { name: 'Tatouages shamaniques', mods: [] },
    { name: 'Bagarreur', mods: [{ statSlug: 'combat', value: 1 }] }
  ]

  for (const trait of normalTraits) {
    jdr = await JdrApiClient.addTrait(jdr.slug, trait.name, 'Normal', trait.mods.length > 0 ? trait.mods : undefined)
  }

  // Traits Pénalisants
  const disadvantageTraits = [
    { name: 'Impatient', mods: [{ statSlug: 'agriculture', value: -1 }] },
    { name: 'Alcoolique', mods: [{ statSlug: 'savoir', value: -1 }] },
    { name: 'Dépensier', mods: [] },
    { name: 'Aveugle', mods: [{ statSlug: 'magie', value: 1 }, { statSlug: 'navigation', value: -1 }, { statSlug: 'nature', value: -1 }, { statSlug: 'combat', value: -1 }] },
    { name: 'Arrogant', mods: [{ statSlug: 'charisme', value: -1 }] },
    { name: 'Balafré', mods: [{ statSlug: 'charisme', value: -1 }] },
    { name: 'Téméraire', mods: [] },
    { name: 'Violent', mods: [{ statSlug: 'combat', value: 1 }, { statSlug: 'charisme', value: -1 }] },
    { name: 'Analphabète', mods: [{ statSlug: 'savoir', value: -1 }] },
    { name: 'Boiteux', mods: [{ statSlug: 'combat', value: -1 }] },
    { name: 'Vénérable', mods: [{ statSlug: 'combat', value: -1 }, { statSlug: 'savoir', value: 2 }] }
  ]

  for (const trait of disadvantageTraits) {
    jdr = await JdrApiClient.addTrait(jdr.slug, trait.name, 'Défaut', trait.mods.length > 0 ? trait.mods : undefined)
  }

  // Ressources
  jdr = await JdrApiClient.addResource(jdr.slug, 'Mana', 'specific')
  jdr = await JdrApiClient.addResource(jdr.slug, 'Faveur Spirituelle', 'all')

  // Objets
  jdr = await JdrApiClient.addItem(jdr.slug, 'Hache runique', 'Arme traditionnelle gravée de runes', false, undefined)
  jdr = await JdrApiClient.addItem(jdr.slug, 'Cristal de Freya', 'Fragment divin contenant les visions finales', true, undefined)
  jdr = await JdrApiClient.addItem(jdr.slug, 'Knarr', 'Navire viking pour les longs voyages', true, undefined)

  // Classes
  jdr = await JdrApiClient.addClass(jdr.slug, 'Chef', 1, 'Dirigeant du clan')
  jdr = await JdrApiClient.addClass(jdr.slug, 'Skald', 1, 'Gardien des traditions')
  jdr = await JdrApiClient.addClass(jdr.slug, 'Sorcier', 1, 'Manipulant du mana')
  jdr = await JdrApiClient.addClass(jdr.slug, 'Chaman', 1, 'Communicant avec les esprits')
  jdr = await JdrApiClient.addClass(jdr.slug, 'Trickster', 1, 'Chanceux et chaotique')

  // Groupes - Conseil du clan (pour les 3 PJs)
  jdr = await JdrApiClient.addGroup(jdr.slug, 'Conseil', 'Les 3 dirigeants du nouveau clan')

  // Personnages - Le nouveau Conseil
  jdr = await JdrApiClient.addCharacter(jdr.slug, 'Astrid', 'chef', 'conseil', 'Chef de clan - dirigeante politique')
  jdr = await JdrApiClient.addCharacter(jdr.slug, 'Leif', 'skald', 'conseil', 'Skald du clan - historien et négociateur')
  jdr = await JdrApiClient.addCharacter(jdr.slug, 'Kara', 'chaman', 'conseil', 'Chaman - médiatrice avec les esprits')

  return jdr.slug
}

// Tous les sorts du grimoire de Keul (PDF complet, ~317 entrées).
// Le champ level est l’entier (niveau 5 pour les sorts marqués "5+", dont la valeur d’origine reste dans data.niveau).
export const HP_SPELLS: ReadonlyArray<{
  name: string
  level: number
  data: { niveau: string; type: string; incantation: string; cible: string; effet: string }
}> = [
  { name: 'Air Chaud', level: 0, data: { niveau: '0', type: 'Enchantement', incantation: '-', cible: 'A, O, P, V', effet: 'Provoque un vent chaud qui fait sécher instantanément la cible. Formule extrême : -' } },
  { name: 'Boule de neige', level: 0, data: { niveau: '0', type: 'Enchantement', incantation: 'X', cible: 'A, P', effet: 'Agglomère la neige en une boule de neige pure qui file sur une cible Portée : POUvoir mètres Opposition : POUxDEX Formule extrême : -' } },
  { name: 'Bulles', level: 0, data: { niveau: '0', type: 'Enchantement', incantation: 'X', cible: 'M', effet: 'Convoque des bulles qui viennent flotter dans les airs sans éclater Durée : Permanente Formule extrême : -' } },
  { name: 'Chauffe-boisson', level: 0, data: { niveau: '0', type: 'Enchantement', incantation: 'X', cible: 'M', effet: 'Réchauffe instantanément une boisson Durée : - Formule extrême : -' } },
  { name: 'Création temporaire', level: 0, data: { niveau: '0', type: 'Métamorphose', incantation: 'X', cible: 'X', effet: 'Métamorphose mineure, ce sort permet de faire apparaître de petits objets (dés, verre, plume, etc.) qui disparaissent très rapidement. Durée : 2d4 minutes Formule extrême : -' } },
  { name: 'Flocon de neige', level: 0, data: { niveau: '0', type: 'Enchantement', incantation: 'X', cible: 'X', effet: 'Fait tomber des flocons de neige sur POUvoir mètres alentours. Durée : POUvoir minutes Formule extrême : -' } },
  { name: 'Magie domestique', level: 0, data: { niveau: '0', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Magie employée à la maison qui permet de faire la vaisselle, recoudre un bouton, enlever des taches. Durée : 1d4+1 heures, Remarque : il existe vraisemblablement une multitude de sorts de magie domestique (un pour chaque tâche) mais ceux-ci sont tous réunis sous la même appellation. Formule extrême : -' } },
  { name: 'Nettoyage', level: 0, data: { niveau: '0', type: 'Enchantement', incantation: '-', cible: 'O', effet: 'Enchante des objets comme des balais ou des serpillères pour qu’ils fassent le ménage d’eux-mêmes Durée : 1 heure Formule extrême : pas de formule extrême' } },
  { name: 'Parapluie', level: 0, data: { niveau: '0', type: 'Enchantement', incantation: 'X', cible: 'E', effet: 'Crée un dôme transparent au bout de la baguette qui peut être utilisé comme parapluie. Durée : - Formule extrême : -' } },
  { name: 'Ruban', level: 0, data: { niveau: '0', type: 'Enchantement', incantation: 'X', cible: 'E', effet: 'Permet de faire apparaître des rubans Durée : - Formule extrême : -' } },
  { name: 'Tricot', level: 0, data: { niveau: '0', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Enchante des aiguilles pour qu’elles tricotent d’elles-mêmes un vêtement Durée : - Formule extrême : -' } },
  { name: 'Annihilare', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Annihilare', cible: 'O', effet: 'Une variante ancienne du sortilège d’ouverture, un peu plus complexe à employer mais permettant d’ouvrir les portes et les serrures. Durée : - Formule extrême : -' } },
  { name: 'Anti-maléfice de Crâne-Chauve', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Crâne-Chauve Formule extrême : -' } },
  { name: 'Anti-maléfice de Doigtencoton', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Doigtencoton Formule extrême : -' } },
  { name: 'Anti-maléfice de Foloreille', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Folloreille Formule extrême : -' } },
  { name: 'Anti-maléfice de Jambencoton', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Jambencoton Formule extrême : -' } },
  { name: 'Arrache-gonds', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Open Sesame', cible: 'O', effet: 'Sortilège permettant d’arracher une porte de ses gonds et qui était beaucoup utilisé avant l\'importation du sortilège d’ouverture. Durée : - Formule extrême : -' } },
  { name: 'Attelle', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Ferula', cible: 'A/P', effet: 'FE : 5%/20% Employé lors de fractures, ce sort fait apparaître une attelle et empêche la blessure de s\'aggraver. Effet : Rend 1 point de vie. Durée : - Formule extrême : rend 2 points de vie' } },
  { name: 'Charme de coussinage', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Molliare', cible: 'O', effet: 'Permet de rendre un balai plus confortable en créant un coussin invisible. Peu également être utilisé pour amortir une chute Effet principal: Rend un balai plus confortable Effet secondaire : Diminue les dégâts de chute de moitié Durée : variable (heures) Formule extrême : -' } },
  { name: 'Combustion', level: 1, data: { niveau: '1', type: 'Sortilège', incantation: 'Lacarnum Inflamarae', cible: 'O', effet: 'Permet de faire prendre feu à un objet inflammable. Durée : - Formule extrême : -' } },
  { name: 'Crâne chauve', level: 1, data: { niveau: '1', type: 'Sortilège', incantation: 'Calvorio', cible: 'P', effet: 'FE : 0%/5% Fait disparaître les cheveux de la cible (APP - 1). Sous-type : Maléfice Durée : - Formule extrême : APParence -2' } },
  { name: 'Crâne chauve fluo', level: 1, data: { niveau: '1', type: 'Sortilège', incantation: 'Capilum', cible: 'P', effet: 'FE : 0%/10% Fait tomber tous les poils de la cible et rend le crâne fluorescent (APP - 2). Durée : immédiate (poils) et variable (heures) (fluorescence) Formule extrême : APParence -1d2+1 et durée +1 heure' } },
  { name: 'Croche-pied', level: 1, data: { niveau: '1', type: 'Sortilège', incantation: 'Lapsus', cible: 'P', effet: 'FE : 0%/15% Fait tomber la personne. Jet de DEX x 3 afin de rester debout. Durée : - Formule extrême : Jet de DEXx2 afin de rester debout' } },
  { name: 'Déliage', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Emancipare', cible: 'P', effet: 'Permet de se défaire de liens magiques ou non. Contre les effets du sort de Ficelage. Durée : - Formule extrême : -' } },
  { name: 'Détonation', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Badabam', cible: 'X', effet: 'Produit une violente détonation. Durée : - Formule extrême : -' } },
  { name: 'Déverrouillage', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Alohomora', cible: 'O', effet: 'FE : 5%/25% Ouvre une porte fermée à clé par un dispositif non magique. Durée : - Formule extrême : s’applique à toutes les portes dans un rayon de POUvoir mètres du sorcier' } },
  { name: 'Dunamis', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Dunamis', cible: 'O', effet: 'Une variante ancienne du sortilège d’ouverture, un peu plus complexe à employer mais permettant d’ouvrir les portes et les serrures. Durée : - Formule extrême : -' } },
  { name: 'Éclat lumineux', level: 1, data: { niveau: '1', type: 'Sortilège', incantation: 'Luminaria subitus', cible: 'X', effet: 'Inflige un malus de 50% à toutes les actions des personnages qui voient le flash. Durée : 1 round Formule extrême : -' } },
  { name: 'Écriture sur tableau noir', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Permet de faire apparaître des mots et des schémas imaginés par le lanceur sur un tableau noir. Durée : - Formule extrême : -' } },
  { name: 'Effroi petites créatures', level: 1, data: { niveau: '1', type: 'Sortilège', incantation: '« Nom » pesternomi', cible: 'A', effet: 'FE : 10%/25% Fais fuir certains animaux fantastiques considérés comme de la vermine. Durée : 1d4+1 heures Formule extrême : 2d4+1 heures de durée' } },
  { name: 'Étanchéité', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Impervius', cible: 'O', effet: 'FE : 0%/15% Enchante une surface. Repousse les substances qui s’y trouvent. Durée : variable (heures) Formule extrême : durée +3 heures' } },
  { name: 'Étincelles vertes', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Verdimillious', cible: 'A/V', effet: 'FE : 0%/10% Libère de petites étincelles vertes qui peuvent causer quelques dommages aux insectes et plantes qu’elles touchent. Effet : 1 dégât Durée : - Portée : 1,5m Formule extrême : 2 dégâts et portée de 3 mètres' } },
  { name: 'Explosion de serrure', level: 1, data: { niveau: '1', type: 'Sortilège', incantation: 'Portaberto', cible: 'O', effet: 'Sortilège qui provoque l\'explosion d\'une serrure, la rendant inutilisable. Durée : - Formule extrême : -' } },
  { name: 'Extinction', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Permet d’éteindre immédiatement un feu Durée : Volontaire Formule extrême : -' } },
  { name: 'Fermeture', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Collaporta', cible: 'O', effet: 'FE : 5%/25% Ferme une serrure non magique afin de sceller une porte. Durée : - Formule extrême : s’applique à toutes les portes dans un rayon de POUvoir mètres du sorcier' } },
  { name: 'Finestra', level: 1, data: { niveau: '1', type: 'Sortilège', incantation: 'Finestra', cible: 'O', effet: 'Permet de faire voler la vitre d\'une fenêtre en minuscules éclats. Ce sort ne cause cependant aucun bruit. Durée : - Formule extrême : -' } },
  { name: 'Flambois', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'X', cible: 'X', effet: 'Sortilège faisant jaillir une intense lueur rouge de la baguette permettant de dessiner une marque enflammée.' } },
  { name: 'Fleur magique', level: 1, data: { niveau: '1', type: 'Métamorphose', incantation: 'Orchideus', cible: 'X', effet: 'FE : 0%/10% Fait apparaître des fleurs à l\'extrémité de la baguette. Durée : 2d4+2 heures Formule extrême : durée passe à 1d4+1 jours' } },
  { name: 'Folleoreille', level: 1, data: { niveau: '1', type: 'Sortilège', incantation: 'Folloreille', cible: 'P', effet: 'FE : 0%/20% Fait remuer frénétiquement les oreilles d’une personne, ce qui diminue considérablement sa concentration. Donne un malus de 5% pour jeter des sorts et pour toute autre action nécessitant de se concentrer. Sous-type : Maléfice Durée : Variable (rounds) Formule extrême : Malus de 10% et durée +1 round' } },
  { name: 'Hydrophobie', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'FE : 0%/10% Permet de rendre un objet hydrophobe durant un certain temps. Celui- ci repousse alors tous les liquides qui entrent en contact avec lui. Durée : Variable (heures) Formule extrême : Durée de 1d2 jour(s)' } },
  { name: 'Insecte en bouton', level: 1, data: { niveau: '1', type: 'Métamorphose', incantation: 'X', cible: 'A', effet: 'Métamorphose un insecte en bouton Durée : - Formule extrême : -' } },
  { name: 'Lacer', level: 1, data: { niveau: '1', type: 'Sortilège', incantation: 'Laqueare', cible: 'P', effet: 'FE : 10%/30% Attache les lacets de la cible, jet de DEXx3 pour rester debout et un round pour les détacher. Durée : - Formule extrême : DEXx2 pour rester debout et 2 rounds pour détacher ses lacets' } },
  { name: 'Larmes', level: 1, data: { niveau: '1', type: 'Sortilège', incantation: 'Lacrimare', cible: 'P', effet: 'FE : 0%/20% Fait pleurer une personne, malus de 20% à tout ce qui implique la vision durant 1d4 heures Formule extrême : Malus de 30% et durée +1 heure' } },
  { name: 'Lévitation d’arbres', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Mobiliarbus', cible: 'V', effet: 'Permet de faire léviter un arbre. Celui-ci suit ensuite le sorcier tant qu’il reste concentré sur le sortilège. Durée : Volontaire Formule extrême : -' } },
  { name: 'Lévitation d’objets', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Wingardium leviosa', cible: 'O', effet: 'FE : 0%/10% Permet de soulever un objet du sol et de contrôler sa trajectoire. Maximum : POU x 3 kg. Durée : volontaire Formule extrême : Poids de POUx4 kg' } },
  { name: 'Lévitation de corps (Niv 1)', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Mobilicorpus', cible: 'P', effet: 'Permet de faire léviter une personne (consciente ou non). Celui-ci suit ensuite le sorcier tant qu’il reste concentré sur le sortilège. Durée : Volontaire Formule extrême : -' } },
  { name: 'Lévitation de personne', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Levioso', cible: 'P', effet: 'Permet de faire léviter une personne à quelques centimètres au-dessus du sol. Celle-ci reste dans les airs tant que le Sorcier reste concentré sur le sortilège. Durée : Volontaire Formule extrême : -' } },
  { name: 'Liberare', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Liberare', cible: 'O', effet: 'Une variante ancienne du sortilège d’ouverture, un peu plus complexe à employer mais permettant d’ouvrir les portes et les serrures. Durée : - Formule extrême : -' } },
  { name: 'Liquide vers Liquide', level: 1, data: { niveau: '1', type: 'Métamorphose', incantation: 'X', cible: 'O', effet: 'Permet de métamorphoser un liquide en un autre. Durée : permanente. Formule extrême : -' } },
  { name: 'Lumière/Obscurité', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Lumos/Nox', cible: 'X', effet: 'FE : 0%/10% Fait jaillir un faisceau de lumière de la baguette (longueur : 5 mètres). Durée : volontaire Formule extrême : Longueur 10 mètres' } },
  { name: 'Maléfice de Doigtencoton', level: 1, data: { niveau: '1', type: 'Sortilège', incantation: 'Digitus Wibbly', cible: 'P', effet: 'FE : 5%/25% Impose un malus de 50 % à toute action utilisant les mains durant 1d4 heures Sous-type : Maléfice Formule extrême : Malus de 60% et durée +1 heure' } },
  { name: 'Maléfice de Jambencoton', level: 1, data: { niveau: '1', type: 'Sortilège', incantation: 'Locomotor Wibbly', cible: 'P', effet: 'FE : 5%/25% Impose un malus de 50 % à toute action utilisant les jambes Sous-type : Maléfice Durée : 1d4 heures Formule extrême : Malus de 60% et durée +1 heure' } },
  { name: 'Objet en Oiseau', level: 1, data: { niveau: '1', type: 'Métamorphose', incantation: 'Avifors', cible: 'O', effet: 'Transforme un objet en oiseau vivant de même taille ou en une volée d’oiseaux. Durée : permanente Formule extrême : -' } },
  { name: 'Objet vers Objet', level: 1, data: { niveau: '1', type: 'Métamorphose', incantation: 'X', cible: 'O', effet: 'Permet de métamorphoser un objet en un autre. Durée : permanente Formule extrême : -' } },
  { name: 'Objets chantant', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Cantis', cible: 'O', effet: 'Permet de faire chanter les objets enchantés Durée : Volontaire Formule extrême : -' } },
  { name: 'Oiseaux de lumière', level: 1, data: { niveau: '1', type: 'Métamorphose', incantation: 'X', cible: 'X', effet: 'Permet de faire jaillir de petits oiseaux de lumière de sa baguette. Durée : permanente Formule extrême : -' } },
  { name: 'Purification', level: 1, data: { niveau: '1', type: 'Métamorphose', incantation: 'X', cible: 'O', effet: 'Sépare des substances différentes (permet de trier ses lentilles, de retirer les impuretés d’une poudre, de retirer le sable de ses chaussures) Durée : permanente Formule extrême : -' } },
  { name: 'Quatre-Points', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Pointe au nord', cible: 'X', effet: 'Ce sort agit comme une boussole et permet de savoir où est le nord. Durée : 1 round Formule extrême : -' } },
  { name: 'Ralentissement', level: 1, data: { niveau: '1', type: 'Sortilège', incantation: 'Leniter', cible: 'A', effet: 'FE : 5%/25% Ralentit les déplacements de petites créatures (120 cm au maximum) pendant 1d4+1 rounds. Déplacements (vol, nage ou marche) divisé par 2. (Opposition : POU/DEX) Formule extrême : durée 2d4+2 rounds et vitesse divisée par' } },
  { name: 'Réchauffement', level: 1, data: { niveau: '1', type: 'Métamorphose', incantation: 'Calefare', cible: 'O', effet: 'FE : 0%/15% Permet de faire chauffer un objet de quelques degrés ou de faire bouillir une petite quantité de liquide (3L). Durée : - Formule extrême : Quantité jusqu’à 10L' } },
  { name: 'Récurage', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Récurvite', cible: 'A/O P', effet: 'Nettoie la saleté en créant des bulles de savon, ou en la faisant disparaître. Peut également être utilisé sur une personnage pour remplir sa bouche de bulles de savon Portée : 1,5m Durée : permanente Formule extrême : -' } },
  { name: 'Refroidissement', level: 1, data: { niveau: '1', type: 'Métamorphose', incantation: 'Frigidus', cible: 'O', effet: 'FE : 0%/15% Permet de faire refroidir un liquide ou un objet jusqu’à 5° C. Durée : - Formule extrême : diminution jusqu’à 0°C' } },
  { name: 'Repousse des cheveux', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'X', cible: 'P', effet: 'Permet de faire rapidement repousser les cheveux Durée : - Formule extrême : -' } },
  { name: 'Révélation', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Aparecium', cible: 'O', effet: 'FE : 10%/30% Fait apparaître quelque chose qui a été caché par magie ou non (Opposition : Niv / Niv). Durée : - Formule extrême : révèle tous les objets cachés dans un rayon de POUvoir mètres autour du sorcier' } },
  { name: 'Rotation', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Circumrota', cible: 'O', effet: 'Permet de faire pivoter des objets d’une taille maximale de POUx10 m3 Durée : - Formule extrême : -' } },
  { name: 'Scintillement', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: '« Nom » Corusco', cible: 'O', effet: 'Permet de faire scintiller l’objet visé, le rendant plus facilement repérable. Par exemple, « Stella » Corusco permettrait de faire scintiller les étoiles d’un tableau alors que « Galerum » Corusco permettrait de faire scintiller le chapeau d’un Sorcier. Durée : - Formule extrême : -' } },
  { name: 'Sécheresse', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'X', cible: 'X', effet: 'Permet d’assécher de petites étendues d’eau. Durée : permanente Formule extrême : -' } },
  { name: 'Sortilège d’eau', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Aguamenti', cible: 'X', effet: 'Produit de l’eau qui sort à l’extrémité de la baguette. La puissance du jet est variable, et peut aussi bien servir à étancher la soif qu\'à éteindre un incendie. Durée : permanente Formule extrême : -' } },
  { name: 'Sortilège de feu', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Incendio', cible: 'A/O P/V', effet: 'FE : 5%/25% Permet de conjurer des flammes pouvant blesser, endommager des objets et enflammer la matière. Cause 1d4 dégâts de feu et à 50% de chance d’enflammer. Durée : volontaire Formule extrême : 1d4+2 dégâts et 75% de chance d’enflammer' } },
  { name: 'Sortilège de réparation', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: '« Nom » reparo', cible: 'O', effet: 'FE : 0%/20% Permet de réparer une petite cassure ou un petit trou sur un objet non magique. Durée : permanente. Formule extrême : répare des cassures et dégâts de moyenne à grande importance' } },
  { name: 'Surface miroir', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Mirare', cible: 'X', effet: 'FE : 0%/20% Fait apparaître une surface argentée sur un support, qui reflète tout ce qui passe devant. Durée : 2d4+2 heures Formule extrême : durée 1d4+1 jours' } },
  { name: 'Tergeo', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Tergeo', cible: 'A, O, P, V', effet: 'Créer un siphon depuis la baguette qui débarrasse une cible du sang, de la graisse et d’autres taches et saletés. Durée : permanente Formule extrême : -' } },
  { name: 'Valise', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Failamalle', cible: 'O', effet: 'Permet de faire que ses affaires se rangent toutes seules. Durée : 1 minute Formule extrême : -' } },
  { name: 'Ventilation', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Anapneo', cible: 'P', effet: 'FE : 0%/10% Libère instantanément les voies respiratoires d’une personne en train de s’étouffer. Durée : - Formule extrême : Fonctionne sur toutes les personnes dans un rayon de POUvoir mètres autour du sorcier' } },
  { name: 'Vermilious', level: 1, data: { niveau: '1', type: 'Enchantement', incantation: 'Vermillious / Vermeil', cible: 'A/V', effet: 'FE : 0%/10% Libère de petites étincelles rouges vermeils qui peuvent causer quelques dommages aux insectes et plantes qu’elles touchent. Effet : 1 dégât Durée : - Portée : 1,5m Formule extrême : 2 dégâts et portée de 3 mètres' } },
  { name: 'Alarte Ascendare', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Alarte Ascendare', cible: 'A, O, P, V', effet: 'Fait sauter un la cible dans les air à environ un mètre de haut Durée : - Formule extrême : - Remarque : Uniquement imprononçable' } },
  { name: 'Animal en Animal', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'X', cible: 'A', effet: 'Transforme un animal en un autre. Durée : permanente Formule extrême : -' } },
  { name: 'Animal en Objet', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'X', cible: 'A', effet: 'Transforme un animal en objet. Durée : permanente Formule extrême : -' } },
  { name: 'Annulation de métamorphose', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'Réparifagex A/O /P/', cible: 'V', effet: 'Sortilège qui annule un sortilège de métamorphose incomplet. Ne fonctionne cependant pas sur les métamorphoses complètes. Durée : - Formule extrême : -' } },
  { name: 'Anti-maléfice de Bloque-Jambe', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Bloque-Jambe Formule extrême : -' } },
  { name: 'Anti-maléfice de Conjonctivite', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Conjonctivite Formule extrême : -' } },
  { name: 'Anti-maléfice de Grande-Tête', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Grande-Tête Formule extrême : -' } },
  { name: 'Anti-Maléfice de Melofors', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Melofors Formule extrême : -' } },
  { name: 'Anti-maléfice de Videntrailles', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Videntrailles Formule extrême : -' } },
  { name: 'Annuler une invocation', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: '« Nom » evanesco', cible: 'A/O V', effet: 'Permet de faire disparaître un objet, animal, végétal, crée par métamorphose, ou de lui rendre sa forme première (Opposition : POU/POU). Ne marche pas pour les Animagus! Durée : permanente Formule extrême : -' } },
  { name: 'Anti-ouverture', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Lancé sur un objet comme une porte ou une serrure, ce sortilège fonctionne comme un contre sort d’ouverture comme Alohomora, Annihilare, Dunamis, ou Liberare. Il doit néanmoins être lancé de manière différente pour chque sortilège d’ouverture. Durée : POU jours Formule extrême : -' } },
  { name: 'Anti-Sort général', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Finite incantatem S', cible: '', effet: 'Supprime immédiatement les effets de tous les sortilèges (Opposition : POU / POU). Ne permet pas de contrer les sortilèges possédant le sous-type : Maléfice . Ces sortilèges particuliers nécessitent un contre-maléfice spécifique. Durée : - Formule extrême : -' } },
  { name: 'Apparition d’objet', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'Inanimatus Apparitus', cible: 'O', effet: 'FE : 5%/25% Permet de faire apparaître un objet invisible. Durée : permanente Formule extrême : révèle tous les objets invisibles dans un rayon de POUvoir mètres autour du sorcier' } },
  { name: 'Ascension', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Ascendio', cible: 'P', effet: 'FE : 5%/25% Permet de faire sauter le sorcier dans les airs (maximum POU/2 m) ou à la surface de l’eau. Durée : - Formule extrême : maximum POUvoir mètres' } },
  { name: 'Bloque-Jambe', level: 2, data: { niveau: '2', type: 'Sortilège', incantation: 'Locomotor mortis', cible: 'P', effet: 'FE : 10%/30% Permet de coller les jambes d’une personne l’une contre l’autre, ce qui l’empêche de bouger. Sous-type : Maléfice Durée : variable (rounds) Formule extrême : durée variable (heures)' } },
  { name: 'Brouillard', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Nebulus', cible: '', effet: 'FE : 10%/20% Fait sortir du brouillard par l’extrémité de la baguette permettant de se camoufler. Zone : Ce brouillard se répand sur POUx2 mètres de rayon. Durée : Variable (heures). Effets : Observation = PERceptionx2 Formule extrême : Zone : POUx3 mètres de rayon. Durée : Variable (heures +2). Effets : Observation = PERceptionx1' } },
  { name: 'Changement de couleur', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Colovaria', cible: 'A/O P/V', effet: 'Permet de changer la couleur d’un objet, d’un animal, d’une plante ou même de certaines parties du corps d’un sorcier. Durée : POU/2 heures Formule extrême : -' } },
  { name: 'Charmer', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Delecto', cible: 'P', effet: 'FE : 10%/30% Charme une cible et la rend amoureuse de soi durant 1d6+1 rounds. Le sort ne peut plus être lancé pendant une période équivalente à celle passée sous le charme. (Opposition : APP/POU) Formule extrême : durée 2d6+2' } },
  { name: 'Cherche propriétaire', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Avensegium', cible: 'O', effet: 'Lancé sur un objet, ce sortilège permet de retrouver son propriétaire. L\'objet visé par le sort indique alors la direction du propriétaire comme l\'aiguille d\'une boussole, puis se déplace dans sa direction jusqu\'à sa destination. Durée : - Formule extrême : -' } },
  { name: 'Cheveux drus', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'X', cible: 'P', effet: 'FE : 10%/30% Permet de faire pousser les cheveux de manière disproportionnée, gênant la vue de la cible. Jet d’observation = PERx2 (au lieu de PERx5). Durée : permanente Formule extrême : Cheveux et poils poussent pour gêner le sorcier. Jet d’observation PERx1 et malus de 10% aux actions de déplacement' } },
  { name: 'Colle', level: 2, data: { niveau: '2', type: 'Sortilège', incantation: 'Agglutino', cible: 'P/A', effet: 'FE : 10%/30% Colle les pieds d’une personne ou les pattes d’un animal au sol. Ceux- ci doivent réussir un jet de FORx3 pour se libérer. Durée : Variable (heures). Formule extrême : FORx4 et durée +1 heure' } },
  { name: 'Conjonctivite', level: 2, data: { niveau: '2', type: 'Sortilège', incantation: 'Conjonctivitis', cible: 'A/P', effet: 'La cible voit ses yeux se couvrir de croûtes et devenir rouges. Effets : Jet de PERception (vue) = PERx1 au lieu de PERx5. Remarque : Particulièrement efficace sur les dragons. Sous-type : Maléfice Durée : - Soins : Antidote : potion Oculus Formule extrême : -' } },
  { name: 'Couleurs d’encre clignotantes', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Permet de faire changer de couleur l’encre. Le changement de couleur peut être aléatoire ou défini en fonction de la volonté de l’utilisateur. Il peut également s’agir d’un changement unique (noir vers bleu) par exemple, ou d’un changement continu de couleurs (noir vers rouge, vers bleu, vers jaune, vers noir et ainsi de suite) Durée : Permanent ou - Remarque : Cet enchantement est utilisé pour enchanter l’encre multicolore vendue en magasin. Formule extrême : -' } },
  { name: 'Couleur des cheveux', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'Crinus Muto', cible: 'P', effet: 'Permet de changer la couleur des cheveux d’une personne Durée : Permanente Formule extrême : -' } },
  { name: 'Coupe-Griffes', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'X', cible: 'A', effet: 'Permet de couper les griffes d’une créature magique ou non. Durée : permanente Formule extrême : -' } },
  { name: 'Création mineure', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'X', cible: 'X', effet: 'Permet de créer un peu de matière inerte, des objets simples sans parties mobiles ou des flammes. Durée : permanente Formule extrême : -' } },
  { name: 'Cuisant', level: 2, data: { niveau: '2', type: 'Sortilège', incantation: 'X', cible: 'P', effet: 'FE : 10%/30% Ce maléfice provoque une douleur cuisante et gonfle le visage de la cible pour le rendre méconnaissable. Effet : APP-5. Durée : Variable (heures) Formule extrême : APParence -6 et durée +1 heure' } },
  { name: 'Danse endiablée', level: 2, data: { niveau: '2', type: 'Sortilège', incantation: 'Tarentallegra', cible: 'O/P', effet: 'FE : 15%/45% Fait danser de manière incontrôlable ce qui donne un malus de 40 % à toutes les actions, à l’exception de la magie qui a un malus de 20%. Durée : 1d4+2 rounds. Formule extrême : 50% de malus aux actions, magie -30% et durée +1 round' } },
  { name: 'Décélération', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Aresto Momentum', cible: 'A/O P/V', effet: 'Diminue grandement la vitesse de chute d’un animal, d’un objet, d’une personne ou d’un végétal. Celui-ci ne subit alors plus que 1d3-1 dégâts (minimum 1). Durée : - Formule extrême : -' } },
  { name: 'Déplacement', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Mobili « nom »', cible: 'A/O P/V', effet: 'FE : 20%/45% Permet de déplacer un objet ou une personne inconsciente par télékinésie. Maximum : POU x 5 kg. Durée : volontaire Formule extrême : POU x10 kg' } },
  { name: 'Désarmement', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Expelliarmus', cible: 'P', effet: 'Fait sauter la baguette ou d’autres objets des mains de l’adversaire (Opposition : POU/POU). Durée : - Formule extrême : -' } },
  { name: 'Descente', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Descendo', cible: 'O', effet: 'Un sort permettant de faire descendre ou tomber un ou plusieurs objets. Durée : - Formule extrême : -' } },
  { name: 'Discrétion', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Sonus evanesco', cible: 'A/P', effet: 'FE : 15%/45% Diminue considérablement les sons émis par une personne. Effet : donne un bonus de 30 % à la discrétion. Durée : 1d4+2 heures Formule extrême : +40% à la Discrétion et durée +1 heure' } },
  { name: 'Durcissement', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Duro', cible: 'O', effet: 'FE : 5%/25% Change les petits objets en pierre Maximum 5dm3. Durée : 1d6+2 heures Formule extrême : 10dm3 et durée +1 heure' } },
  { name: 'Ectoplasmus', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Ectoplasmus', cible: 'A/P', effet: 'FE : 10% / 30% Ce sortilège peut servir à nettoyer les ectoplasmes et est nocif envers les esprits ainsi que contre les esprits frappeurs Effet : cause 1d4+1 points de dégâts aux points d’existence d\'un Esprit ou d\'un Non-Être Formule extrême : Cause 1d4+3 dégâts' } },
  { name: 'Élasticité', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'Elasticum', cible: 'P', effet: 'FE : 15%/35% Effet principal : Rend les membres élastiques ce qui leurs permet de s’allonger d’un mètre de long Effet secondaire : Diminue la FORce de 1 point Durée : 1 heure Formule extrême : Allongement = 2 mètres / Malus en FORce = 2 / durée = 2 heures. 2 Empiffrement / Engorgement / Gavage E Amplificatum/ Engorgio A/O V FC : 15% FE : 5%/25% Fait grandir un objet, un animal ou une plante et doublant sa taille durant 1d4+2 heures. Les effets du sort se dissipent ensuite d’eux- mêmes ou peuvent être dissipés par une contre-incantation. (POU/POU). Durée : 1d4+2 heures. Contre-sort : le contre-sort pour annuler l’amplification est le sortilège de ratatinage Formule extrême : +2 heures et taille triplée' } },
  { name: 'Empoigne', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Permet d’ensorceler un objet afin que celui-ci soit plus facile à tenir. Durée : permanente. Formule extrême : -' } },
  { name: 'Entrave', level: 2, data: { niveau: '2', type: 'Sortilège', incantation: 'Impedimenta', cible: 'A/O P/V', effet: 'FE : 10%/30% Ralentit une personne, un animal ou un objet et l\'empêche d\'approcher. Effet : Mouvement = 1 et action = 3 rounds. Durée : 1d4+1 rounds Formule extrême : Action = 4 rounds et durée +2 rounds' } },
  { name: 'Epoximise', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'Epoximise', cible: 'O', effet: 'FE : 10%/30% Rend un objet extrêmement collant, obligeant la cible à user d’un sortilège ou de force pour s’en défaire. (Opposition : FORx2). Durée : permanente Formule extrême : (Opposition : FORx1)' } },
  { name: 'Équilibre', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Equilibrium', cible: 'P', effet: 'FE : 15%/45% Empêche le personnage d’être déséquilibré. Donne un bonus de 50% en Athlétisme pour escalader et 40% en acrobatie. Durée : 1d4+1 heures. Formule extrême : Bonus octroyés 60% en Athlétisme et 50% en Acrobatie et durée +1 heure' } },
  { name: 'Étincelles blanches', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Baubillious', cible: 'A/O P/V', effet: 'FE : 20%/30% Projette des étincelles blanches sur un adversaire, lui occasionnant 1 dégât non létal. (Opposition : POU/POU). Durée : - Formule extrême : 2 dégâts non létaux occasionnés' } },
  { name: 'Ficelage', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'Fulgaris', cible: 'P', effet: 'FE : 0%/20% Contrairement au Sort de ligotage, le sortilège de ficelage ne bloque que les mains ou les poignets de la cible grâce à des liens dorés. Pour se libérer, la cible doit réussir un jet en opposition (POU/DEX). Durée : permanente Formule extrême : le jet de DEX pour se libérer se fait avec un malus de' } },
  { name: 'Filet argenté / Corde argentée', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'X', cible: 'A/P', effet: 'Lance un filet ou une corde argenté(e) en direction de la cible. Celle-ci peut effectuer un jet de DEXx4 pour éviter l\'objet. Si le jet est manqué, un nouveau jet de DEXx3 peut être tenté chaque round pour s’échapper. Durée : Variable (rounds) Formule extrême : -' } },
  { name: 'Flammes bleues', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Créer une petite flamme bleue qui possède la capacité d’être transportable et de pouvoir brûler même dans des endroits humides. Ce feu peut brûler, mais moins qu’un feu classique, et est résistant à l’eau. Durée : POU heures' } },
  { name: 'Flammes en main', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'X', cible: 'P', effet: 'Génère une boule de feu tenant dans la main du Sorcier sans le brûler. Durée : volontaire Formule extrême : -' } },
  { name: 'Fouet', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'X', cible: 'A/O P/V', effet: 'Change le bout de sa baguette en fouet, qui peut être employé comme tel pour attaque quelqu’un, se saisir d’un objet, etc. Durée : - Formule extrême : -' } },
  { name: 'Fourrure', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'X', cible: 'P', effet: 'Couvre la cible de fourrure Durée : POU heures' } },
  { name: 'Freinage', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Enchante les balais pour les aider à freiner. Plus le sortilège est maîtrisé et plus le balai freine avec efficacité. Effets : octroie un bonus en vol en balai allant de 1 à 5% quand le balais est utilisé Durée : Permanente. Formule extrême : -' } },
  { name: 'Grande-Tête', level: 2, data: { niveau: '2', type: 'Sortilège', incantation: 'Caput augmento', cible: 'A/P', effet: 'FE : 10%/30% Effet : Double la taille et le poids de la tête de la cible, occasionnant un malus de 15% à toutes les actions physiques et de 1 en APParence Sous-type : Maléfice Durée : 1d4+2 heures Remarque : L’effet peut être dissipé avec un philtre dégonflant Formule extrême : Taille et poids x2,5 / Malus = 20% et -2 en Apparence / Durée 2d4+2 heures' } },
  { name: 'Gicle-pus', level: 2, data: { niveau: '2', type: 'Sortilège', incantation: 'X', cible: 'P', effet: 'Provoque de fortes sécrétions de pus depuis le nez de la victime Effets : APParence -1 ; Odorat = PERceptionx1 Durée : 1d4-1 heure(s) Formule extrême : -' } },
  { name: 'Huile glissante', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Scandere', cible: 'O', effet: 'FE : 15%/35% Recouvre une surface d’huile glissante. Jet de DEXtérité x2 pour se déplacer dessus. Durée : variable (heures) Formule extrême : DEXtérité x1 pour se déplacer' } },
  { name: 'Illisibilité', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'Illegibilus', cible: 'O', effet: 'Rend un texte illisible. Peut être levé par un sortilège Finite Incantatem. Durée : - Formule extrême : -' } },
  { name: 'Inversion', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'X', cible: 'O', effet: 'FE : 10%/30% Inverse la position de deux objets sur une distance maximale de POUx2 mètres. Durée : - Formule extrême : distance maximale de POUvoir x3 mètres' } },
  { name: 'Langue de Plomb', level: 2, data: { niveau: '2', type: 'Sortilège', incantation: 'Mimble Wimble / Mutismus', cible: 'A/P', effet: 'FE : 15%/45% Empêche la cible de parler en faisant des nœuds avec sa langue et inflige un malus de 80% à la magie. Remarque : Ce sortilège possède deux incantations Sous-type : Maléfice Durée : 1d4+1 rounds. Formule extrême : durée +2 rounds' } },
  { name: 'Libération', level: 2, data: { niveau: '2', type: 'Sortilège', incantation: 'Lashlabask', cible: 'A/P', effet: 'Ce maléfice sert à faire lâcher prise ou à ouvrir des liens, magiques ou non. Durée : - Formule extrême : -' } },
  { name: 'Ligotage', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'Incarcerem', cible: 'A/P', effet: 'FE : 5%/25% Ligote la cible en faisant apparaître des cordes magiques qui l’emprisonnent fermement. Pour se libérer, la cible doit réussir un jet en opposition (POU/DEX). Durée : permanente Formule extrême : le jet de DEX pour se libérer se fait avec un malus de' } },
  { name: 'Locomotion', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Locomotor', cible: 'O', effet: 'Permet de faire déplacer des objets. Durée : Variable (rounds) Formule extrême : -' } },
  { name: 'Lumières de détresse', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Periculum', cible: 'X', effet: 'FE : 0%/15% Projette en l’air des étincelles rouges qui restent suspendues pour signaler sa position lorsqu’on est en danger. Durée : variable (rounds) Formule extrême : durée variable (minutes)' } },
  { name: 'Maintien', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Permet de maintenir en place un objet, le rendant plus difficile à déplacer ou détruire (augmente la difficulté de 1 unité FORx3àFORx2 par exemple) Durée : permanente Formule extrême : -' } },
  { name: 'Maléfice de Melofors', level: 2, data: { niveau: '2', type: 'Sortilège', incantation: 'Melofors', cible: 'P', effet: 'Ce maléfice enferme la tête de la cible dans une citrouille, l’empêchant de voir ce qu’il se passe autour de lui. La citrouille ne peut que difficilement être retirée et doit être brisée pour ce faire. Pour les personnes alentours, ce maléfice donne l’impression que la tête de la cible a été métamorphosée en citrouille. Effet : Aveugle la cible Sous-type : Maléfice Opposition : Jet de FORce x1 pour briser la citrouille et la retirer, ou anti-maléfice pour la dissiper Durée : Permanente Formule extrême : -' } },
  { name: 'Montage', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Erigo', cible: 'O', effet: 'Permet de monter une structure en pièce détachée comme une tente ou un échafaudage Durée : - Formule extrême : -' } },
  { name: 'Objet en plume', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'Scribblifors', cible: 'O', effet: 'Métamorphose un objet en plume Durée : permanente Formule extrême : -' } },
  { name: 'Objet en Prison', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'Incarcifos', cible: 'O', effet: 'Transforme un objet en prison de même taille. Durée : permanente Formule extrême : -' } },
  { name: 'Oblitération', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'X', cible: 'X', effet: 'Permet d’effacer les empreintes de pas sur le sol ainsi que les taches (comme les taches d’eau ou de sang, par exemple) Durée : - Portée : POUvoir mètres Formule extrême : -' } },
  { name: 'Ouvre-Caisse', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Cistem Aperio', cible: 'O', effet: 'Il s’agit d’une incantation utilisée pour ouvrir des malles, des coffres, des boîtes ou d’autres récipients en faisant violemment sauter leur couvercle ou leur(s) porte(s). Durée : - Formule extrême : -' } },
  { name: 'Parole', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Permet de faire prononcer des phrases prédéterminées à un objet. Lorsqu’il dure trop longtemps, le sortilège finit par ne lancer plus que des mots isolés, de plus en plus rapprochés et de plus en plus aigus. Durée : POUx3 minutes' } },
  { name: 'Poids-plume', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Permet de rendre un objet aussi léger qu’une plume. Durée : POU heures' } },
  { name: 'Porte-voix', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Sonorus/ Sourdinam', cible: 'P', effet: 'Permet d’augmenter le volume de la voix d’une personne de façon très importante. Sourdinam permet de reprendre sa voix normale. Durée : volontaire Formule extrême : -' } },
  { name: 'Ratatinage', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Reducio', cible: 'A/O V', effet: 'FE : 5%/25% Fait rétrécir un objet, un animal ou une plante en divisant sa taille par 2 durant 1d4+2 heures. Les effets du sort se dissipent ensuite d’eux- mêmes ou peuvent être dissipés par une contre-incantation. (POU/POU). Durée : 1d4+2 heures. Contre-sort : le contre-sort pour annuler le ratatinage de l’objet ou l’animal est le sortilège d’engorgement Formule extrême : +2 heures et taille divisée par' } },
  { name: 'Renversement', level: 2, data: { niveau: '2', type: 'Sortilège', incantation: 'Everte Statum', cible: 'A/P', effet: 'FE : 15%/35% Fait violemment trébucher la cible immobile en l’envoyant voler à une dizaine de mètres en arrière. Cause 1 point de dégât à la cible si elle ne réussit pas un jet de DEXx3. Durée : - Formule extrême : Cause 2 dégâts et repousse à 15 mètres.' } },
  { name: 'Repousse créature', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: '« Nom » Exumai', cible: 'A', effet: 'FE : 5%/25% Repousse instantanément un animal magique ou non le plus loin possible du sorcier. (Opposition : POU/FOR). Maximum : POU x 5 m. Durée : - Formule extrême : Maximum POUvoir x7 mètres' } },
  { name: 'Repoustout', level: 2, data: { niveau: '2', type: 'Sortilège', incantation: 'flipendo', cible: 'A/O P/V', effet: 'FE : 15%/35% Repousse la cible en arrière, lui causant 2 dégâts non létaux. Peut également être utilisé pour repousser de lourds objets (jusqu’à POUvoirx2 Kg). Ce sortilège émet un son semblable à une poêle frappant quelque chose quand il est lancé. Durée : - Formule extrême : Occasionne 3 dégâts non-létaux ; jusqu’à POUvoir x' } },
  { name: 'Répulsion (Niv 2)', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Repulso', cible: 'O', effet: 'FE : 5%/25% Repousse un objet le plus loin possible du sorcier (Opposition : POU/FOR). Maximum : POU x 5 m. Durée : - Formule extrême : Maximum POUvoir x7 mètres' } },
  { name: 'Riddikulus', level: 2, data: { niveau: '2', type: 'Sortilège', incantation: 'Riddikulus', cible: 'P', effet: 'Rend un épouvantard ridicule aux yeux de celui qui en avait peur à l\'origine, ce qui le rend inoffensif. (POU/POU). Durée : - Formule extrême : -' } },
  { name: 'Sortilège de planage', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: '-', cible: 'O', effet: 'Fait léviter un objet au-dessus du sol pendant POUvoir secondes. Le Sorcier peut donner une trajectoire en ligne droite à l’objet en lévitation, qui la suivra le temps de fonctionnement de celui-ci Durée : POUvoir secondes Formule extrême : -' } },
  { name: 'Spirale de vent', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'Ventus', cible: 'A/O P/V', effet: 'FE : 10%/25% Provoque une rafale de vent violente en spirale qui repousse le sorcier, l’objet ou l’animal visé. (Opposition : POU/FOR). Durée : Variable (rounds). Effets : Déplacements divisés par 2. Formule extrême : Durée : Variable (round)+1. Effets : déplacements =' } },
  { name: 'Spongification', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'Spongifie', cible: 'O', effet: 'Effet : Permet de transformer sa cible en une substance gélatineuse aux propriétés rebondissantes Durée : Permanente Formule extrême : -' } },
  { name: 'Surdité', level: 2, data: { niveau: '2', type: 'Sortilège', incantation: 'Assurdiato', cible: 'P', effet: 'FE : 10%/30% Provoque un bourdonnement désagréable dans les oreilles de la cible, ce qui l’empêche d’entendre correctement ; malus de 50% en perception pour l’écoute. Durée : 1d4 heures. Opposition : POU/POU Formule extrême : Malus de 60% et durée +1 heure' } },
  { name: 'Têtenbulle', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'X', cible: 'A/P', effet: 'FE : 0%/20% Permet de créer une bulle d’air pur autour de sa tête, permettant de respirer sous l’eau durant 1d4+1 heures ou de ne pas être incommodé par de mauvaises odeurs. Durée : 1d4+1 heures Formule extrême : Durée +1 heure' } },
  { name: 'Tortue en tasse à thé', level: 2, data: { niveau: '2', type: 'Métamorphose', incantation: 'X', cible: 'A', effet: 'Métamorphose une tortue en tasse à thé Durée : permanente Formule extrême : -' } },
  { name: 'Videntraille', level: 2, data: { niveau: '2', type: 'Sortilège', incantation: 'Laxativus', cible: 'A/P', effet: 'Oblige la cible à aller se soulager pour vider ses intestins le plus rapidement possible. POUxCON Sous-type : Maléfice Formule extrême : -' } },
  { name: 'Virage', level: 2, data: { niveau: '2', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Enchante les balais pour les aider à virer plus facilement. Plus le sortilège est maîtrisé et plus le balai vire avec efficacité. Effets : octroie un bonus en vol en balai allant de 1 à 5% quand le balais est utilisé Durée : Permanente. Formule extrême : -' } },
  { name: 'Agrandissement', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'FE : 20%/40% Agrandit la taille de la cible jusqu’à ce qu’elle mesure deux fois sa taille. Durée : POU minutes Formule extrême : Agrandit la taille de la cible jusqu’à trois fois sa taille pour une durée de POUx 2 minutes.' } },
  { name: 'Allégresse', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Felicitas', cible: 'P', effet: 'FE : 10%/35% Met une personne dans un état de bonheur intense où elle ne peut pas s’inquiéter durant 1d4+1 heures. (Opposition POU/POU) Formule extrême : Durée +2 heures' } },
  { name: 'Animal en verre', level: 3, data: { niveau: '3', type: 'Métamorphose', incantation: 'Vera Verto', cible: 'A', effet: 'Métamorphose un animal en verre Durée : Permanente Formule extrême : -' } },
  { name: 'Anti-hoquet', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'X', cible: 'A/P', effet: 'Permet de contrer les effets d’un sortilège de hoquet ou d’un hoquet classique. Durée : - Formule extrême : -' } },
  { name: 'Anti-maléfice de Crache-Limaces', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Crache-Limaces Formule extrême : -' } },
  { name: 'Anti-maléfice de Crottes-de-nez', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Crottes-de-nez Formule extrême : -' } },
  { name: 'Anti-maléfice de Furoncles', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Furoncles Formule extrême : -' } },
  { name: 'Anti-maléfice de Gemino', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Gemino Formule extrême : -' } },
  { name: 'Anti-maléfice de Jambespongieuses', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Jambespongieuses Formule extrême : -' } },
  { name: 'Anti-Maléfice de la peau en cornflakes', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de la peau en cornflakes Formule extrême : -' } },
  { name: 'Anti-maléfice de Mouche-Sardine', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Mouche-Sardine Formule extrême : -' } },
  { name: 'Anti-maléfice de Saucisson', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Saucisson Formule extrême : -' } },
  { name: 'Anti-triche', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Lancé sur un objet, comme un parchemin ou une plume, cet enchantement empêche celui qui emploie l’objet d’avoir recours à la triche. Durée : 1 jour Formule extrême : -' } },
  { name: 'Blocage', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Immobulus A/O /P', cible: '', effet: 'FE : 30%/50% Immobilise immédiatement jusqu’à POU créatures vivantes et/ou objets en mouvement. Effet secondaire : Permet également d’arrêter les alarmes moldues. Durée : Variable (heures) Formule extrême : POUx2 créatures vivantes/objets en mouvement' } },
  { name: 'Boomerang', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Cateia', cible: 'O', effet: 'Lancé sur un objet, cet enchantement fait que ce dernier revient toujours vers sa position d’origine quand il est lancé, comme un boomerang. La puissance du retour est identique à celle du lancer. Effet : Fait revenir un objet lancé vers le sa position d’origine Durée : Permanente Formule extrême : - Remarque : Cet enchantement est employé sur certains Cognards non- enchantés lors de entraînements de Quidditch' } },
  { name: 'Bouche soudée', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Oscausi', cible: 'A/P', effet: 'FE : 20%/35% Fait disparaître la bouche d’une personne ou d’un animal. La bouche semble alors n\'avoir jamais existé, de la peau la recouvrant. Durée : Variable (heures) Effets : Mutisme Formule extrême : Durée : Variable (heures +2)' } },
  { name: 'Carpe Retractum', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Carpe Retractum', cible: 'O', effet: 'Ce sortilège produit un cordon de lumière magique et rétractable, qui peut être utilisé pour tirer des objets vers le lanceur, ou, si la cible est fixe en place, pour tirer le lanceur vers la cible Portée : POUvoir mètres Durée : Volontaire Remarque : Une fois l’objet saisi, le Sorcier doit faire preuve de FORce pour pouvoir tirer ce dernier, la corde magique ne servant qu’à relier l’objet visé et la baguette du Sorcier. Formule extrême : -' } },
  { name: 'Catapultage', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'X', cible: 'O', effet: 'FE : 0%/20% Lancé sur un objet comme un balai magique par exemple, ce sortilège repousse violemment toute personne qui tente de s’en saisir. Opposition : FORx2. Durée : - Formule extrême : Opposition FORce x1' } },
  { name: 'Chance', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Felixempra', cible: 'A/P', effet: 'Permet d’augmenter la compétence dérivée « Chance » de la cible. Effet : Chance +30% Durée : POUvoir minutes Formule extrême : - Remarque : Cet enchantement est également nécessaire pour terminer la potion Felix Felicis et représente l’ultime étape de sa création.' } },
  { name: 'Chatouillis', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Rictusempera', cible: 'P', effet: 'FE : 20%/40% Fait rire la cible de manière incontrôlée, ce qui lui inflige un malus de 60 % à toute ses actions, y compris le lancement de sorts. Durée : Variable (rounds) Formule extrême : Malus de 70% et durée +2 rounds' } },
  { name: 'Chauve-Furie', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'X', cible: 'A/P', effet: 'FE : 20%/40% Lance POU Chauves-Furies au visage d’un adversaire, qui se voit entravé dans ses mouvements. Les créatures sont capables de griffer et de mordre, mais dès la fin de l’enchantement, toute trace corporelle disparait. Durée : Variable (rounds) Formule extrême : permet de viser 2 adversaires et durée +2 rounds' } },
  { name: 'Contre- Enchantement', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Surgito', cible: 'A/P', effet: 'Surgito est une incantation permettant de contrer les effets d’un enchantement ou d’un envoûtement. Effets : Met immédiatement fin aux effets d’un envoûtement magique ou des effets d’un enchantement. Durée : - Formule extrême : -' } },
  { name: 'Copie illusoire', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'X', cible: 'A/P', effet: 'FE : 10%/30% Quand il est lancé, ce sort copie une personne ou un animal pour en créer une copie conforme mais qui n’est en réalité qu’une illusion. Celle- ci peut être envoyée à une distance maximale de POUvoir x 10 mètres avant de se dissiper. Pour percer cette illusion, un jet de PERception x1 doit être effectué. Durée : variable (heures) Formule extrême : Distance POUvoir x25 mètres' } },
  { name: 'Correcteur de trajectoire', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'FE : - Annule complètement les tremblements naturels de celui qui manie le balai et stabilise les trajectoires. Effets : Octroie un bonus de 10% en vol en balai pour la durée du sortilège. Durée : 1d4+1 heures. Formule extrême : -' } },
  { name: 'Crache-Limace', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Limacius Eructo', cible: 'P', effet: 'FE : 20%/40% Fait vomir des limaces à la cible lui occasionnant un malus de 50% à la magie et inflige des douleurs. Sous-type : Maléfice Durée : 1d6+2 heures. (Jet de CON x3 pour faire un effort). Formule extrême : Malus de 70% à la magie et durée +2 heures' } },
  { name: 'Création d’objets simples', level: 3, data: { niveau: '3', type: 'Métamorphose', incantation: 'X', cible: 'X', effet: 'Permet de créer des objets à partir d’une matière de base. Ces objets peuvent être des objets simples ou des morceaux d’objets plus volumineux (rouages par exemple). Durée : permanente. Remarque : nécessite une bonne connaissance de l’objet à créer car celui-ci doit être visualisé mentalement avant de lancer le sort. Formule extrême : -' } },
  { name: 'Cridurut', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Cridurut', cible: 'X', effet: 'FE : 10%/35% Déclenche une alarme si une personne entre dans la zone d’effet du sortilège. Zone maximale POU mètres de diamètre. Durée : 1 jour Formule extrême : ne retentit que dans l’esprit de ceux qui sont dans la zone protégée' } },
  { name: 'Crottes de nez', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Mucus ad Nauseam', cible: 'A/P', effet: 'FE : 10%/35% Ce sortilège – également connu sous le nom de maléfice du Morveux – fait abondamment couler le nez d’une personne, l’empêchant de respirer par le nez. Effets : impossible d’utiliser PERception (odorat) + malus de 10% pour toute activité liée à l’effort et à la communication. Sous-type : Maléfice Durée : Variable (heures) Formule extrême : Malus de 25% à la magie et durée +2 heures' } },
  { name: 'Découpe', level: 3, data: { niveau: '3', type: 'Métamorphose', incantation: 'Diffindo / Cracbadabum', cible: 'O', effet: 'Sectionne la matière en deux parties. Durée : permanente Formule extrême : -' } },
  { name: 'Déflexion', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Flexus S', cible: '', effet: 'FE : 25%/45% Permet de dévier un sort de niveau 3 ou inférieur sur une autre cible (Opposition : Pou/Pou). Durée : - Formule extrême : permet de dévier un sort de niveau 4 ou inférieur' } },
  { name: 'Désillusion', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'X', cible: 'A/P', effet: 'FE : 35%/60% Permet de cacher une personne ou une créature à la manière d’un caméléon. L’objet du sortilège se confond avec son environnement. Durée : variable (heures) Formule extrême : Durée + 2d4+2 heures' } },
  { name: 'Diminution', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Diminuedo', cible: 'A/O P/V', effet: 'FE : 20%/40% Diminue la taille de la cible jusqu’à ce qu’elle ne mesure plus qu’une trentaine de centimètres. Durée : POU minutes Formule extrême : diminue la taille de la cible jusqu’à 1 centimètre pour une durée de POUx 2 minutes.' } },
  { name: 'Ebublio', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Ebublio', cible: 'A/P', effet: 'Ce maléfice enferme la cible dans une bulle magique. Celle-ci doit réussir un jet de FORx4 pour sortir de cette bulle. Durée : POUvoir rounds Formule extrême : -' } },
  { name: 'Écran de fumée', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Fumos', cible: 'X', effet: 'FE : 20%/40% Fait apparaître un écran de fumée protecteur afin de se dissimuler. Zone : Cette fumée se répand sur POU mètres de rayon. Durée : Variable (minutes). Effets : Observation = PERceptionx1 Effets secondaires : Brûle les yeux et fait tousser ceux qui le respirent, rendant difficile l’effort physique à l’intérieur de la zone. Formule extrême : Zone : POUx2 mètres de rayon. Durée : Variable (minutes +2). Effets : Respirer dans la zone = 1 dégât non-létal' } },
  { name: 'Empreintes', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Appare Vestigium', cible: 'X', effet: 'Permet de faire apparaître les traces du passage d’une personne ou d’un animal, ainsi que les récentes activités magiques. Fait également apparaître une image des personnes, animaux et créatures qui ont croisé la piste. Les traces apparaissent dans le sillage d\'une volute dorée Durée : volontaire Formule extrême : -' } },
  { name: 'Étincelles bleues', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'X', cible: 'A/O P/V', effet: 'FE : 30%/40% Projette des étincelles bleues sur un adversaire, lui occasionnant 1d4 dégâts non létaux. (Opposition : POU/DEX). En grande quantité, ces étincelles peuvent rendre l’atmosphère difficilement respirable et bloquer la vue en créant un brouillard Durée : - Formule extrême : 1d4+1 dégâts non létaux occasionnés' } },
  { name: 'Explosion d’objets', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Bombarda', cible: 'O', effet: 'FE : 10%/30% Détruit un petit objet magique ou non en le faisant exploser. Génère un puissant son d’explosion. Maximum 2dm3 (≈ 1 brique d’un litre de lait) Durée : - Formule extrême : Élimine 10dm3' } },
  { name: 'Explosion de caisse', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Cistem Aperio', cible: '', effet: 'Cistem Aperio est un sort utilisé pour ouvrir des caisses en faisant exploser leur couvercle. Durée : - Formule extrême : -' } },
  { name: 'Flottement', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'X', cible: 'A/O P/V', effet: 'Permet de faire flotter lentement quelque chose dans les airs d’une place à une autre. L’objet flotte alors à environ un à deux mètres du sol. Le sort cesse une fois l’objet arrivé à destination. Durée : - Formule extrême : -' } },
  { name: 'Furoncles', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Furunculus', cible: 'P', effet: 'FE : 10%/35% Répand sur le corps des furoncles et des pustules immondes. Fait perdre 2 points de vie et diminue l’APP de moitié. Les points de vie perdus ne peuvent être regagnés qu’en dissipant le sort et en se reposant. Sous-type : Maléfice Durée : variable (heures) Formule extrême : Perte de 3 p.v. et diminue l’APParence de 3⁄4.' } },
  { name: 'Gemino', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Gemino', cible: 'O', effet: 'Ce sortilège permet de créer une copie parfaite d’un objet. Cette copie n’est cependant parfaite qu’en apparence et ne possède pas les éventuelles propriétés magiques de l’original. Sous-type : Maléfice Durée : permanente Effet secondaire : Ne peut être arrêté que par le lanceur, sans quoi l’objet continu de se dupliquer sans s’arrêter durant 1d4 jour(s). Formule extrême : -' } },
  { name: 'Glacius', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Glacius', cible: 'A/O P', effet: 'FE : 20%/40% Fait apparaître un bloc de glace autour de l’objet ou de la créature visée afin de l’immobiliser. Il peut aussi permettre de geler des surfaces liquides, afin de pouvoir marcher dessus. Durée : 1d6+1 rounds Formule extrême : 1d6+1 heures' } },
  { name: 'Glu-Perpétuelle', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: '-', cible: 'O', effet: 'Permet de garder un objet fixé de sorte que personne ne puisse l’enlever. Durée : permanente Formule extrême : -' } },
  { name: 'Grandes-Dents', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Dentes augmento', cible: 'P', effet: 'FE : 20%/40% Fait pousser les dents de manière démesurée infligeant un malus de 25% pour la magie et fait baisser l’APP de 2. Durée : variable (jours) Formule extrême : Malus de 40% et baisse l’APParence de' } },
  { name: 'Herbivicus', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Herbivicus', cible: 'P', effet: 'Accélère la croissance des plantes et fleurs Durée : Volontaire Remarque : Faire attention à ce que la plante ait suffisamment d’eau et de nourriture afin qu’elle ne meure pas.' } },
  { name: 'Impassibilité', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Impassibilis', cible: 'O', effet: 'Empêche quoi que ce soit de passer à travers l’objet enchanté. Durée : variable (heures) Formule extrême : -' } },
  { name: 'Invisibilité (Animal)', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Animalis evanesco', cible: 'A', effet: 'FE : 20%/40% Un animal devient invisible. PERception x1 pour percer l’invisibilité. Effet : bonus de 60% en discrétion. Durée : 1 jour. Formule extrême : Bonus de 75% en Discrétion' } },
  { name: 'Invisibilité (Objet)', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Objectum evanesco', cible: 'O', effet: 'Un objet devient invisible. PERception x1 pour percer l’invisibilité. Durée : 1 jour. Formule extrême : -' } },
  { name: 'Invisibilité (Plante)', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Vegetus evanesco', cible: 'V', effet: 'Une plante devient invisible. PERception x1 pour percer l’invisibilité. Durée : 1 jour. Formule extrême : -' } },
  { name: 'Lien', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Protéiforme', cible: 'O', effet: 'Lie les objets entre eux de telle sorte que si l’un d’eux est modifié, tous les autres le sont également. Durée : permanent Formule extrême : -' } },
  { name: 'Maléfice de la peau en cornflakes', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Pellis frumentum glebulae', cible: 'P', effet: 'FE : 10%/35% Ce maléfice donne l’impression que la peau de la cible est recouverte de cornflakes, causant de violentes démangeaisons. Effet : Diminue l’APP de 2 et occasionne 1 dégât non-létal. Effet secondaire : Malus de 10% aux actions suite aux démangeaisons Sous-type : Maléfice Durée : Permanente Formule extrême : APP -3, 2 dégâts non-létaux et malus de 15%' } },
  { name: 'Maléfice des Jambespongieuses', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: '-', cible: 'A/P', effet: 'Impose un malus de 50 % à toute action utilisant les jambes et diminue à valeur de déplacement à 1 Sous-type : Maléfice Durée : Permanente Formule extrême : -' } },
  { name: 'Maléfice du saucisson', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Petrificus totalus', cible: 'A/P', effet: 'FE : 20%/40% Immobilise totalement une personne ou un animal en liant ses mains et ses pieds ainsi qu’en lui bloquant la mâchoire. La personne peut cependant toujours voir et entendre ce qu’il se passe. Opposition : POU/POU Sous-type : Maléfice Durée : variable (heures) Formule extrême : Durée : 1d4-1 jours' } },
  { name: 'Mise en place', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Permet de placer un objet à distance. Durée : volontaire Formule extrême : -' } },
  { name: 'Mouche-Sardine', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Sardina Sternuo', cible: 'A/P', effet: 'FE : 20%/40% Fait éternuer des sardines à la cible, lui occasionnant un malus de 40% à la magie et inflige des douleurs. Sous-type : Maléfice Durée : 2d4+2 heures. (Jet de CON x3 pour fournir un effort). Formule extrême : Malus de 60% à la magie et durée +3 heures' } },
  { name: 'Objet en Animal', level: 3, data: { niveau: '3', type: 'Métamorphose', incantation: 'X', cible: 'O', effet: 'Transforme un objet en animal. Durée : permanente Formule extrême : -' } },
  { name: 'Objet en Dragon', level: 3, data: { niveau: '3', type: 'Métamorphose', incantation: 'Draconifors', cible: 'O', effet: 'Transforme un objet en dragon vivant de même taille. Durée : permanente Formule extrême : -' } },
  { name: 'Objet en Lapin', level: 3, data: { niveau: '3', type: 'Métamorphose', incantation: 'Lapifors', cible: 'O', effet: 'Transforme un objet en lapin vivant de même taille. Durée : permanente Formule extrême : -' } },
  { name: 'Objet en poulet/oie', level: 3, data: { niveau: '3', type: 'Métamorphose', incantation: 'Pullus', cible: 'O', effet: 'Métamorphose un objet en poulet ou en oie Durée : - Formule extrême : -' } },
  { name: 'Obscurité', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Obscuro', cible: 'O/P', effet: 'FE : 20%/40% Rend la personne ou l’objet visé noir ou l’empêche de voir. Durée : 1 heure Formule extrême : durée +3 heures' } },
  { name: 'Oscausi', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Oscausi', cible: 'P', effet: 'Scelle la peau de la bouche d’une personne en la recouvrant de peau, la faisant totalement disparaître Effet principal : empêche la cible de parler Durée : permanente Formule extrême : -' } },
  { name: 'Personne en Animal', level: 3, data: { niveau: '3', type: 'Métamorphose', incantation: 'X', cible: 'P', effet: 'Transforme quelqu’un en animal. (Opposition : POU/POU). Durée : permanente Formule extrême : -' } },
  { name: 'Pierre en chien', level: 3, data: { niveau: '3', type: 'Métamorphose', incantation: 'X', cible: 'O', effet: 'Transforme une pierre en chien de même taille Durée : Permanente Formule extrême : -' } },
  { name: 'Pression', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Deprimo', cible: 'O', effet: 'Exerce une forte pression sur une surface jusqu’à ce que celle-ci se creuse ou cède. La durée du sortilège dépend de la résistance des objets : POU/FOR. Durée : Volontaire Formule extrême : -' } },
  { name: 'Remplissage', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Permet de remplir un contenant avec le contenu liquide qui le remplissait auparavant. Formule extrême : -' } },
  { name: 'Repousse-Fantômes', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Repello Umbrae F', cible: '', effet: 'FE : 40%/70% Empêche les fantômes de pénétrer dans la zone enchantée par ce sort (Opposition : POU/POU). Durée : 1 jour Formule extrême : Durée +1 jour' } },
  { name: 'Repousse-Moldus', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Repello Moldum', cible: 'P', effet: 'FE : 30%/50% Empêche les moldus de pénétrer dans la zone enchantée par ce sort. Durée : 1 jour Formule extrême : durée +1 jour' } },
  { name: 'Repoussement', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Repello + « nom »', cible: 'A/O P/V', effet: 'FE : 30%/50% Empêche un animal, une plante, un type d’objet ou une personne de pénétrer dans la zone enchantée par ce sort. Durée : 1 jour Formule extrême : durée +1 jour' } },
  { name: 'Répulsion (Niv 3)', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Depulso', cible: 'A/O P/V', effet: 'FE : 25%/45% Repousse violemment toutes les cibles se trouvant devant la baguette du lanceur. Portée : 9 mètres Effet : Sur des êtres vivants, ce sort cause 3 dégâts non létaux. Peut également être utilisé pour repousser de lourds objets (jusqu’à POUvoirx3 Kg). Durée : - Formule extrême : Occasionne 4 dégâts non-létaux ; jusqu’à POUvoir x' } },
  { name: 'Réveil', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Enervatum', cible: 'P', effet: 'Réveille toute personne endormie, par magie ou non, et toute personne touchée par le sort de Stupéfixion. Durée : - Formule extrême : -' } },
  { name: 'Réversion', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Reverte', cible: 'O', effet: 'Ce sortilège permet de ramener un objet dans sa position ou son état d\'origine. Peut faire bouger l’objet ou le réparer. Durée : - Formule extrême : -' } },
  { name: 'Révélation du PH', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Alkalacidium Revelio', cible: 'V', effet: 'Permet de déterminer l’acidité ou l’alcalinité du sol Durée : Volontaire Formule extrême : -' } },
  { name: 'Rocket', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Envoie un objet voler dans les airs à POUvoir mètres de haut à très grande vitesse Durée : - Formule extrême : -' } },
  { name: 'Scellement de parchemin', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Scelle un parchemin magiquement d’un coup de baguette. Celui-ci ne peut alors être lu que si on lui donne un nouveau coup de baguette. Durée : Permanent Formule extrême : -' } },
  { name: 'Scellement de pièce', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Scelle une pièce magiquement d’un coup de baguette. Celle-ci ne peut dès lors plus être ouverte autrement qu’en levant le sortilège. Durée : Permanent Formule extrême : -' } },
  { name: 'Soins', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Episkey', cible: 'A/P', effet: 'FE : 25%/45% Redonne 1d4+1 points de vie à une personne blessée et ressoude les os après les avoir remis en place. Une fois lancé, ce sortilège ne peut plus faire effet sur cette blessure. Durée : - Formule extrême : Redonne 1d4+2 points de vie' } },
  { name: 'Somnambulisme', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'X', cible: 'A/P', effet: 'Oblige une personne endormie à se déplacer pendant son sommeil (qu’il soit magique ou non) Durée : POUvoir minutes Formule extrême : -' } },
  { name: 'Sort du tireur de flèche', level: 3, data: { niveau: '3', type: 'Métamorphose', incantation: 'Sagita lorem', cible: 'A/P', effet: 'Conjure une flèche partant de la baguette du lanceur. Populaire parmi les supporters des Flèches d’Appleby mais interdit lors de manifestation de Quidditch. (Opposition : POUxDEX) Effet : Perte de 1d4-1 points de vie. Formule extrême : -' } },
  { name: 'Sortilège de roquette', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: '-', cible: 'O', effet: 'Propulse un objet à POUvoir mètres de haut dans les airs. Durée : - Formule extrême : -' } },
  { name: 'Stupéfixion', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'Stupefix', cible: 'A/P', effet: 'FE : 30%/50% Paralyse la cible et la met dans un état de catatonie proche du coma. Durée : 2d4+2 heures Formule extrême : 1 jour' } },
  { name: 'Terrassement', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Defodio', cible: 'X', effet: 'Ce sort permet de creuser de profondes entailles sur une surface. Durée : - Formule extrême : -' } },
  { name: 'Toboggan', level: 3, data: { niveau: '3', type: 'Métamorphose', incantation: 'Glisseo', cible: 'O', effet: 'Transforme un escalier en toboggan. Durée : Variable (heures) Formule extrême : -' } },
  { name: 'Urticaire', level: 3, data: { niveau: '3', type: 'Sortilège', incantation: 'X', cible: 'P', effet: 'Provoque de violente crises d’urticaire sur tout le corps de la cible. Effets : Dégâts 1d4-2 ; CHA-2 Durée : -' } },
  { name: 'Waddiwasi', level: 3, data: { niveau: '3', type: 'Enchantement', incantation: 'Waddiwasi', cible: 'O', effet: 'Permet d\'envoyer un objet à un endroit à la vitesse d\'une balle de fusil, peut détruire l’objet ou l’endommager. Durée : - Formule extrême : -' } },
  { name: 'Alarme', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'Cave Inimicum', cible: 'X', effet: 'Créer une bulle englobant le lanceur et les personnes proches (POU mètres) qui permet de se protéger contre des ennemis. Ceux qui sont de l’autre côté du bouclier ne pourront pas voir les personnes dans la bulle, les entendre. La bulle prend fin quand on jette un sort depuis l’intérieur Durée : POU heures Formule extrême : Empêche également d’être senti.' } },
  { name: 'Anti-brume dorée', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'X', cible: 'X', effet: 'Dissipe instantanément l’enchantement de brume dorée.' } },
  { name: 'Anti-maléfice de Cerveau-en-gelée', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Cerveau-en-gelée Formule extrême : -' } },
  { name: 'Anti-maléfice du rire', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice du rire Formule extrême : -' } },
  { name: 'Anti-scellement de pièce', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'X', cible: 'X', effet: 'Dissipe instantanément l’enchantement de scellement de pièce.' } },
  { name: 'Antivol', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Lancé sur un objet, cet enchantement empêche celui-ci d’être volé. Effet : Empêche tout autre Sorcier que le lanceur d’utiliser le sortilège d’attraction sur la cible du sort. Durée : POU jours Formule extrême : -' } },
  { name: 'Attaque', level: 4, data: { niveau: '4', type: 'Sortilège', incantation: 'Oppugno', cible: 'A/O', effet: 'Oblige des objets ou des animaux à attaquer une cible et à lui causer des dégâts. Occasionne 1d4 dégâts à une cible. DEXx3 pour 1⁄2 dégâts. (Minimum 1). Durée : - Formule extrême : -' } },
  { name: 'Attraction', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'Accio + « nom »', cible: 'O', effet: 'FE : 25%/45% Permet de faire venir un objet à soi. Opposition : POU/FOR. Maximum : POU x 10 m. Durée : - Remarque : De nombreux objets et lieux ont été protégés de ce sortilège. Formule extrême : maximum POUvoir x 15 mètres' } },
  { name: 'Beauté', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'X', cible: 'A/P', effet: 'Cet enchantement permet d’ajouter temporairement 1d6 points à la caractéristique charisme de la cible Durée : 1d4+1 heures. Formule extrême : -' } },
  { name: 'Brume dorée', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'X', cible: 'X', effet: 'La brume dorée perturbe celui qui va dedans en lui donnant l’impression d’être suspendu la tête en bas. Effet : Pour se déplacer, le personnage doit effectuer un jet d’équilibre (DEXx3) pour ne pas tomber au sol. Effet secondaire : Les actions d’orientation ou nécessitant de déplacer des objets magiquement se font avec un malus de 15% supplémentaire Durée : Permanente Formule extrême : -' } },
  { name: 'Charme défensif', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'X', cible: 'A/P', effet: 'FE : 35%/55% Protège le lanceur des dégâts occasionnés en déviant légèrement les objets lancés dans sa direction. Effet : Fonctionne comme une armure en réduisant les 2 premiers dégâts normaux reçus (létaux ou non). Durée : POU minutes Formule extrême : réduit les 3 premiers dégâts reçus' } },
  { name: 'Confusion', level: 4, data: { niveau: '4', type: 'Sortilège', incantation: 'Confundo', cible: 'A/O P', effet: 'FE : 35%/55% Plonge la cible dans la confusion, Effet principal : occasionne un malus de 50% à toutes les actions nécessitant de la réflexion, y compris la magie Effet secondaire : Rend plus sensible aux suggestions Durée : Variable (minutes) Opposition : POUxPOU Formule extrême : Malus de 70%' } },
  { name: 'Création d’animaux', level: 4, data: { niveau: '4', type: 'Métamorphose', incantation: 'Animalis creatio', cible: 'X', effet: 'Créer de petits animaux normaux. Durée : permanente Formule extrême : -' } },
  { name: 'Création d’objets complexes', level: 4, data: { niveau: '4', type: 'Métamorphose', incantation: 'X', cible: 'O', effet: 'Permet de créer des objets complexes à partir d’une matière de base. Durée : permanente. Remarque : nécessite une excellente connaissance de l’objet à créer et de ses caractéristiques internes car celui-ci doit être visualisé mentalement avant de lancer le sort. Formule extrême : -' } },
  { name: 'Destruction', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'Destructum', cible: 'O/X', effet: 'Sortilège permettant d\'effacer les effets d\'un autre sortilège et de détruire certains objets convoqués magiquement. Remarque : le sortilège de destruction appartient à la sous-catégorie des contre-sorts. Durée : - Formule extrême : -' } },
  { name: 'Détection', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'Hominium revelo', cible: 'X', effet: 'FE : 30%/50% Révèle la présence de toutes personnes vivantes dans la zone du sort. Zone : POUx2 mètres de diamètre. Durée : - Formule extrême : Zone : POUx5 mètres' } },
  { name: 'Emprisonnement', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: '« Nom » Incarcerare', cible: 'A/P', effet: 'Ce sortilège emprisonne la cible dans une surface solide lisse (tableau, mur, sol, etc.), la faisant apparaître en transparence sur celle-ci. L’incantation ajout le nom de la cible dans laquelle sera enfermer le sorcier (Muros pour mur, Solum pour sol, Tabula pour tableau, etc.) Effet : La cible est emprisonnée dans une surface, incapable d’agir avec le monde extérieur Durée : Permanente Contre sort : En brisant la surface ou en la fissurant, la personne est libérée. Formule extrême : -' } },
  { name: 'Faux-Souvenir', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'X', cible: 'P', effet: 'Ce sortilège permet de modifier, voir même d’ajouter de faux souvenirs dans la mémoire d’une personne. Durée : permanente Formule extrême : -' } },
  { name: 'Fidelitas', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'Fidelitas', cible: 'P', effet: 'Permet de cacher un secret au cœur d\'une personne connue sous le nom de Gardien du Secret. Il est alors le seul à pouvoir divulguer ce secret. Durée : permanente Formule extrême : -' } },
  { name: 'Gel', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'X', cible: 'A/P', effet: 'Permet de créer une plaque de glace au sol d’environ 1 mètre de diamètre. Quand un être vivant touche celle-ci, la glace se déploie pour lui emprisonner les jambes ou les pattes. Pour se libérer, la cible doit réussir un jet de FOR x3. Effet : Occasionne 2 dégâts non létaux Durée : Permanente' } },
  { name: 'Gèle-Flamme', level: 4, data: { niveau: '4', type: 'Métamorphose', incantation: 'X', cible: 'O', effet: 'Rend les flammes visées inoffensives. Durée : variable (jours) Formule extrême : -' } },
  { name: 'Grande Explosion d’objets', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'Explodere', cible: 'O', effet: 'FE : 30%/50% Détruit un objet magique ou non de grande taille (comme un mur par exemple) en le faisant exploser. Produit un gigantesque son d’explosion. Maximum 1m3 Durée : - Formule extrême : Maximum : 10m3' } },
  { name: 'Grandeur', level: 4, data: { niveau: '4', type: 'Sortilège', incantation: 'Magistratus', cible: 'X', effet: 'FE : 30%/50% Le lanceur s’entoure d’une aura de grandeur qui fait que les personnes alentours ont du mal à le regarder dans les yeux sans ressentir de la peur ou de l’attirance devant sa personne. Opposition : POU/POU. Durée : 1d10+2 heures Formule extrême : Durée +1d4+1 heures' } },
  { name: 'Humanité', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'Homomorphus', cible: 'P', effet: 'Rend sa forme humaine à un garou, un animagus ou à un humain métamorphosé (Opposition : POU/POU). Durée : - Formule extrême : -' } },
  { name: 'Incassable', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Rend un objet incassable Durée : POU heures Formule extrême : -' } },
  { name: 'Lévitation de corps (Niv 4)', level: 4, data: { niveau: '4', type: 'Sortilège', incantation: 'Levicorpus/ Liberacorpus', cible: 'P', effet: 'Accroche la cheville de la victime en l’air retournant la personne d’une façon peu confortable. (Uniquement informulé). Durée : volontaire Formule extrême : -' } },
  { name: 'Lumière solaire', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'Lumos Solem', cible: 'X', effet: 'FE : 30%/50% Fait jaillir un faisceau de lumière intense de la baguette sous la forme d’un arc de cercle sur une longueur de : POUvoir x2 mètres. Cette lumière éblouit la cible durant 1 round. Celle-ci subit alors un malus de 50% à toutes les actions nécessitant la vue. Effet secondaire : Blesse les créatures sensibles à la lumière en leur infligeant 1d4+1 dégâts Formule extrême : Longueur POUvoir x3 mètres et 1d4+2 dégâts' } },
  { name: 'Maléfice de chatouille', level: 4, data: { niveau: '4', type: 'Sortilège', incantation: 'Titillando', cible: 'P', effet: 'FE : 30%/50% Fait apparaître des mains fantomatiques qui chatouillent la victime durant de longues minutes. Effet principal : inflige un malus de 60 % à toute ses actions, y compris le lancement de sorts. Effets secondaire : cause 2 dégâts non-létaux dus à l’épuisement et de l’essoufflement Durée : Variable (minutes) Formule extrême : Malus de 70% et dégâts létaux =' } },
  { name: 'Maléfice du Cerveau-en-gelée', level: 4, data: { niveau: '4', type: 'Sortilège', incantation: '-', cible: 'A/P', effet: 'Diminue les capacités de réflexion de la cible. Effets : Les jets d’INTelligence se font comme INTx1 et les sortilèges se lancent tous avec leur malus maximal Sous-type : Maléfice Durée : Variable (heures) Formule extrême : -' } },
  { name: 'Maléfice du rire', level: 4, data: { niveau: '4', type: 'Sortilège', incantation: '-', cible: 'P', effet: 'Fait rire la cible de manière incontrôlée Effet : Inflige un malus de 50% à toute les actions, y compris le lancement de sorts, tout en provoquant l’épuisement Effet secondaire : Occasionne 1 dégâts non létal par heure jusqu’à épuisement total (0 point de vie), plongeant la cible dans le coma. Sous-type : Maléfice Durée : Permanente' } },
  { name: 'Marque des ténèbres', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'Morsmordre', cible: 'P', effet: 'Fait apparaître la marque des ténèbres. Durée : permanente Formule extrême : -' } },
  { name: 'Mimétisme', level: 4, data: { niveau: '4', type: 'Métamorphose', incantation: 'Mimesis', cible: 'P', effet: 'La peau du personnage s’adapte à son environnement. Effet : bonus de 50% à la discrétion. Durée : 1d10+1 heures Formule extrême : Bonus de 75% et durée +3 heures' } },
  { name: 'Mutisme', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'Silencio', cible: 'A/P', effet: 'Rend la cible muette durant 1 mois, l’empêchant de lancer des sortilèges à moins qu’il ne s’agisse d’informulés. Durée : 1 mois Formule extrême : -' } },
  { name: 'Patronus', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'Expecto Patronum / Spero patronum', cible: 'X', effet: 'Invoque un Patronus (Opposition : POUx2/POU) qui peut servir de bouclier contre certaines créatures maléfiques (Détraqueurs, Morenplis, etc.) ou faire office de messager. Durée : volontaire Remarque : Si ce sortilège est lancé par une personne qui ne possède pas un cœur pur, des asticots de lumière jaillissent de la baguette du sorcier pour venir le dévorer. Formule extrême : -' } },
  { name: 'Protection', level: 4, data: { niveau: '4', type: 'Sortilège', incantation: 'Protego', cible: 'P', effet: 'FE : 30%/50% Protège le lanceur d’un sort qui lui est jeté en divisant la valeur de POUvoir de l’assaillant par 2. Ce sort donne également droit à un jet d’opposition POU/POU pour les sorts qui n’y donnent normalement pas droit et protège des dégâts physiques en les diminuant de 2. (Exception : Avada kedavra). Durée : 1d8+2 heures Formule extrême : Durée +2 heures et dégâts physique -3' } },
  { name: 'Réduction', level: 4, data: { niveau: '4', type: 'Sortilège', incantation: 'Reducto', cible: 'O', effet: 'Détruit des objets solides en les faisant tomber en poussière. Sous-type : Maléfice Durée : - Formule extrême : -' } },
  { name: 'Renforcement', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'Fianto Duri', cible: 'X', effet: 'Fianto Duri est un sortilège qui est utilisé pour renforcer les protections magiques déjà existante. Une fois lancé, ce sortilège donne l’effet des formules extrêmes à un sortilège déjà lancé. Durée : Identique à la durée de la formule extrême du sortilège renforcé Formule extrême : -' } },
  { name: 'Révélasort de Scarpin', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'Specialis revelio', cible: 'A/O P/V', effet: 'Ce sort permet d\'identifier les sorts jetés sur un objet ou les ingrédients d\'une potion. Lancé une deuxième fois sur une potion, il permet de savoir si celle-ci a été correctement préparée. Durée : - Formule extrême : -' } },
  { name: 'Reviviscence', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'Revigor', cible: 'P', effet: 'Permet de redonner de l\'énergie à une personne très affaiblie, étourdie ou bien inconsciente. Bien qu\'il soit efficace contre la plupart des sorts, il n\'a pas d\'effets concluants contre les actes de magie noire. Durée : Volontaire Formule extrême : -' } },
  { name: 'Sécurité', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Avertit le lanceur si un lieu est victime d’une effraction. Employé dans les magasins pour prévenir les vols. Durée : 12 heures Formule extrême : -' } },
  { name: 'Séduction', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'X', cible: 'P', effet: 'FE : 30%/50% Charme une cible et la rend amoureuse de soi durant 1d6+1 heures. Le sort ne peut plus être lancé pendant une période équivalente à celle passée sous le charme mais n’a aucun souvenir d’avoir été Opposition : APP/POU Contrer les effets du sort : vu qu’il agit comme un philtre d’amour, les effets de ce sortilège peuvent être partiellement ou totalement dissipés par des antidotes aux philtres d’amour. Formule extrême : durée 2d6+2 heures' } },
  { name: 'Super-sensoriel', level: 4, data: { niveau: '4', type: 'Enchantement', incantation: 'X', cible: 'A, P', effet: 'Augmente toutes les capacités de perception d’un animal ou d’une personne. Effet : Tous les jets de PERception se font comme PERx5 Effet secondaire : Rend très sensible à la lumière intense, aux bruits forts et aux mauvaises odeurs Durée : Variable (minute) Formule extrême : -' } },
  { name: 'Altération météorologique', level: 5, data: { niveau: '5', type: 'Métamorphose', incantation: 'Meteorribilis recanto', cible: 'X', effet: 'Permet de modifier les conditions atmosphériques alentours pour que celle-ci reviennent à la normale. Contre les effets de Meteorribilis. Durée : - Formule extrême : -' } },
  { name: 'Anti-Apparition', level: 5, data: { niveau: '5', type: 'Enchantement', incantation: 'X', cible: 'P', effet: 'FE : 40%/70% Empêche une personne d’apparaître dans une pièce en utilisant le transplanage. Durée : Variable (heures) Formule extrême : durée variable (jours)' } },
  { name: 'Anti-maléfice de Flagrance', level: 5, data: { niveau: '5', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice de Flagrance Formule extrême : -' } },
  { name: 'Anti-maléfice du Voleur', level: 5, data: { niveau: '5', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice du Voleur Formule extrême : -' } },
  { name: 'Anti-Transplanage', level: 5, data: { niveau: '5', type: 'Enchantement', incantation: 'X', cible: 'P', effet: 'FE : 40%/70% Empêche une personne de se téléporter en utilisant le transplanage. Durée : Variable (heures) Formule extrême : durée variable (jours)' } },
  { name: 'Aveuglement', level: 5, data: { niveau: '5', type: 'Sortilège', incantation: 'X', cible: 'P', effet: 'FE : 40%/70% La personne devient invisible. Effet : Octroie un bonus de 60% en discrétion. Durée : 1d4+1 heures Formule extrême : bonus de 75% en Discrétion et durée de 2d4+2 heures' } },
  { name: 'Brasier obscur', level: 5, data: { niveau: '5', type: 'Enchantement', incantation: 'X', cible: 'X', effet: 'L’enchantement de brasier obscur est employé pour protéger une zone en créant une barrière de flammes de couleur noire. Ces flammes empêchent une personne de passer à travers en lui causant de graves brûlures. Seul le lanceur peut retirer cette protection. Les sortilèges de dissipation ne fonctionnent pas sur le brasier obscur. Effet : occasionne 1d4+1 dégâts par round à toute personne tentant de traverser les flammes. Durée : POUvoir jours Sauvegarde : potion de protection contre le feu' } },
  { name: 'Corde de flammes', level: 5, data: { niveau: '5', type: 'Enchantement', incantation: 'X', cible: 'A/P', effet: 'Produit une corde de flammes qui peut être projetée sur un adversaire pour le bloquer et le blesser. Pour se libérer, la cible doit réussir un jet en opposition (POU/DEX). Effet : Occasionne 2 dégâts par round à la cible Durée : Volontaire' } },
  { name: 'Éveil d’objets', level: 5, data: { niveau: '5', type: 'Métamorphose', incantation: 'X', cible: 'O', effet: 'Donne vie et une conscience temporaire à un objet qui obtient une valeur d’INTelligence de 6. Celui-ci obéit alors au sorcier. Durée : variable Formule extrême : -' } },
  { name: 'Expulsion', level: 5, data: { niveau: '5', type: 'Sortilège', incantation: 'Expulso', cible: 'A/O P/V', effet: 'Provoque une violente explosion qui endommage les objets et peut causer de graves blessures aux êtres vivants. Possède suffisamment de puissance pour faire traverser à mur à une personne. Détruit les petits objets et endommage les grands. Cause 1d4+1 dégâts à un être vivant. Sous-type : Maléfice Durée : - Formule extrême : -' } },
  { name: 'Extension (Niv 5)', level: 5, data: { niveau: '5', type: 'Enchantement', incantation: 'Capacious extremis', cible: 'O', effet: 'Augmente la capacité de stockage intérieure d\'un objet sans en modifier l’extérieur et rend son contenu plus léger. Durée : permanente Formule extrême : -' } },
  { name: 'Feu de Sempremais', level: 5, data: { niveau: '5', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Les objets ensorcelés par un Feu de Sempremais brûlent pour toujours. Durée : permanente Formule extrême : -' } },
  { name: 'Flagrance', level: 5, data: { niveau: '5', type: 'Sortilège', incantation: 'X', cible: 'O', effet: 'FE : 30%/55% Appliqué sur un objet, ce sortilège sert à le protéger du vol. Quand une personne tente de s’emparer de l’objet sans lever le sort, elle subit une brûlure de l’ordre de 1d4 dégâts. Le sort reste effectif tant qu’il n’est pas levé mais n’endommage pas l’objet. Sous-type : Maléfice Durée : permanente Formule extrême : 2d4 dégâts infligés' } },
  { name: 'Humain en animal', level: 5, data: { niveau: '5', type: 'Métamorphose', incantation: 'X', cible: 'P', effet: 'Métamorphose un humain en animal Remarque : Ce genre de sortilège est interdit à l’utilisation dans la majeure partie des écoles de magie Durée : - Formule extrême : -' } },
  { name: 'Legilimens', level: 5, data: { niveau: '5', type: 'Enchantement', incantation: 'Legilimens', cible: 'P', effet: 'Permet d’entrer dans l’esprit d’une personne, de lire ses pensées et de parcourir ses souvenirs. Opposition : POU/(POUx1). Durée : volontaire Formule extrême : -' } },
  { name: 'Maléfice explosif', level: 5, data: { niveau: '5', type: 'Sortilège', incantation: 'Confringo', cible: 'A/O P/V', effet: 'FE : 30%/50% Provoque un effet d’explosion qui détruit des objets (magiques ou non) et qui blesse les êtres vivants en leur infligeant 1d6+1 dégâts. Sous-type : Maléfice Durée : - Formule extrême : dégâts 2d4+2' } },
  { name: 'Position initiale', level: 5, data: { niveau: '5', type: 'Enchantement', incantation: 'Offero', cible: 'O', effet: 'FE : 50%/70% Permet de faire revenir des objets dans leur position initiale, réparant ceux-ci par la même occasion. Fonctionne sur une zone donnée équivalente à POU/2 mètres Durée : - Formule extrême : POU mètres' } },
  { name: 'Régénération corporelle', level: 5, data: { niveau: '5', type: 'Enchantement', incantation: 'Revigore Vulnera Sanentur', cible: 'A/P', effet: 'Régénère les blessures subies sur un corps mort Effet : Fait disparaître les blessures subies par un corps sans vie Durée : Volontaire / jusqu’à disparition complète des blessures Formule extrême : - 5 Remontée des sortilèges / Priori Incantatum E Prior Incanto X FC : 50% Sort qui sert à dévoiler la dernière action d\'une baguette magique. Fait remonter les sortilèges en sens inverse. Durée : - Remarque : lorsque deux baguettes jumelles lancent un sort l\'une contre l\'autre, Priori Incantatem se lance de lui-même. Formule extrême : -' } },
  { name: 'Sectumsempra', level: 5, data: { niveau: '5', type: 'Sortilège', incantation: 'Sectumsempra', cible: 'A/P', effet: 'Blesse violemment la partie du corps visée comme si celle-ci avait été tailladée par une épée. La cible perd alors rapidement son sang et peut mourir. Sous-type : Maléfice Effet : perte de 1d4+1 points de vie puis 1 point de vie par round. Formule extrême : - Anti-maléfice : Soin des blessures' } },
  { name: 'Soin des blessures', level: 5, data: { niveau: '5', type: 'Enchantement', incantation: 'Vulnera Sanentur', cible: 'A/P', effet: 'Permet de refermer les blessures d’une personne ou d’un animal à raison de 1 point de vie par round. Le sorcier lançant ce sortilège doit rester concentrer sur sa tâche pour ne pas risquer d’empirer les blessures. On peut ainsi remonter les points de vie jusqu’au 3⁄4 de leur maximum. Durée : Volontaire' } },
  { name: 'Tempête', level: 5, data: { niveau: '5', type: 'Métamorphose', incantation: 'Meteorribilis', cible: 'X', effet: 'FE : 50%/70% Sortilège d\'altération climatique permettant de créer une tempête miniature de POU mètres de rayon autour du lanceur. La tempête peut apparaître sous la forme de pluie ou de neige et peu blesser, immobiliser ou endommager les personnes et objets qui s’y trouvent. Durée : POU minutes Formule extrême : Portée de POUx2 mètres et durée de POUx2 minutes' } },
  { name: 'Transplanage', level: 5, data: { niveau: '5', type: 'Enchantement', incantation: 'X', cible: 'P', effet: 'Permet de se téléporter dans un endroit connu et non protégé. Durée : - Remarque : le déplacement ne peut se faire que sur POUvoir x10 kilomètres Formule extrême : -' } },
  { name: 'Vinaigre en Vin', level: 5, data: { niveau: '5', type: 'Enchantement', incantation: 'X', cible: 'X', effet: 'Transmute le vinaigre en vin Formule extrême : - Remarque : Plus la différence entre sa maîtrise en métamorphose et le résultat du dé est grande, et plus le vin est de qualité.' } },
  { name: 'Voleur', level: 5, data: { niveau: '5', type: 'Sortilège', incantation: 'X', cible: 'O', effet: 'Lancé sur un objet, ce sort punit celui qui le garde trop longtemps sans l\'acheter. Les effets peuvent varier en fonction des désirs de celui qui le lance. Sous-type : Maléfice Durée : permanente Formule extrême : -' } },
  { name: 'Anti-maléfice de Feudeymon', level: 5, data: { niveau: '5+', type: 'Enchantement', incantation: '-', cible: 'P', effet: 'Permet de contrer les effets du maléfice du Feudeymon Formule extrême : - 5+ Anti-maléfice du Supplice de Métamorphose E - P FC : 75% Permet de contrer les effets du maléfice du Supplice de Métamorphose Formule extrême : -' } },
  { name: 'Brasier pourpre', level: 5, data: { niveau: '5+', type: 'Enchantement', incantation: 'X', cible: 'X', effet: 'Une variation du brasier obscur qui est cependant bien plus compliquée à passer. Comme son homologue obscur, le brasier pourpre ne peut être dissipé que par celui qui a lancé le sortilège. De plus, ce brasier occasionne des dégâts plus importants à ceux et celles qui tente de le traverser soit 1d6+2 dégâts par round. Finalement, la potion de protection contre le feu classique ne fonctionne pas pour cet enchantement. Une potion particulière doit être préparée par le lanceur du sortilège. Durée : POUvoirx3 jours Sauvegarde : potion des flammes violettes' } },
  { name: 'Brèche', level: 5, data: { niveau: '5+', type: 'Métamorphose', incantation: 'Partis Temporus', cible: 'X', effet: 'Créer de manière temporaire une brèche dans une protection magique en place, permettant au sorcier de passer sans encombre. Durée : volontaire Formule extrême : -' } },
  { name: 'Extension (Niv 5plus)', level: 5, data: { niveau: '5+', type: 'Enchantement', incantation: 'Capacious extremis', cible: 'O', effet: 'Permet d\'augmenter la taille intérieure d\'un objet sans en modifier la taille physique de manière à améliorer sa capacité de stockage. Il permet également de rendre son contenu plus léger. Formule extrême : - Remarque : Cet enchantement est hautement contrôlé par le Ministère de la Magie' } },
  { name: 'Feudeymon', level: 5, data: { niveau: '5+', type: 'Sortilège', incantation: '-', cible: 'X', effet: 'Maléfice conjurant un feu magique lié à la magie noire. Les flammes peuvent prendre l\'apparence de bêtes féroces, comme des dragons ou des chimères, qui semblent douées de conscience. Le Feudeymon détruit tout sur son passage et ne peut être stoppé que par le contre- maléfice idoine. Sous-type : Maléfice Durée : Permanente Remarque : Le Feudeymon est l\'une des rares substances à pouvoir détruire les Horcruxes.' } },
  { name: 'Fontaine de vin', level: 5, data: { niveau: '5+', type: 'Enchantement', incantation: 'X', cible: 'X', effet: 'Conjure une fontaine de vin depuis l’extrémité de sa baguette Formule extrême : - Remarque : Plus la différence entre sa maîtrise en enchantement et le résultat du dé est grande, et plus le vin est de qualité.' } },
  { name: 'Incartable', level: 5, data: { niveau: '5+', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Rend un lieu incartable. Dès lors, celui-ci ne peut plus être détecté ou indiqué sur une carte.' } },
  { name: 'Protection contre le Mal', level: 5, data: { niveau: '5+', type: 'Enchantement', incantation: 'Protego Horibilis', cible: 'P', effet: 'Protège le lanceur d’un sort qui lui est jeté en divisant la valeur de POUvoir de l’assaillant par 3. Ce sort donne également droit à un jet d’opposition POU/POU pour les sorts qui n’y donnent normalement pas droit et protège des dégâts physiques en les diminuant de 3. (Exception : Avada kedavra). Portée : Dôme de POUvoir mètre de rayon.' } },
  { name: 'Retourne-temps', level: 5, data: { niveau: '5+', type: 'Enchantement', incantation: 'X', cible: 'O', effet: 'Enchantement permettant de remonter le temps de quelques heures. Les Retourneurs de Temps conçus au ministère de la Magie contiennent plusieurs de ces sortilèges' } },
  { name: 'Supplice de Métamorphose', level: 5, data: { niveau: '5+', type: 'Sortilège', incantation: '-', cible: 'A/P', effet: 'Transforme lentement la cible en pierre Effet : Le corps de la cible se change petit à petit en pierre jusqu’à ce qu’elle meure. Effet secondaire : Fait atrocement souffrir la cible Sous-type : Maléfice Durée : Permanente Remarque : Contrairement à d’autres sortilèges mortels, le supplice de la Métamorphose peut être contré par un contre-maléfice spécifique.' } },
]

// Pearl, base stat = 3 partout. Mods calibrés pour stats finales :
// Phys=2, Dex=1, Int=4, Perc=3, Char=6, Pou=1 (plancher à 1).
const PEARL_NORMAL_TRAITS: Array<{ name: string; mods: Array<{ statSlug: string; value: number }> }> = [
  { name: 'Doué (commandement)', mods: [{ statSlug: 'charisme', value: 1 }] },
  { name: 'Chouchou de Mme Bibine', mods: [] },
  { name: 'Famille influente', mods: [{ statSlug: 'charisme', value: 1 }] },
  { name: 'Charismatique', mods: [{ statSlug: 'charisme', value: 2 }] },
  { name: 'Premier de la classe', mods: [{ statSlug: 'intelligence', value: 1 }] },
  { name: 'Sang Pur', mods: [{ statSlug: 'pouvoir', value: 1 }] },
  { name: 'Excellent jeu d\'échec', mods: [{ statSlug: 'intelligence', value: 1 }] },
  { name: 'Self Contrôle', mods: [{ statSlug: 'pouvoir', value: 1 }] },
  { name: 'Voyant véritable', mods: [{ statSlug: 'perception', value: 1 }] },
  { name: 'Lien sensoriel avec le familier', mods: [] }
]

const PEARL_DEFAUT_TRAITS: Array<{ name: string; mods: Array<{ statSlug: string; value: number }> }> = [
  { name: 'Amoureux collant', mods: [{ statSlug: 'intelligence', value: -1 }] },
  { name: 'Poissard', mods: [
    { statSlug: 'physique', value: -1 },
    { statSlug: 'dexterite', value: -1 },
    { statSlug: 'perception', value: -1 }
  ] },
  { name: 'Fauché', mods: [{ statSlug: 'pouvoir', value: -2 }] },
  { name: 'Défaut psychologique : méprisant avec les inférieurs et les rivaux', mods: [
    { statSlug: 'charisme', value: -1 },
    { statSlug: 'dexterite', value: -1 },
    { statSlug: 'pouvoir', value: -2 }
  ] }
]

// Objets HP (utilisés par les PJ). Format : { name, description, unique }.
const HP_ITEMS: Array<{ name: string; description: string; unique: boolean }> = [
  { name: 'Jeu d\'échec de sorcier', description: 'Un jeu d\'échecs animé, hérité de la famille de Pearl.', unique: true }
]

// Objets par personnage (slug => liste de noms d\'objet).
const HP_CHARACTER_ITEMS: Record<string, string[]> = {
  Pearl: ['Jeu d\'échec de sorcier']
}

const HP_ANIMALS = ['Suzhan', 'Chiron', 'Taz', 'Bellefeuille']

// Noms de sorts ci-dessous = noms exacts du grimoire Keul (PDF). Apostrophes typographiques (U+2019).
const HP_CHARACTERS: Array<{ name: string; animal: string | null; spells: string[] }> = [
  { name: 'Pearl', animal: 'Suzhan', spells: [
    'Effroi petites créatures',
    'Création temporaire',
    'Liquide vers Liquide',
    'Lévitation d’objets',
    'Déverrouillage',
    'Sortilège de feu',
    'Tergeo',
    'Croche-pied',
    'Finestra',
    'Lumière/Obscurité',
    'Ralentissement',
    'Refroidissement'
  ] },
  { name: 'Caly', animal: 'Taz', spells: [
    'Effroi petites créatures',
    'Magie domestique',
    'Objet vers Objet',
    'Création temporaire',
    'Lacer',
    'Lévitation d’objets',
    'Objets chantant',
    'Sortilège de réparation',
    'Sortilège de feu',
    'Croche-pied',
    'Lumière/Obscurité',
    'Ralentissement',
    'Objet en Oiseau',
    'Refroidissement'
  ] },
  { name: 'Maggie', animal: 'Bellefeuille', spells: [
    'Effroi petites créatures',
    'Lévitation d’objets',
    'Sortilège de réparation',
    'Révélation',
    'Sortilège de feu',
    'Surface miroir',
    'Croche-pied',
    'Lumière/Obscurité',
    'Ralentissement',
    'Refroidissement',
    'Décélération'
  ] },
  { name: 'Actéon', animal: 'Chiron', spells: [
    'Effroi petites créatures',
    'Flocon de neige',
    'Ruban',
    'Détonation',
    'Lévitation d’objets',
    'Sortilège de feu',
    'Tergeo',
    'Croche-pied',
    'Lumière/Obscurité',
    'Ralentissement',
    'Objet en Oiseau',
    'Refroidissement',
    'Déplacement'
  ] },
  { name: 'Gédéon', animal: null, spells: [
    'Effroi petites créatures',
    'Chauffe-boisson',
    'Flocon de neige',
    'Parapluie',
    'Lumière/Obscurité',
    'Refroidissement',
    'Alarte Ascendare',
    'Libération'
  ] }
]

const HP_STATS = ['Physique', 'Dextérité', 'Intelligence', 'Perception', 'Charisme', 'Pouvoir']
const HP_STAT_SLUGS = ['physique', 'dexterite', 'intelligence', 'perception', 'charisme', 'pouvoir']

async function seedHpFeed(): Promise<string> {
  try { await JdrApiClient.deleteJdr(HP_FEED_SLUG) } catch (_) { /* not found, ok */ }

  let jdr = await JdrApiClient.createJdr('Poudlard', 'Seed HP : 5 PJ, ' + HP_SPELLS.length + ' sorts du grimoire Keul, traits Pearl calibrés.')

  // 6 stats HP
  for (const stat of HP_STATS) {
    jdr = await JdrApiClient.addStat(jdr.slug, stat)
  }

  // Classe Élève
  jdr = await JdrApiClient.addClass(jdr.slug, 'Élève', 1, 'Apprenti sorcier de Poudlard')

  // Groupes : 4 maisons + Poudlard
  jdr = await JdrApiClient.addGroup(jdr.slug, 'Gryffondor', 'Maison des audacieux')
  jdr = await JdrApiClient.addGroup(jdr.slug, 'Serpentard', 'Maison des ambitieux')
  jdr = await JdrApiClient.addGroup(jdr.slug, 'Serdaigle', 'Maison des érudits')
  jdr = await JdrApiClient.addGroup(jdr.slug, 'Poufsouffle', 'Maison des loyaux')
  jdr = await JdrApiClient.addGroup(jdr.slug, 'Poudlard', 'L\'école de sorcellerie')

  // Ressources
  jdr = await JdrApiClient.addResource(jdr.slug, 'PV', 'all')
  jdr = await JdrApiClient.addResource(jdr.slug, 'Points Gryffondor', 'group')
  jdr = await JdrApiClient.addResource(jdr.slug, 'Points Serpentard', 'group')
  jdr = await JdrApiClient.addResource(jdr.slug, 'Points Serdaigle', 'group')
  jdr = await JdrApiClient.addResource(jdr.slug, 'Points Poufsouffle', 'group')

  // Traits PNJ-animaux (Normal, sans mod)
  for (const animal of HP_ANIMALS) {
    jdr = await JdrApiClient.addTrait(jdr.slug, animal, 'Normal')
  }

  // Traits Pearl (15) avec mods calibrés
  for (const trait of PEARL_NORMAL_TRAITS) {
    jdr = await JdrApiClient.addTrait(jdr.slug, trait.name, 'Normal', trait.mods.length > 0 ? trait.mods : undefined)
  }
  for (const trait of PEARL_DEFAUT_TRAITS) {
    jdr = await JdrApiClient.addTrait(jdr.slug, trait.name, 'Defaut', trait.mods)
  }

  // Tous les sorts du grimoire HP (PDF Keul)
  for (const spell of HP_SPELLS) {
    jdr = await JdrApiClient.addTrait(jdr.slug, spell.name, 'Sorts', undefined, spell.level, spell.data)
  }

  // Objets HP
  for (const item of HP_ITEMS) {
    jdr = await JdrApiClient.addItem(jdr.slug, item.name, item.description, item.unique, undefined)
  }

  const itemSlugByName = new Map(jdr.items.map(i => [i.name, i.slug]))

  // Map name -> slug pour retrouver les traits ensuite
  const traitSlugByName = new Map(jdr.traits.map(t => [t.name, t.slug]))

  // 5 personnages PJ, tous classe Élève, groupe Poudlard
  for (const character of HP_CHARACTERS) {
    jdr = await JdrApiClient.addCharacter(jdr.slug, character.name, 'eleve', undefined, true)
  }

  const characterSlugByName = new Map(jdr.characters.map(c => [c.name, c.slug]))

  for (const character of HP_CHARACTERS) {
    const charSlug = characterSlugByName.get(character.name)
    if (!charSlug) throw new Error(`Slug introuvable pour ${character.name}`)

    jdr = await JdrApiClient.addCharacterGroup(jdr.slug, charSlug, 'poudlard')

    // Stats de base = 3 pour tous (les traits Pearl modifient la base)
    for (const statSlug of HP_STAT_SLUGS) {
      jdr = await JdrApiClient.updateCharacterStat(jdr.slug, charSlug, statSlug, 3)
    }

    // Animal mascotte (sauf Gédéon)
    if (character.animal) {
      const animalSlug = traitSlugByName.get(character.animal)
      if (!animalSlug) throw new Error(`Trait animal introuvable: ${character.animal}`)
      jdr = await JdrApiClient.addCharacterTrait(jdr.slug, charSlug, animalSlug)
    }

    // Sorts
    for (const spellName of character.spells) {
      const spellSlug = traitSlugByName.get(spellName)
      if (!spellSlug) throw new Error(`Sort introuvable: ${spellName}`)
      jdr = await JdrApiClient.addCharacterTrait(jdr.slug, charSlug, spellSlug)
    }

    // Objets
    const itemNames = HP_CHARACTER_ITEMS[character.name] ?? []
    for (const itemName of itemNames) {
      const itemSlug = itemSlugByName.get(itemName)
      if (!itemSlug) throw new Error(`Objet introuvable: ${itemName}`)
      jdr = await JdrApiClient.addCharacterItem(jdr.slug, charSlug, itemSlug)
    }
  }

  // Traits perso de Pearl uniquement (Animagus volontairement omis)
  const pearlSlug = characterSlugByName.get('Pearl')!
  for (const trait of [...PEARL_NORMAL_TRAITS, ...PEARL_DEFAUT_TRAITS]) {
    const traitSlug = traitSlugByName.get(trait.name)
    if (!traitSlug) throw new Error(`Trait Pearl introuvable: ${trait.name}`)
    jdr = await JdrApiClient.addCharacterTrait(jdr.slug, pearlSlug, traitSlug)
  }

  return jdr.slug
}
interface JdrListItem {
  slug: string
  name: string
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [jdrs, setJdrs] = useState<JdrListItem[]>([])
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seedingHp, setSeedingHp] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadJdrs = async () => {
    try {
      setLoading(true)
      const data = await JdrApiClient.findAll()
      setJdrs(data)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJdrs()
  }, [])

  const handleDelete = async (slug: string) => {
    if (!confirm(`Supprimer "${slug}" et tous ses éléments ?`)) return
    try {
      await JdrApiClient.deleteJdr(slug)
      await loadJdrs()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleSeedViking = async () => {
    try {
      setSeeding(true)
      setError(null)
      const slug = await seedVikingTest()
      await loadJdrs()
      navigate(`/jdr/${slug}/mj`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSeeding(false)
    }
  }

  const handleSeedHp = async () => {
    try {
      setSeedingHp(true)
      setError(null)
      const slug = await seedHpFeed()
      await loadJdrs()
      navigate(`/jdr/${slug}/mj`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSeedingHp(false)
    }
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return

    try {
      setSaving(true)
      const created = await JdrApiClient.createJdr(name.trim(), text.trim() || undefined)
      setName('')
      setText('')
      await loadJdrs()
      navigate(`/jdr/${created.slug}/mj`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1>Admin JdR</h1>
          <p style={styles.subtitle}>Crée un univers puis ouvre sa page MJ.</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={handleSeedViking} disabled={seeding || seedingHp}>
            {seeding ? 'Seeding...' : '⚡ Seed VikingTest'}
          </button>
          <button onClick={handleSeedHp} disabled={seeding || seedingHp}>
            {seedingHp ? 'Seeding...' : '⚡ Feed HP'}
          </button>
        </div>
      </header>

      <section style={styles.card}>
        <h2>Nouveau JdR</h2>
        <form onSubmit={handleCreate} style={styles.form}>
          <label>
            Nom
            <input
              placeholder="Ex: Chroniques de l'Ombre"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </label>
          <label>
            Description
            <textarea
              rows={3}
              placeholder="Contexte, ambiance, règles maison..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </label>
          <button type="submit" disabled={saving || !name.trim()}>
            {saving ? 'Création...' : 'Créer le JdR'}
          </button>
        </form>
      </section>

      <section style={styles.card}>
        <h2>JdR existants</h2>
        {loading && <p>Chargement...</p>}
        {!loading && jdrs.length === 0 && <p>Aucun JdR pour le moment.</p>}
        {!loading && jdrs.length > 0 && (
          <div style={styles.list}>
            {jdrs.map(jdr => (
              <div key={jdr.slug} style={styles.row}>
                <div>
                  <strong>{jdr.name}</strong>
                  <div style={styles.slug}>{jdr.slug}</div>
                </div>
                <div style={styles.actions}>
                  <button onClick={() => navigate(`/jdr/${jdr.slug}/mj`)}>Ouvrir MJ</button>
                  <button onClick={() => navigate(`/jdr/${jdr.slug}/joueurs`)}>Choix du perso</button>
                  <button onClick={() => handleDelete(jdr.slug)} style={{ background: 'var(--color-danger)' }}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && <p style={styles.error}>Erreur: {error}</p>}
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  } as const,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: '0.25rem'
  } as const,
  subtitle: {
    color: 'var(--color-secondary)'
  },
  headerActions: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    justifyContent: 'flex-end'
  } as const,
  card: {
    background: 'white',
    border: '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    padding: '1rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  } as const,
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  } as const,
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--color-bg)',
    borderRadius: '0.375rem',
    padding: '0.75rem'
  } as const,
  slug: {
    fontSize: '0.8rem',
    color: 'var(--color-secondary)'
  },
  actions: {
    display: 'flex',
    gap: '0.5rem'
  } as const,
  error: {
    color: 'var(--color-danger)'
  }
}
