import { DBCharacterTemplate } from '../../data/database/character/DBCharacterTemplate'
import { DBSkill } from '../../data/database/skills/DBSkill'
import { DisplayCategory } from '../../domain/models/characters/DisplayCategory'
import { SuccessCalculation } from '../../domain/models/roll/SuccessCalculation'
import { SkillOwnedUse } from '../../domain/models/skills/SkillOwnedUse'
import { SkillStat } from '../../domain/models/skills/SkillStat'
import { Injectable } from '@nestjs/common'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InitSkills {
  static getSkills(charactersTemplates: Map<string, DBCharacterTemplate>): DBSkill[] {
    const chairSkill: DBSkill = this.createSkill({
      name: 'chair',
      shortName: 'ch',
      description: 'Jet de chair',
      allAttribution: true,
      stat: SkillStat.CHAIR,
      category: DisplayCategory.STATS,
      display: 'fait un *Jet de Chair*',
      position: 1
    })
    const espritSkill: DBSkill = this.createSkill({
      name: 'esprit',
      shortName: 'sp',
      description: "Jet d'esprit",
      allAttribution: true,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.STATS,
      display: "fait un *Jet d'Esprit*",
      position: 2
    })
    const essenceSkill: DBSkill = this.createSkill({
      name: 'essence',
      shortName: 'es',
      description: "Jet d'essence",
      allAttribution: true,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.STATS,
      display: "fait un *Jet d'Essence*",
      position: 3
    })
    const empiriqueSkill: DBSkill = this.createSkill({
      name: 'empirique',
      shortName: 'emp',
      description: 'Jet empirique',
      allAttribution: true,
      stat: SkillStat.EMPIRIQUE,
      category: DisplayCategory.STATS,
      display: 'fait un *Jet Empirique*',
      position: 4,
      successCalculation: SuccessCalculation.AUCUN
    })
    const koSkill: DBSkill = this.createSkill({
      name: 'KO',
      shortName: 'KO',
      description: 'Jet de Sauv. contre la Mort',
      allAttribution: true,
      stat: SkillStat.CUSTOM,
      successCalculation: SuccessCalculation.CUSTOM,
      category: DisplayCategory.STATS,
      display: 'fait un *Jet de Sauvegarde contre la Mort*',
      customRolls: '1d6',
      position: 0,
      secret: true
    })
    const magieSkill: DBSkill = this.createSkill({
      name: 'magie',
      shortName: 'mg',
      description: "Jet de magie au prix d'une dette",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'fait un *Jet de Magie*',
      position: 1,
      dettesCost: 1
    })
    const cantripSkill: DBSkill = this.createSkill({
      name: 'cantrip',
      shortName: 'ct',
      description: "Jet de magie légère au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'fait un *Jet de Magie Légère*',
      position: 2,
      ppCost: 1
    })
    const formeAqueue: DBSkill = this.createSkill({
      name: 'forme aqueuse',
      shortName: 'fa',
      description: "se transforme en eau au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'se *transforme en Eau*',
      position: 2,
      ppCost: 1
    })
    const soinMental: DBSkill = this.createSkill({
      name: 'soin mental',
      shortName: 'sm',
      description: "donne des PF à une cible au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'donne des *Points de Focus*',
      position: 2,
      ppCost: 1
    })
    const vol: DBSkill = this.createSkill({
      name: 'vol',
      shortName: 'vol',
      description: "permet de voler au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: "s'*Envole*",
      position: 2,
      ppCost: 1
    })
    const armure: DBSkill = this.createSkill({
      name: 'armure',
      shortName: 'arm',
      description: "permet de donner X/2 d'armure, -1 par tour, au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'génère une *Armure*',
      position: 2,
      successCalculation: SuccessCalculation.DIVISE,
      ppCost: 1
    })
    const speed: DBSkill = this.createSkill({
      name: 'speed',
      shortName: 'spd',
      description: "permet de donner X bénédiction à la prochaine action au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'donne des *Bénédictions*',
      position: 2,
      ppCost: 1
    })
    const malediction: DBSkill = this.createSkill({
      name: 'malédiction',
      shortName: 'mld',
      description: "permet de donner X malédiction à la prochaine action au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'donne des *Malédictions*',
      position: 2,
      ppCost: 1
    })
    const invisibilite: DBSkill = this.createSkill({
      name: 'invisibilité',
      shortName: 'inv',
      description: "permet de rendre invisible au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'rend *Invisible*',
      position: 2,
      ppCost: 1
    })
    const communicationArcaniqueSkill: DBSkill = this.createSkill({
      name: 'communication arcanique',
      shortName: 'ca',
      longName: 'communication',
      description: 'Permet de communiquer avec un arcane',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Communication Arcanique*',
      position: 105,
      arcaneCost: 1,
      isArcanique: true
    })
    const boostArcaniqueSkill: DBSkill = this.createSkill({
      name: 'boost arcanique',
      shortName: 'ba',
      longName: 'boost',
      description: 'Augmente la puissance d un sort arcanique',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait un *Boost Arcanique*',
      position: 106,
      arcaneCost: 1,
      isArcanique: true
    })
    const blocageArcaniqueSkill: DBSkill = this.createSkill({
      name: 'blocage arcanique',
      shortName: 'bl',
      longName: 'blocage',
      description: 'Bloque un sort arcanique',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait un *Blocage Arcanique*',
      position: 107,
      arcaneCost: 1,
      isArcanique: true
    })
    const copieArcaniqueSkill: DBSkill = this.createSkill({
      name: 'copie arcanique',
      shortName: 'cpa',
      longName: 'copie',
      description: 'Copie un sort arcanique',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Copie Arcanique*',
      position: 108,
      arcaneCost: 1,
      isArcanique: true
    })
    const lienAuxVoyageursSkill: DBSkill = this.createSkill({
      name: 'arpenteur',
      shortName: 'lv',
      description: 'Permet d utiliser un voyageur amélioré',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait un *Lien aux Voyageurs*',
      position: 109,
      arcaneCost: 1,
      isArcanique: true
    })

    const peurSkill: DBSkill = this.createSkill({
      name: 'peur',
      shortName: 'pr',
      description: 'Effet de peur',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.MAGIE,
      display: 'fait un *Jet de Peur*',
      position: 1,
      ppCost: 1,
      dettesCost: 0,
      isArcanique: true
    })

    const sablierSkill: DBSkill = this.createSkill({
      name: 'sablier',
      shortName: 'sab',
      description: 'Remonter le temps de quelques secondes',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Sablier*',
      position: 1,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })

    const alchimisteSkill: DBSkill = this.createSkill({
      name: 'alchimiste',
      shortName: 'alch',
      description: 'Transformer la matière',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Alchimiste*',
      position: 2,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })

    const voyageurSkill: DBSkill = this.createSkill({
      name: 'voyageur',
      shortName: 'voy',
      description: 'Se téléporter ou poser une ancre de téléportation',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Voyageur*',
      position: 3,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })

    const forgeronSkill: DBSkill = this.createSkill({
      name: 'forgeron',
      shortName: 'forg',
      description: 'Invoquer un objet non magique',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Forgeron*',
      position: 4,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })

    const loupSkill: DBSkill = this.createSkill({
      name: 'loup',
      shortName: 'loup',
      description: 'Ajoute X en Chair au prochain Jet pour soit et ses alliés',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Loup*',
      position: 5,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })

    const serpentSkill: DBSkill = this.createSkill({
      name: 'serpent',
      shortName: 'serp',
      description: 'Ajoute X en Essence au prochain Jet pour soit et ses alliés',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Serpent*',
      position: 6,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })

    const fauconSkill: DBSkill = this.createSkill({
      name: 'faucon',
      shortName: 'fauc',
      description: 'Ajoute une action en réaction',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Faucon*',
      position: 7,
      successCalculation: SuccessCalculation.AUCUN,
      arcaneCost: 1,
      isArcanique: true
    })

    const sorciereSkill: DBSkill = this.createSkill({
      name: 'sorcière',
      shortName: 'sorc',
      description: 'Ajoute X en Esprit et invoque -X en Esprit à un ennemi pour le prochain jet',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Sorcière*',
      position: 8,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })

    const vampireSkill: DBSkill = this.createSkill({
      name: 'vampire',
      shortName: 'vamp',
      description: 'Vol X PV à une cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Vampire*',
      position: 9,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })

    const licheSkill: DBSkill = this.createSkill({
      name: 'liche',
      shortName: 'lich',
      description: 'Vol X PP à une cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Liche*',
      position: 10,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })
    const fantomeSkill: DBSkill = this.createSkill({
      name: 'fantome',
      shortName: 'ftm',
      description: 'Permet de traverser les murs',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait un *Fantome*',
      position: 11,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })

    const illusionisteSkill: DBSkill = this.createSkill({
      name: 'illusioniste',
      shortName: 'ill',
      description: 'Crée une illusion',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'fait un *Illusioniste*',
      position: 12,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })
    const comedienSkill: DBSkill = this.createSkill({
      name: 'comedien',
      shortName: 'cmd',
      description: "Permet de changer d'apparence",
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Comédien*',
      position: 12,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })

    const voleurSkill: DBSkill = this.createSkill({
      name: 'voleur',
      shortName: 'voleur',
      description: 'Télékinésie',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Voleur*',
      position: 13,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })

    const mentalisteSkill: DBSkill = this.createSkill({
      name: 'mentaliste',
      shortName: 'mtn',
      description: "Lire les souvenirs d'une cible",
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Mentaliste*',
      position: 14,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })

    const eruditSkill: DBSkill = this.createSkill({
      name: 'erudit',
      shortName: 'eru',
      description: "Découvrir si quelqu'un ment",
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Erudit*',
      position: 15,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })

    const chasseurSkill: DBSkill = this.createSkill({
      name: 'chasseur',
      shortName: 'chasseur',
      description: "Repérer une cible à X centaine de mètre ou poser une ancre sur quelqu'un",
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Chasseur*',
      position: 16,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })

    const ivrogneSkill: DBSkill = this.createSkill({
      name: 'ivrogne',
      shortName: 'ivr',
      description: "Utiliser une Stat à la place d'une autre",
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Ivrogne*',
      position: 17,
      successCalculation: SuccessCalculation.AUCUN,
      arcaneCost: 1,
      isArcanique: true
    })

    const jugeSkill: DBSkill = this.createSkill({
      name: 'juge',
      shortName: 'juge',
      description: 'Utiliser 1/2 ou 3/4 pour ses réussites',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Juge*',
      position: 18,
      successCalculation: SuccessCalculation.AUCUN,
      arcaneCost: 1,
      isArcanique: true
    })

    const arbreSkill: DBSkill = this.createSkill({
      name: 'arbre',
      shortName: 'arb',
      description: 'Invoquer et/ou manipuler des plantes',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Arbre*',
      position: 19,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })

    const phoenixSkill: DBSkill = this.createSkill({
      name: 'phoenix',
      shortName: 'phoenix',
      description: 'Donner 3 PV à une cible KO, qui peut agir immédiatemment',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Phoenix*',
      position: 20,
      successCalculation: SuccessCalculation.AUCUN,
      arcaneCost: 1,
      isArcanique: true
    })

    const necromancienSkill: DBSkill = this.createSkill({
      name: 'necromancien',
      shortName: 'nec',
      description: 'Poser X questions à un cadavre, -1 par heure depuis le décès',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Necromancien*',
      position: 21,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })

    const licorneSkill: DBSkill = this.createSkill({
      name: 'licorne',
      shortName: 'lic',
      description: 'Invoquer et/ou manipuler des animaux',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Licorne*',
      position: 22,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })
    const chouetteSkill: DBSkill = this.createSkill({
      name: 'chouette',
      shortName: 'cht',
      description: 'Projeter son esprit pour voir au loin',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'projette son *Esprit* pour voir au loin',
      position: 24,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const chevalSkill: DBSkill = this.createSkill({
      name: 'cheval',
      shortName: 'chv',
      description: 'Invoquer un véhicule',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'invoque un *Véhicule*',
      position: 25,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const diablotinSkill: DBSkill = this.createSkill({
      name: 'diablotin',
      shortName: 'diab',
      description: 'Invoquer un petit serviteur',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'invoque un petit *Serviteur*',
      position: 26,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const protecteurSkill: DBSkill = this.createSkill({
      name: 'protecteur',
      shortName: 'prtc',
      description: 'Donne X PV temporaire, -1 par tour',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'donne X *PV temporaire*, -1 par tour',
      position: 27,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const corbeauSkill: DBSkill = this.createSkill({
      name: 'corbeau',
      shortName: 'crb',
      description: 'Ajoute X en Esprit au prochain Jet pour soit et ses alliés',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'ajoute X en *Esprit* au prochain Jet pour soi et ses alliés',
      position: 28,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const araigneeSkill: DBSkill = this.createSkill({
      name: 'araignee',
      shortName: 'argn',
      description: 'Immobiliser une cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'immobilise une *Cible*',
      position: 29,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const tisserandSkill: DBSkill = this.createSkill({
      name: 'tisserand',
      shortName: 'tiss',
      description: "Modifie les souvenirs d'une cible",
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: "modifie les *Souvenirs* d'une cible",
      position: 30,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const commandantSkill: DBSkill = this.createSkill({
      name: 'commandant',
      shortName: 'cmdt',
      description: 'Donne un ordre à une cible',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'donne un *Ordre* à une cible',
      position: 31,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const verSkill: DBSkill = this.createSkill({
      name: 'ver',
      shortName: 'ver',
      description: 'Création de portails à courte portée',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'crée des *Portails* à courte portée',
      position: 32,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const pretreSkill: DBSkill = this.createSkill({
      name: 'pretre',
      shortName: 'prtr',
      description: 'Apaise les émotions',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'apaise les *Émotions*',
      position: 33,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const bourreauSkill: DBSkill = this.createSkill({
      name: 'bourreau',
      shortName: 'bour',
      description: 'Provoque de la douleur pure',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'provoque de la *Douleur Pure*',
      position: 34,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })
    const marionnettisteSkill: DBSkill = this.createSkill({
      name: 'marionnettiste',
      shortName: 'mrnt',
      description: 'Manipule les mouvements',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'manipule les *Mouvements*',
      position: 35,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const lionSkill: DBSkill = this.createSkill({
      name: 'lion',
      shortName: 'lion',
      description: 'Booste sa Chair de X/2, -1 par tour',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'booste sa *Chair* de X/2, -1 par tour',
      position: 36,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,
      isArcanique: true
    })

    const taureauSkill: DBSkill = this.createSkill({
      name: 'taureau',
      shortName: 'taur',
      description: 'Booste son Esprit de X/2, -1 par tour',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'booste son *Esprit* de X/2, -1 par tour',
      position: 37,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,
      isArcanique: true
    })

    const renardSkill: DBSkill = this.createSkill({
      name: 'renard',
      shortName: 'rnd',
      description: 'Booste son Essence de X/2, -1 par tour',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'booste son *Essence* de X/2, -1 par tour',
      position: 38,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,
      isArcanique: true
    })

    const videSkill: DBSkill = this.createSkill({
      name: 'vide',
      shortName: 'vide',
      description: 'Faire disparaitre quelque chose',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait disparaitre quelque chose',
      position: 39,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const miroirSkill: DBSkill = this.createSkill({
      name: 'miroir',
      shortName: 'mir',
      description: 'Crée des illusions de soi autour',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'crée des *Illusions* de soi autour',
      position: 40,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const devinSkill: DBSkill = this.createSkill({
      name: 'devin',
      shortName: 'dvn',
      description: 'Voir dans le futur',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'voit dans le *Futur*',
      position: 41,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const peintreSkill: DBSkill = this.createSkill({
      name: 'peintre',
      shortName: 'peint',
      description: 'Fige le temps',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fige le *Temps*',
      position: 42,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const telepatheSkill: DBSkill = this.createSkill({
      name: 'telepathe',
      shortName: 'tlpt',
      description: 'Télépathie',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'communique par *Télépathie*',
      position: 43,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const montreSkill: DBSkill = this.createSkill({
      name: 'montre',
      shortName: 'mtre',
      description: 'Se projeter dans le futur',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'se projette dans le *Futur*',
      position: 44,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })
    const omniscientSkill: DBSkill = this.createSkill({
      name: 'omniscient',
      shortName: 'omn',
      description: 'Avoir une vision totale autour de soi',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'a une *Vision Totale* autour de soi',
      position: 45,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const messagerSkill: DBSkill = this.createSkill({
      name: 'messager',
      shortName: 'msg',
      description: "Envoie d'un message à une cible proche ou marquée",
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: "envoie d'un *Message* à une cible proche ou marquée",
      position: 46,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const nainSkill: DBSkill = this.createSkill({
      name: 'nain',
      shortName: 'nain',
      description: 'Rétrécir (+X/2 bonus pour esquiver Chair et Esprit)',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'rétrécit (+X/2 bonus pour esquiver Chair et Esprit)',
      position: 47,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,
      isArcanique: true
    })

    const geantSkill: DBSkill = this.createSkill({
      name: 'geant',
      shortName: 'geant',
      description: 'Grandir (+X/2 bonus pour attaquer en Chair)',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'grandit (+X/2 bonus pour attaquer en Chair)',
      position: 48,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,
      isArcanique: true
    })

    const vigieSkill: DBSkill = this.createSkill({
      name: 'vigie',
      shortName: 'vigie',
      description: 'Marquer un objet et sentir quand il est touché',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'marque un objet et sent quand il est touché',
      position: 49,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const amiSkill: DBSkill = this.createSkill({
      name: 'ami',
      shortName: 'ami',
      description: "Donner l'impression à une cible qu'on est son ami",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: "donne l'impression à une cible qu'on est son *Ami*",
      position: 50,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const chamanSkill: DBSkill = this.createSkill({
      name: 'chaman',
      shortName: 'chmn',
      description: 'Communiquer avec les animaux',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'communique avec les *Animaux*',
      position: 51,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const cryptesthesisteSkill: DBSkill = this.createSkill({
      name: 'cryptesthesiste',
      shortName: 'crypt',
      description: "Percevoir les souvenirs d'un objet",
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: "perçoit les *Souvenirs* d'un objet",
      position: 52,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const sageSkill: DBSkill = this.createSkill({
      name: 'sage',
      shortName: 'sage',
      description: 'Au moins X/2 réussites à chaque jet, -1 par tour',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'obtient au moins X/2 réussites à chaque jet, -1 par tour',
      position: 53,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,
      isArcanique: true
    })

    const professeurSkill: DBSkill = this.createSkill({
      name: 'professeur',
      shortName: 'prof',
      description: 'Donner des PF à une cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'donne des *PF* à une cible',
      position: 54,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })
    const magicienSkill: DBSkill = this.createSkill({
      name: 'magicien',
      shortName: 'mag',
      description: 'Donner des PP à une cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'donne des *PP* à une cible',
      position: 55,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const empoisonneurSkill: DBSkill = this.createSkill({
      name: 'empoisonneur',
      shortName: 'emp',
      description: 'Empoisonner une cible (-1pv par tour)',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'empoisonne une cible (-1pv par tour)',
      position: 56,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const amnesiqueSkill: DBSkill = this.createSkill({
      name: 'amnesique',
      shortName: 'amn',
      description: 'Faire oublier sa présence aux adversaires',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait oublier sa présence aux adversaires',
      position: 57,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const pragmatiqueSkill: DBSkill = this.createSkill({
      name: 'pragmatique',
      shortName: 'prag',
      description: 'Annuler de la magie',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'annule de la magie',
      position: 58,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const parfumeurSkill: DBSkill = this.createSkill({
      name: 'parfumeur',
      shortName: 'parf',
      description: 'Créer des odeurs et des gouts',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'crée des odeurs et des gouts',
      position: 59,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const banquierSkill: DBSkill = this.createSkill({
      name: 'banquier',
      shortName: 'banq',
      description: 'Créer un espace où cacher des objets',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'crée un espace où cacher des objets',
      position: 60,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const colletSkill: DBSkill = this.createSkill({
      name: 'collet',
      shortName: 'clt',
      description: "Lier une cible à soi, qui ne peut plus s'éloigner",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: "lie une cible à soi, qui ne peut plus s'éloigner",
      position: 61,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const linguisteSkill: DBSkill = this.createSkill({
      name: 'linguiste',
      shortName: 'ling',
      description: "Compréhension écrite et orale d'une langue",
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: "comprend à l'écrit et à l'oral une langue",
      position: 62,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const equilibristeSkill: DBSkill = this.createSkill({
      name: 'equilibriste',
      shortName: 'equi',
      description: "Attaque en jet d'équilibre (somme des stats - somme des diff entre max et autres)",
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: "attaque en jet d'équilibre (somme des stats - somme des diff entre max et autres)",
      position: 63,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true
    })

    const marchandSkill: DBSkill = this.createSkill({
      name: 'marchand',
      shortName: 'marchand',
      description: 'mrchd deux cibles par un contrat magique',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'lie deux cibles par un contrat magique',
      position: 64,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })
    const mecanicienSkill: DBSkill = this.createSkill({
      name: 'mecanicien',
      shortName: 'meca',
      description: 'Animer des objets',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'anime des objets',
      position: 65,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const cadavreSkill: DBSkill = this.createSkill({
      name: 'cadavre',
      shortName: 'cdvr',
      description: 'Simuler un état de mort',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'simule un état de mort',
      position: 66,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true
    })

    const leprechaunSkill: DBSkill = this.createSkill({
      name: 'leprechaun',
      shortName: 'lep',
      description: 'Avoir de la chance',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'a de la chance',
      position: 67,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const bergerSkill: DBSkill = this.createSkill({
      name: 'berger',
      shortName: 'brg',
      description: "Percevoir où se trouver ce que l'on désire",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: "perçoit où se trouver ce que l'on désire",
      position: 68,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const reveSkill: DBSkill = this.createSkill({
      name: 'reve',
      shortName: 'reve',
      description: "Aller dans les rêves d'une cible",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: "va dans les rêves d'une cible",
      position: 69,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const orateurSkill: DBSkill = this.createSkill({
      name: 'orateur',
      shortName: 'ora',
      description: 'Réussite un jet pour encourager',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'réussit un jet pour encourager',
      position: 70,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const furieSkill: DBSkill = this.createSkill({
      name: 'furie',
      shortName: 'furie',
      description: 'Provoque un sentiment de colère à une cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'provoque un sentiment de colère à une cible',
      position: 71,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const ratSkill: DBSkill = this.createSkill({
      name: 'rat',
      shortName: 'rat',
      description: "Donne X malus aux ennemis pour le prochain jet d'Essence",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: "donne X malus aux ennemis pour le prochain jet d'Essence",
      position: 72,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const scorpionSkill: DBSkill = this.createSkill({
      name: 'scorpion',
      shortName: 'scrp',
      description: 'Donne X malus aux ennemis pour le prochain jet de Chair',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'donne X malus aux ennemis pour le prochain jet de Chair',
      position: 73,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const vautourSkill: DBSkill = this.createSkill({
      name: 'vautour',
      shortName: 'vtr',
      description: "Donne X malus aux ennemis pour le prochain jet d'Esprit",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: "donne X malus aux ennemis pour le prochain jet d'Esprit",
      position: 74,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })
    const balanceSkill: DBSkill = this.createSkill({
      name: 'balance',
      shortName: 'bal',
      description: 'Transférer X blessures sur une cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'transfère X blessures sur une cible',
      position: 75,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const savantSkill: DBSkill = this.createSkill({
      name: 'savant',
      shortName: 'sav',
      description: 'Protéger son esprit',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'protège son esprit',
      position: 76,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true
    })

    const archeologueSkill: DBSkill = this.createSkill({
      name: 'archeologue',
      shortName: 'arcg',
      description: 'Percevoir où se trouve un objet à proximité ou marqué',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'perçoit où se trouve un objet à proximité ou marqué',
      position: 77,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const gardienSkill: DBSkill = this.createSkill({
      name: 'gardien',
      shortName: 'gard',
      description: 'Ressent si un marqué est en danger',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'ressent si un marqué est en danger',
      position: 78,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const destructionSkill: DBSkill = this.createSkill({
      name: 'destruction',
      shortName: 'destr',
      description: 'Détruire une zone',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'détruit une zone',
      position: 79,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const conteurSkill: DBSkill = this.createSkill({
      name: 'conteur',
      shortName: 'cntr',
      description: 'Provoque un état de sommeil',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'provoque un état de sommeil',
      position: 80,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const lucioleSkill: DBSkill = this.createSkill({
      name: 'luciole',
      shortName: 'luc',
      description: 'Soigne X/2 PV à ses alliés à distance',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'soigne X/2 PV à ses alliés à distance',
      position: 81,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,
      isArcanique: true
    })

    const chaperonSkill: DBSkill = this.createSkill({
      name: 'chaperon',
      shortName: 'chap',
      description: 'Téléporté une personne marqué ou visible vers soi',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'téléporte une personne marqué ou visible vers soi',
      position: 82,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const chauveSourisSkill: DBSkill = this.createSkill({
      name: 'chauvesouris',
      shortName: 'chvsr',
      description: 'Projeter son esprit pour entendre au loin',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'projette son esprit pour entendre au loin',
      position: 83,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const acrobateSkill: DBSkill = this.createSkill({
      name: 'acrobate',
      shortName: 'acro',
      description: "Pouvoir s'accrocher aux murs",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: "peut s'accrocher aux murs",
      position: 84,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })
    const terreurSkill: DBSkill = this.createSkill({
      name: 'terreur',
      shortName: 'ter',
      description: 'Provoque un sentiment de peur',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'provoque un sentiment de peur',
      position: 85,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const ectoplasmeSkill: DBSkill = this.createSkill({
      name: 'ectoplasme',
      shortName: 'ecto',
      description: 'Projette une version visible de soit pour voir et entendre au loin',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'projette une version visible pour voir/entendre au loin',
      position: 86,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const torcheSkill: DBSkill = this.createSkill({
      name: 'torche',
      shortName: 'trch',
      description: 'Aura de soin (X tour avec 1 soin de 1 PV par tour)',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'aura de soin pour X tours',
      position: 87,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const survivantSkill: DBSkill = this.createSkill({
      name: 'survivant',
      shortName: 'surv',
      description: 'Protection contre la mort (pv de secours si on tombe KO)',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'protection contre la mort',
      position: 88,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const purificateurSkill: DBSkill = this.createSkill({
      name: 'purificateur',
      shortName: 'purf',
      description: 'Purification (eau/nourriture/maladie)',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'purifie eau, nourriture ou maladies',
      position: 89,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const reparateurSkill: DBSkill = this.createSkill({
      name: 'réparateur',
      shortName: 'rep',
      description: "Réparation d'objets ou de mécanismes",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'répare objets ou mécanismes',
      position: 90,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const voyantSkill: DBSkill = this.createSkill({
      name: 'voyant',
      shortName: 'voy',
      description: 'Scruter une personne à proximité ou précédemment marquée',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'scrute une personne proche ou marquée',
      position: 91,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const nomadeSkill: DBSkill = this.createSkill({
      name: 'nomade',
      shortName: 'nmd',
      description: 'Savoir exactement où on se situe',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'sait exactement où il se situe',
      position: 92,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true
    })

    const silenceSkill: DBSkill = this.createSkill({
      name: 'silence',
      shortName: 'slnc',
      description: 'Bloquer le son dans une zone',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'bloque le son dans une zone',
      position: 93,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const mortSkill: DBSkill = this.createSkill({
      name: 'mort',
      shortName: 'mort',
      description: 'Achève une personne avec 25% max de PV restant',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'achève une cible à 25% de PV ou moins',
      position: 94,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true
    })
    const analysteSkill: DBSkill = this.createSkill({
      name: 'analyste',
      shortName: 'anlst',
      description: "Scanner quelqu'un pour connaitre sa lignée, et ses PV, PF et PP courant et max",
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'scanne pour connaître lignée et stats',
      position: 95,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true
    })

    const farceurSkill: DBSkill = this.createSkill({
      name: 'farceur',
      shortName: 'farc',
      description: 'Ajoute un effet visuel et ou sonore à un objet quand on le touche pour X fois',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'ajoute un effet à un objet touché',
      position: 96,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const observateurSkill: DBSkill = this.createSkill({
      name: 'observateur',
      shortName: 'obsr',
      description: 'Obtenir la vision véritable (voir la magie, les auras, les êtres invisibles, etc...)',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'obtient vision véritable',
      position: 97,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true
    })

    const confesseurSkill: DBSkill = this.createSkill({
      name: 'confesseur',
      shortName: 'conf',
      description: 'Crée une zone de vérité où on ne peut mentir',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'crée une zone de vérité',
      position: 98,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const bouclierSkill: DBSkill = this.createSkill({
      name: 'bouclier',
      shortName: 'bclr',
      description: 'Réduit X dégats en réaction',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'réduit X dégâts',
      position: 99,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const pisteurSkill: DBSkill = this.createSkill({
      name: 'pisteur',
      shortName: 'pist',
      description: 'Perçoit une cible à proximité pour X heures',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'perçoit cible pour X heures',
      position: 100,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const pieuvreSkill: DBSkill = this.createSkill({
      name: 'pieuvre',
      shortName: 'pvr',
      description: "Ajoute des bras pour X tours, donnant une action supplémentaire d'attaque",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'ajoute des bras pour attaque supplémentaire',
      position: 101,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const sobreSkill: DBSkill = this.createSkill({
      name: 'sobre',
      shortName: 'sbr',
      description: 'Force un adversaire à se défendre avec une autre stat',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'force défense avec autre stat',
      position: 102,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true
    })

    const illumineSkill: DBSkill = this.createSkill({
      name: 'illuminé',
      shortName: 'ill',
      description: 'Communion avec son Être Supérieur',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'communion avec Être Supérieur',
      position: 103,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true
    })

    const souhaitSkill: DBSkill = this.createSkill({
      name: 'souhait',
      shortName: 'sht',
      description: "Utilise n'importe quelle arcane ou modifie le monde avec contre-coup",
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'utilise arcanes ou modifie le monde',
      position: 104,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true
    })
    const planteSoutien: DBSkill = this.createSkill({
      name: 'Plante de soutien',
      shortName: 'pl-soutien',
      description: 'Invoquer une plante de soutien',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'invoque une *Plante de Soutien*',
      position: 31,
      invocationTemplate: charactersTemplates.get('Plante Soutien')
    })
    const coupDeSeve: DBSkill = this.createSkill({
      name: 'Coup de sève',
      shortName: 'Coup de sève',
      description: 'Donne des bénédictions pour un tour',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'donne des *Bénédictions* pour un tour',
      position: 31
    })
    const planteCombat: DBSkill = this.createSkill({
      name: 'Plante de combat',
      shortName: 'pl-combat',
      description: 'Invoquer une plante de combat',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'invoque une *Plante de Combat*',
      position: 32,
      invocationTemplate: charactersTemplates.get('Plante Combat')
    })
    const planteMagie: DBSkill = this.createSkill({
      name: 'Plante de magie',
      shortName: 'pl-magie',
      description: 'Invoquer une plante de magie',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'invoque une *Plante de Magie*',
      position: 33,
      invocationTemplate: charactersTemplates.get('Plante Magie')
    })
    const pollen: DBSkill = this.createSkill({
      name: 'Pollen',
      shortName: 'pollen',
      description: 'Crèe un effet magique (poison, soin, etc...)',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'génère un *Pollen Magique*',
      position: 31
    })
    const planteEnvahissante: DBSkill = this.createSkill({
      name: 'Plante envahissante',
      shortName: 'pl-envahis.',
      description: 'Invoquer une plante envahissante',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'invoque une *Plante Envahissante*',
      position: 34,
      invocationTemplate: charactersTemplates.get('Plante Envahissante')
    })

    const reconnaissanceNaturelle: DBSkill = this.createSkill({
      name: 'Reconnaissance naturelle',
      shortName: 'reco nat.',
      description: 'Analyser le niveau courant de la Nature',
      allAttribution: false,
      stat: SkillStat.CUSTOM,
      category: DisplayCategory.MAGIE,
      display: 'analyse le *Niveau de la Nature*',
      position: 9,
      successCalculation: SuccessCalculation.CUSTOM
    })

    const lienNaturel: DBSkill = this.createSkill({
      name: 'Lien naturel',
      shortName: 'lien nat.',
      description: 'Retirer 2 PV à une plante invoquée pour annuler une blessure',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.MAGIE,
      display: 'se *soigne* en puissant dans ses plantes',
      precision: 'Rappel : retirer 2 PV à une plante pour en gagner 1',
      position: 10
    })

    const soulevementDeLaNature: DBSkill = this.createSkill({
      name: 'Soulèvement de la Nature',
      shortName: 'soulev nat.',
      description: 'Attaque de Chair à 2*Nature, 1 dégat aux plantes invoquées',
      allAttribution: false,
      stat: SkillStat.CUSTOM,
      category: DisplayCategory.MAGIE,
      display: 'provoque un *Soulèvement de la Nature*',
      precision: 'Rappel : retirer 1 PV à chaque plante invoquée',
      position: 11,
      dettesCost: 1
    })

    const animationDeLaNature: DBSkill = this.createSkill({
      name: 'Animation de la Nature',
      shortName: 'anim nat.',
      description: 'Donne une consscience avancée à une plante',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'réalise une *Animation de la Nature*',
      position: 12,
      dettesCost: 1
    })

    const communicationAvecLaNature: DBSkill = this.createSkill({
      name: 'Communication avec la Nature',
      shortName: 'comm nat.',
      description: 'Lien avec une plante pour communiquer avec elle tant que la Nature est supérieure à 2',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'réalise une *Communication avec la Nature*',
      position: 13,
      dettesCost: 1
    })

    const voieDesArbres: DBSkill = this.createSkill({
      name: 'Voie des Arbres',
      shortName: 'voie arbre',
      description: 'Permet de créer un portail entre 2 arrbres',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'créée une *Voie des Arbres*',
      position: 13,
      dettesCost: 1
    })

    const lienAvatar: DBSkill = this.createSkill({
      name: "Lien à l'Avatar",
      shortName: 'lien',
      description: "Utilise son lien avec l'Avatar",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'se lie à son *Avatar*',
      position: 14,
      limitedUse: 1
    })

    const brasRobotique: DBSkill = this.createSkill({
      name: 'Bras Robotique',
      shortName: 'bras',
      description: 'Attaque double en Chair contre un PV perdu',
      allAttribution: false,
      stat: SkillStat.CHAIR,
      category: DisplayCategory.SOLDATS,
      display: 'utilise son *Bras Mécanique*',
      position: 1,
      pvCost: 1
    })

    const oeilBionique: DBSkill = this.createSkill({
      name: 'Oeil Bionique',
      shortName: 'oeil',
      description: 'Analyse une cible (personne ou objet)',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.SOLDATS,
      display: 'utilise son *Oeil Bionique*',
      position: 2,
      limitedUse: 1
    })

    const munitionCourante: DBSkill = this.createSkill({
      name: 'Mun. courantes',
      shortName: 'm-cour',
      description: 'Utilise une munition courante',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.SOLDATS,
      display: 'utilise une *Munition courante*',
      position: 3
    })

    const munitionLethale: DBSkill = this.createSkill({
      name: 'Mun. léthales',
      shortName: 'm-leth',
      description: 'Utilise une munition léthale, x2',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.SOLDATS,
      display: 'utilise une *Munition léthale*',
      position: 4,
      successCalculation: SuccessCalculation.DOUBLE,
      soldatCost: 1
    })

    const munitionAffaiblissante: DBSkill = this.createSkill({
      name: 'Mun. affaiblissantes',
      shortName: 'm-aff',
      description: 'Utilise une munition affaiblissante, +1 malus à la cible touchée',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.SOLDATS,
      display: 'utilise une *Munition affaiblissante*',
      position: 5,
      soldatCost: 2
    })

    const munitionPeste: DBSkill = this.createSkill({
      name: 'Mun. peste',
      shortName: 'm-pest',
      description: 'Utilise une munition peste, +1 dégat à la cible touchée à chacune de ses actions',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.SOLDATS,
      display: 'utilise une *Munition peste*',
      position: 6,
      soldatCost: 2
    })

    const munitionMarquage: DBSkill = this.createSkill({
      name: 'Mun. marquage',
      shortName: 'm-marq',
      description: 'Utilise une munition marquage, marque la cible touchée',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.SOLDATS,
      display: 'utilise une *Munition géolocalisable*',
      position: 7,
      soldatCost: 3
    })

    const munitionDegenerative: DBSkill = this.createSkill({
      name: 'Mun. dégénérative',
      shortName: 'm-deg',
      description: 'Utilise une munition dégénérative, soins divisés par 2',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.SOLDATS,
      display: 'utilise une *Grenade dégénérative*',
      position: 8,
      soldatCost: 2
    })

    const munitionFumigene: DBSkill = this.createSkill({
      name: 'Gr. fumigène',
      shortName: 'g-fum',
      description: 'Utilise une munition fumigène, crée un nuage de fumée',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.SOLDATS,
      display: 'utilise une *Grenade fumigène*',
      position: 9,
      soldatCost: 1
    })

    const munitionFlash: DBSkill = this.createSkill({
      name: 'Gr. flash',
      shortName: 'g-flsh',
      description: 'Utilise une munition flash, aveugle la cible touchée',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.SOLDATS,
      display: 'utilise une *Grenade flash*',
      position: 10,
      soldatCost: 1
    })

    const tatouage: DBSkill = this.createSkill({
      name: 'tatouage',
      shortName: 'tat',
      description: 'Se transformer la plus grande peur de la cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      display: "utilise l'*Arcane Prime* du *Tatouage de Terreur*",
      position: 1,
      arcanePrimeCost: 1
    })

    const pokeball: DBSkill = this.createSkill({
      name: 'pokéball',
      shortName: 'pkb',
      description: 'Invoque aléatoirement un pokémon',
      allAttribution: false,
      stat: SkillStat.CUSTOM,
      category: DisplayCategory.ARCANES_PRIMES,
      display: 'invoque un *Pokémon*',
      position: 2,
      arcanePrimeCost: 1,
      customRolls: '1d150',
      successCalculation: SuccessCalculation.CUSTOM
    })
    return [
      munitionDegenerative,
      munitionCourante,
      munitionLethale,
      munitionAffaiblissante,
      munitionPeste,
      munitionMarquage,
      brasRobotique,
      oeilBionique,
      munitionFlash,
      munitionFumigene,
      pokeball,
      tatouage,
      chairSkill,
      espritSkill,
      essenceSkill,
      empiriqueSkill,
      koSkill,
      magieSkill,
      cantripSkill,
      sablierSkill,
      alchimisteSkill,
      voyageurSkill,
      forgeronSkill,
      loupSkill,
      serpentSkill,
      fauconSkill,
      sorciereSkill,
      vampireSkill,
      licheSkill,
      fantomeSkill,
      illusionisteSkill,
      comedienSkill,
      voleurSkill,
      mentalisteSkill,
      eruditSkill,
      chasseurSkill,
      ivrogneSkill,
      jugeSkill,
      arbreSkill,
      phoenixSkill,
      necromancienSkill,
      licorneSkill,
      chouetteSkill,
      chevalSkill,
      diablotinSkill,
      protecteurSkill,
      corbeauSkill,
      araigneeSkill,
      tisserandSkill,
      commandantSkill,
      verSkill,
      pretreSkill,
      bourreauSkill,
      marionnettisteSkill,
      lionSkill,
      taureauSkill,
      renardSkill,
      videSkill,
      miroirSkill,
      devinSkill,
      peintreSkill,
      telepatheSkill,
      montreSkill,
      omniscientSkill,
      messagerSkill,
      nainSkill,
      geantSkill,
      vigieSkill,
      amiSkill,
      chamanSkill,
      cryptesthesisteSkill,
      sageSkill,
      professeurSkill,
      magicienSkill,
      empoisonneurSkill,
      amnesiqueSkill,
      pragmatiqueSkill,
      parfumeurSkill,
      banquierSkill,
      colletSkill,
      linguisteSkill,
      equilibristeSkill,
      marchandSkill,
      mecanicienSkill,
      cadavreSkill,
      leprechaunSkill,
      bergerSkill,
      reveSkill,
      orateurSkill,
      furieSkill,
      ratSkill,
      scorpionSkill,
      vautourSkill,
      balanceSkill,
      savantSkill,
      archeologueSkill,
      gardienSkill,
      destructionSkill,
      conteurSkill,
      lucioleSkill,
      chaperonSkill,
      chauveSourisSkill,
      acrobateSkill,
      terreurSkill,
      ectoplasmeSkill,
      torcheSkill,
      survivantSkill,
      purificateurSkill,
      reparateurSkill,
      voyantSkill,
      nomadeSkill,
      silenceSkill,
      mortSkill,
      analysteSkill,
      farceurSkill,
      observateurSkill,
      confesseurSkill,
      bouclierSkill,
      pisteurSkill,
      pieuvreSkill,
      sobreSkill,
      illumineSkill,
      souhaitSkill,
      planteSoutien,
      communicationArcaniqueSkill,
      boostArcaniqueSkill,
      blocageArcaniqueSkill,
      copieArcaniqueSkill,
      lienAuxVoyageursSkill,
      peurSkill,
      formeAqueue,
      soinMental,
      vol,
      armure,
      malediction,
      speed,
      invisibilite,
      planteMagie,
      planteCombat,
      planteEnvahissante,
      planteSoutien,
      pollen,
      coupDeSeve,
      lienAvatar,
      reconnaissanceNaturelle,
      lienNaturel,
      soulevementDeLaNature,
      animationDeLaNature,
      communicationAvecLaNature,
      voieDesArbres
    ]
  }
  static createSkill(p: {
    name: string
    description: string
    shortName: string
    allAttribution: boolean
    stat: SkillStat
    category: DisplayCategory
    display: string
    position: number
    longName?: string
    isArcanique?: boolean
    allowsPf?: boolean
    allowsPp?: boolean
    use?: SkillOwnedUse
    limitedUse?: number
    pvCost?: number
    pfCost?: number
    ppCost?: number
    dettesCost?: number
    arcaneCost?: number
    arcanePrimeCost?: number
    customRolls?: string
    successCalculation?: SuccessCalculation
    secret?: boolean
    invocationTemplate?: DBCharacterTemplate
    precision?: string
    soldatCost?: number
  }): DBSkill {
    return {
      name: p.name,
      description: p.description,
      precision: p.precision || '',
      shortName: p.shortName,
      longName: p.longName || p.name,
      allAttribution: p.allAttribution,
      allowsPf: p.allowsPf || true,
      allowsPp: p.allowsPp || true,
      stat: p.stat,
      displayCategory: p.category,
      pvCost: p.pvCost || 0,
      pfCost: p.pfCost || 0,
      ppCost: p.ppCost || 0,
      dettesCost: p.dettesCost || 0,
      arcaneCost: p.arcaneCost || 0,
      arcanePrimeCost: p.arcanePrimeCost || 0,
      customRolls: p.customRolls || '',
      successCalculation: p.successCalculation || SuccessCalculation.SIMPLE,
      secret: p.secret || false,
      display: p.display,
      position: p.position,
      isArcanique: p.isArcanique,
      invocationTemplate: p.invocationTemplate || null,
      invocationTemplateName: p.invocationTemplate ? p.invocationTemplate.name : null,
      soldatCost: p.soldatCost || 0
    }
  }
}
