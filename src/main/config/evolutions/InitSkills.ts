import { DBCharacterTemplate } from '../../data/database/character/DBCharacterTemplate'
import { DBSkill } from '../../data/database/skills/DBSkill'
import { DisplayCategory } from '../../domain/models/characters/DisplayCategory'
import { SuccessCalculation } from '../../domain/models/roll/SuccessCalculation'
import { SkillStat } from '../../domain/models/skills/SkillStat'
import { Injectable } from '@nestjs/common'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InitSkills {
  static getSkills(): Omit<DBSkill, 'id'>[] {
    const chairSkill = this.createSkill({
      name: 'chair',
      shortName: 'ch',
      description: 'Jet de chair',
      allAttribution: true,
      stat: SkillStat.CHAIR,
      category: DisplayCategory.STATS,
      display: 'fait un *Jet de Chair*',
      position: 1,
      resistance: true,
      blessure: true,
      help: true
    })
    const espritSkill = this.createSkill({
      name: 'esprit',
      shortName: 'sp',
      description: "Jet d'esprit",
      allAttribution: true,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.STATS,
      display: "fait un *Jet d'Esprit*",
      position: 2,
      resistance: true,
      blessure: true,
      help: true
    })
    const essenceSkill = this.createSkill({
      name: 'essence',
      shortName: 'es',
      description: "Jet d'essence",
      allAttribution: true,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.STATS,
      display: "fait un *Jet d'Essence*",
      position: 3,
      resistance: true,
      blessure: true,
      help: true
    })
    const empiriqueSkill = this.createSkill({
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
    const koSkill = this.createSkill({
      name: 'KO',
      shortName: 'KO',
      description: 'Jet de Sauv. contre la Mort',
      allAttribution: true,
      stat: SkillStat.CUSTOM,
      successCalculation: SuccessCalculation.CUSTOM,
      category: DisplayCategory.STATS,
      display: 'fait un *Jet de Sauvegarde contre la Mort*',
      customRolls: '1d20',
      position: 0,
      secret: true
    })
    const magieSkill = this.createSkill({
      name: 'magie',
      shortName: 'mg',
      description: "Jet de magie au prix d'une dette",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'fait un *Jet de Magie*',
      position: 1,
      dettesCost: 1,
      resistance: true,
      blessure: true,
      help: true
    })
    const cantripSkill = this.createSkill({
      name: 'cantrip',
      shortName: 'ct',
      description: "Jet de magie légère au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'fait un *Jet de Magie Légère*',
      position: 2,
      ppCost: 1,
      resistance: true,
      blessure: true
    })

    const soin = this.createSkill({
      name: 'soin',
      shortName: 'soin',
      description: "donne des PV à une cible au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'prodigue un *Soin*',
      position: 3,
      ppCost: 1,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,
      isHeal: true
    })
    const formeAqueuse = this.createSkill({
      name: 'forme aqueuse',
      shortName: 'fa',
      description: "se transforme en eau au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'se *transforme en Eau*',
      position: 4,
      ppCost: 1
    })
    const soinMental = this.createSkill({
      name: 'soin mental',
      shortName: 'sm',
      description: "donne des PF à une cible au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'donne des *Points de Focus*',
      position: 4,
      ppCost: 1
    })
    const vol = this.createSkill({
      name: 'vol',
      shortName: 'vol',
      description: "permet de voler au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: "s'*Envole*",
      position: 4,
      ppCost: 1
    })
    const armure = this.createSkill({
      name: 'armure',
      shortName: 'arm',
      description: "permet de donner X/2 d'armure, -1 par tour, au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'génère une *Armure*',
      position: 4,
      successCalculation: SuccessCalculation.DIVISE,
      ppCost: 1
    })
    const speed = this.createSkill({
      name: 'speed',
      shortName: 'spd',
      description: "permet de donner X bénédiction à la prochaine action au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'donne des *Bénédictions*',
      position: 4,
      ppCost: 1
    })
    const malediction = this.createSkill({
      name: 'malédiction',
      shortName: 'mld',
      description: "permet de donner X malédiction à la prochaine action au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'donne des *Malédictions*',
      position: 4,
      ppCost: 1
    })
    const invisibilite = this.createSkill({
      name: 'invisibilité',
      shortName: 'inv',
      description: "permet de rendre invisible au prix d'un pp",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'rend *Invisible*',
      position: 4,
      ppCost: 1
    })
    const communicationArcaniqueSkill = this.createSkill({
      name: 'communication arcanique',
      shortName: 'ca',
      longName: 'communication',
      description: 'Permet de communiquer avec un arcane',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Communication Arcanique*',
      position: 105,

      isArcanique: true,
      arcaneCost: 1
    })
    const liberationArcaniqueSkill = this.createSkill({
      name: 'Libération arcanique',
      shortName: 'lib',
      longName: 'libération',
      description: 'Permet de libérer une arcane',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Libération Arcanique*',
      position: 110,
      isArcanique: true,
      arcaneCost: 0
    })
    const boostArcaniqueSkill = this.createSkill({
      name: 'boost arcanique',
      shortName: 'ba',
      longName: 'boost',
      description: 'Augmente la puissance d un sort arcanique',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait un *Boost Arcanique*',
      position: 106,

      isArcanique: true,
      arcaneCost: 1
    })
    const blocageArcaniqueSkill = this.createSkill({
      name: 'blocage arcanique',
      shortName: 'bl',
      longName: 'blocage',
      description: 'Bloque un sort arcanique',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait un *Blocage Arcanique*',
      position: 107,

      isArcanique: true,
      arcaneCost: 1
    })
    const copieArcaniqueSkill = this.createSkill({
      name: 'copie arcanique',
      shortName: 'cpa',
      longName: 'copie',
      description: 'Copie un sort arcanique',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Copie Arcanique*',
      position: 108,

      isArcanique: true,
      arcaneCost: 1
    })
    const lienAuxVoyageursSkill = this.createSkill({
      name: 'arpenteur',
      shortName: 'lv',
      description: 'Permet d utiliser un voyageur amélioré',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait un *Lien aux Voyageurs*',
      position: 109,
      isArcanique: true,
      arcaneCost: 0
    })

    const peurSkill = this.createSkill({
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
      isArcanique: true,
      arcaneCost: 1
    })

    const sablierSkill = this.createSkill({
      name: 'sablier',
      shortName: 'sab',
      description: 'Remonter le temps de quelques secondes',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Sablier*',
      position: 1,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })

    const alchimisteSkill = this.createSkill({
      name: 'alchimiste',
      shortName: 'alch',
      description: 'Transformer la matière',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Alchimiste*',
      position: 4,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })

    const voyageurSkill = this.createSkill({
      name: 'voyageur',
      shortName: 'voy',
      description: 'Se téléporter ou poser une ancre de téléportation',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Voyageur*',
      position: 3,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const forgeronSkill = this.createSkill({
      name: 'forgeron',
      shortName: 'forg',
      description: 'Invoquer un objet non magique',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Forgeron*',
      position: 4,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })

    const loupSkill = this.createSkill({
      name: 'loup',
      shortName: 'loup',
      description: 'Ajoute X en Chair au prochain Jet pour soit et ses alliés',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Loup*',
      position: 5,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })

    const serpentSkill = this.createSkill({
      name: 'serpent',
      shortName: 'serp',
      description: 'Ajoute X en Essence au prochain Jet pour soit et ses alliés',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Serpent*',
      position: 6,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })

    const fauconSkill = this.createSkill({
      name: 'faucon',
      shortName: 'fauc',
      description: 'Ajoute une action en réaction',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Faucon*',
      position: 7,
      successCalculation: SuccessCalculation.AUCUN,

      isArcanique: true,
      arcaneCost: 1
    })

    const sorciereSkill = this.createSkill({
      name: 'sorcière',
      shortName: 'sorc',
      description: 'Ajoute X en Esprit et invoque -X en Esprit à un ennemi pour le prochain jet',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Sorcière*',
      position: 8,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })

    const vampireSkill = this.createSkill({
      name: 'vampire',
      shortName: 'vamp',
      description: 'Vol X PV à une cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Vampire*',
      position: 9,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })

    const licheSkill = this.createSkill({
      name: 'liche',
      shortName: 'lich',
      description: 'Vol X PP à une cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Liche*',
      position: 10,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })
    const fantomeSkill = this.createSkill({
      name: 'fantôme',
      shortName: 'ftm',
      description: 'Permet de traverser les murs',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait un *Fantome*',
      position: 11,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })

    const illusionisteSkill = this.createSkill({
      name: 'illusioniste',
      shortName: 'ill',
      description: 'Crée une illusion',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'fait un *Illusioniste*',
      position: 12,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1,
      resistance: true
    })
    const comedienSkill = this.createSkill({
      name: 'comédien',
      shortName: 'cmd',
      description: "Permet de changer d'apparence",
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Comédien*',
      position: 12,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })

    const voleurSkill = this.createSkill({
      name: 'voleur',
      shortName: 'voleur',
      description: 'Télékinésie',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Voleur*',
      position: 13,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1,
      resistance: true
    })

    const mentalisteSkill = this.createSkill({
      name: 'mentaliste',
      shortName: 'mtn',
      description: "Lire les souvenirs d'une cible",
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Mentaliste*',
      position: 14,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1,
      resistance: true
    })

    const eruditSkill = this.createSkill({
      name: 'erudit',
      shortName: 'eru',
      description: "Découvrir si quelqu'un ment",
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Erudit*',
      position: 15,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })

    const chasseurSkill = this.createSkill({
      name: 'chasseur',
      shortName: 'chasseur',
      description: "Repérer une cible à X centaine de mètre ou poser une ancre sur quelqu'un",
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Chasseur*',
      position: 16,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })

    const ivrogneSkill = this.createSkill({
      name: 'ivrogne',
      shortName: 'ivr',
      description: "Utiliser une Stat à la place d'une autre",
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Ivrogne*',
      position: 17,
      successCalculation: SuccessCalculation.AUCUN,

      isArcanique: true,
      arcaneCost: 1
    })

    const jugeSkill = this.createSkill({
      name: 'juge',
      shortName: 'juge',
      description: 'Utiliser 1/2 ou 3/4 pour ses réussites',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Juge*',
      position: 18,
      successCalculation: SuccessCalculation.AUCUN,

      isArcanique: true,
      arcaneCost: 1
    })

    const jugeAmelioreSkill = this.createSkill({
      name: 'juge amélioré',
      shortName: 'juge am.',
      description: "Utiliser 1/2 ou 3/4 pour ses réussites ou celles d'un allié",
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Juge Amélioré*',
      position: 18,
      successCalculation: SuccessCalculation.AUCUN,

      isArcanique: true,
      arcaneCost: 1
    })

    const arbreSkill = this.createSkill({
      name: 'arbre',
      shortName: 'arb',
      description: 'Invoquer et/ou manipuler des plantes',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Arbre*',
      position: 19,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1,
      resistance: true,
      blessure: true
    })

    const phoenixSkill = this.createSkill({
      name: 'phoenix',
      shortName: 'phoenix',
      description: 'Donner 3 PV à une cible KO, qui peut agir immédiatemment',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Phoenix*',
      position: 20,
      successCalculation: SuccessCalculation.AUCUN,

      isArcanique: true,
      arcaneCost: 1
    })

    const phoenixAmelioreSkill = this.createSkill({
      name: 'phoenix amélioré',
      shortName: 'ph. am.',
      description: 'Donner 3 PV à plusieurs cibles KO, qui peuvent agir immédiatement',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Phoenix Amélioré*',
      position: 20,
      successCalculation: SuccessCalculation.AUCUN,

      isArcanique: true,
      arcaneCost: 1
    })

    const necromancienSkill = this.createSkill({
      name: 'necromancien',
      shortName: 'nec',
      description: 'Poser X questions à un cadavre, -1 par heure depuis le décès',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Necromancien*',
      position: 21,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })

    const licorneSkill = this.createSkill({
      name: 'licorne',
      shortName: 'lic',
      description: 'Invoquer et/ou manipuler des animaux',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Licorne*',
      position: 22,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1,
      isHeal: true
    })
    const chouetteSkill = this.createSkill({
      name: 'chouette',
      shortName: 'cht',
      description: 'Projeter son esprit pour voir au loin',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'projette son *Esprit* pour voir au loin',
      position: 24,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })

    const chevalSkill = this.createSkill({
      name: 'cheval',
      shortName: 'chv',
      description: 'Invoquer un véhicule',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'invoque un *Véhicule*',
      position: 25,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })

    const diablotinSkill = this.createSkill({
      name: 'diablotin',
      shortName: 'diab',
      description: 'Invoquer un petit serviteur',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'invoque un petit *Serviteur*',
      position: 26,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })

    const protecteurSkill = this.createSkill({
      name: 'protecteur',
      shortName: 'prtc',
      description: 'Donne X PV temporaire, -1 par tour',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'donne X *PV temporaire*, -1 par tour',
      position: 27,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,

      isArcanique: true,
      arcaneCost: 1
    })

    const corbeauSkill = this.createSkill({
      name: 'corbeau',
      shortName: 'crb',
      description: 'Ajoute X en Esprit au prochain Jet pour soit et ses alliés',

      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'ajoute X en *Esprit* au prochain Jet pour soi et ses alliés',
      position: 28,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const araigneeSkill = this.createSkill({
      name: 'araignee',
      shortName: 'argn',
      description: 'Immobiliser une cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'immobilise une *Cible*',
      position: 29,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1,
      resistance: true
    })

    const tisserandSkill = this.createSkill({
      name: 'tisserand',
      shortName: 'tiss',
      description: "Modifie les souvenirs d'une cible",
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: "modifie les *Souvenirs* d'une cible",
      position: 30,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1,
      resistance: true
    })

    const commandantSkill = this.createSkill({
      name: 'commandant',
      shortName: 'cmdt',
      description: 'Donne un ordre à une cible',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'donne un *Ordre* à une cible',
      position: 31,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1,
      resistance: true
    })

    const verSkill = this.createSkill({
      name: 'ver',
      shortName: 'ver',
      description: 'Création de portails à courte portée',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'crée des *Portails* à courte portée',
      position: 32,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const pretreSkill = this.createSkill({
      name: 'pretre',
      shortName: 'prtr',
      description: 'Apaise les émotions',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'apaise les *Émotions*',
      position: 33,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1,
      resistance: true
    })

    const bourreauSkill = this.createSkill({
      name: 'bourreau',
      shortName: 'bour',
      description: 'Provoque de la douleur pure',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'provoque de la *Douleur Pure*',
      position: 34,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1,
      resistance: true,
      blessure: true
    })
    const marionnettisteSkill = this.createSkill({
      name: 'marionnettiste',
      shortName: 'mrnt',
      description: 'Manipule les mouvements',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'manipule les *Mouvements*',
      position: 35,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1,
      resistance: true
    })

    const lionSkill = this.createSkill({
      name: 'lion',
      shortName: 'lion',
      description: 'Booste sa Chair de X/2, -1 par tour',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'booste sa *Chair* de X/2, -1 par tour',
      position: 36,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const taureauSkill = this.createSkill({
      name: 'taureau',
      shortName: 'taur',
      description: 'Booste son Esprit de X/2, -1 par tour',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'booste son *Esprit* de X/2, -1 par tour',
      position: 37,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const renardSkill = this.createSkill({
      name: 'renard',
      shortName: 'rnd',
      description: 'Booste son Essence de X/2, -1 par tour',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'booste son *Essence* de X/2, -1 par tour',
      position: 38,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const videSkill = this.createSkill({
      name: 'vide',
      shortName: 'vide',
      description: 'Faire disparaitre quelque chose',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait disparaitre quelque chose',
      position: 39,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const miroirSkill = this.createSkill({
      name: 'miroir',
      shortName: 'mir',
      description: 'Crée des illusions de soi autour',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'crée des *Illusions* de soi autour',
      position: 40,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const devinSkill = this.createSkill({
      name: 'devin',
      shortName: 'dvn',
      description: 'Voir dans le futur',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'voit dans le *Futur*',
      position: 41,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const peintreSkill = this.createSkill({
      name: 'peintre',
      shortName: 'peint',
      description: 'Fige le temps',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fige le *Temps*',
      position: 42,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const telepatheSkill = this.createSkill({
      name: 'telepathe',
      shortName: 'tlpt',
      description: 'Télépathie',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'communique par *Télépathie*',
      position: 43,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const montreSkill = this.createSkill({
      name: 'montre',
      shortName: 'mtre',
      description: 'Se projeter dans le futur',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'se projette dans le *Futur*',
      position: 44,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })
    const omniscientSkill = this.createSkill({
      name: 'omniscient',
      shortName: 'omn',
      description: 'Avoir une vision totale autour de soi',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'a une *Vision Totale* autour de soi',
      position: 45,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const messagerSkill = this.createSkill({
      name: 'messager',
      shortName: 'msg',
      description: "Envoie d'un message à une cible proche ou marquée",
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: "envoie d'un *Message* à une cible proche ou marquée",
      position: 46,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const nainSkill = this.createSkill({
      name: 'nain',
      shortName: 'nain',
      description: 'Rétrécir (+X/2 bonus pour esquiver Chair et Esprit)',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'rétrécit (+X/2 bonus pour esquiver Chair et Esprit)',
      position: 47,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const geantSkill = this.createSkill({
      name: 'geant',
      shortName: 'geant',
      description: 'Grandir (+X/2 bonus pour attaquer en Chair)',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'grandit (+X/2 bonus pour attaquer en Chair)',
      position: 48,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const vigieSkill = this.createSkill({
      name: 'vigie',
      shortName: 'vigie',
      description: 'Marquer un objet et sentir quand il est touché',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'marque un objet et sent quand il est touché',
      position: 49,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const amiSkill = this.createSkill({
      name: 'ami',
      shortName: 'ami',
      description: "Donner l'impression à une cible qu'on est son ami",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: "donne l'impression à une cible qu'on est son *Ami*",
      position: 50,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1,
      resistance: true
    })

    const chamanSkill = this.createSkill({
      name: 'chaman',
      shortName: 'chmn',
      description: 'Communiquer avec les animaux',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'communique avec les *Animaux*',
      position: 51,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const cryptesthesisteSkill = this.createSkill({
      name: 'cryptesthesiste',
      shortName: 'crypt',
      description: "Percevoir les souvenirs d'un objet",
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: "perçoit les *Souvenirs* d'un objet",
      position: 52,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const sageSkill = this.createSkill({
      name: 'sage',
      shortName: 'sage',
      description: 'Au moins X/2 réussites à chaque jet, -1 par tour',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'obtient au moins X/2 réussites à chaque jet, -1 par tour',
      position: 53,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const professeurSkill = this.createSkill({
      name: 'professeur',
      shortName: 'prof',
      description: 'Donner des PF à une cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'donne des *PF* à une cible',
      position: 54,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })
    const magicienSkill = this.createSkill({
      name: 'magicien',
      shortName: 'mag',
      description: 'Donner des PP à une cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'donne des *PP* à une cible',
      position: 55,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const empoisonneurSkill = this.createSkill({
      name: 'empoisonneur',
      shortName: 'emp',
      description: 'Empoisonner une cible (-1pv par tour)',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'empoisonne une cible (-1pv par tour)',
      position: 56,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1,
      resistance: true
    })

    const amnesiqueSkill = this.createSkill({
      name: 'amnesique',
      shortName: 'amn',
      description: 'Faire oublier sa présence aux adversaires',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait oublier sa présence aux adversaires',
      position: 57,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const pragmatiqueSkill = this.createSkill({
      name: 'pragmatique',
      shortName: 'prag',
      description: 'Annuler de la magie',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'annule de la magie',
      position: 58,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1,
      resistance: true
    })

    const parfumeurSkill = this.createSkill({
      name: 'parfumeur',
      shortName: 'parf',
      description: 'Créer des odeurs et des gouts',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'crée des odeurs et des gouts',
      position: 59,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const banquierSkill = this.createSkill({
      name: 'banquier',
      shortName: 'banq',
      description: 'Créer un espace où cacher des objets',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'crée un espace où cacher des objets',
      position: 60,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const colletSkill = this.createSkill({
      name: 'collet',
      shortName: 'clt',
      description: "Lier une cible à soi, qui ne peut plus s'éloigner",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: "lie une cible à soi, qui ne peut plus s'éloigner",
      position: 61,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const linguisteSkill = this.createSkill({
      name: 'linguiste',
      shortName: 'ling',
      description: "Compréhension écrite et orale d'une langue",
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: "comprend à l'écrit et à l'oral une langue",
      position: 62,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const equilibristeSkill = this.createSkill({
      name: 'equilibriste',
      shortName: 'equi',
      description: "Attaque en jet d'équilibre (somme des stats - somme des diff entre max et autres)",
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: "attaque en jet d'équilibre (somme des stats - somme des diff entre max et autres)",
      position: 63,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true,
      arcaneCost: 1
    })

    const marchandSkill = this.createSkill({
      name: 'marchand',
      shortName: 'marchand',
      description: 'mrchd deux cibles par un contrat magique',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'lie deux cibles par un contrat magique',
      position: 64,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })
    const mecanicienSkill = this.createSkill({
      name: 'mecanicien',
      shortName: 'meca',
      description: 'Animer des objets',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'anime des objets',
      position: 65,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const cadavreSkill = this.createSkill({
      name: 'cadavre',
      shortName: 'cdvr',
      description: 'Simuler un état de mort',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'simule un état de mort',
      position: 66,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true,
      arcaneCost: 1
    })

    const leprechaunSkill = this.createSkill({
      name: 'leprechaun',
      shortName: 'lep',
      description: 'Avoir de la chance',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'a de la chance',
      position: 67,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const bergerSkill = this.createSkill({
      name: 'berger',
      shortName: 'brg',
      description: "Percevoir où se trouver ce que l'on désire",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: "perçoit où se trouver ce que l'on désire",
      position: 68,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const reveSkill = this.createSkill({
      name: 'reve',
      shortName: 'reve',
      description: "Aller dans les rêves d'une cible",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: "va dans les rêves d'une cible",
      position: 69,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const orateurSkill = this.createSkill({
      name: 'orateur',
      shortName: 'ora',
      description: 'Réussite un jet pour encourager',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'réussit un jet pour encourager',
      position: 70,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const furieSkill = this.createSkill({
      name: 'furie',
      shortName: 'furie',
      description: 'Provoque un sentiment de colère à une cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'provoque un sentiment de colère à une cible',
      position: 71,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const ratSkill = this.createSkill({
      name: 'rat',
      shortName: 'rat',
      description: "Donne X malus aux ennemis pour le prochain jet d'Essence",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: "donne X malus aux ennemis pour le prochain jet d'Essence",
      position: 72,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const scorpionSkill = this.createSkill({
      name: 'scorpion',
      shortName: 'scrp',
      description: 'Donne X malus aux ennemis pour le prochain jet de Chair',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'donne X malus aux ennemis pour le prochain jet de Chair',
      position: 73,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const vautourSkill = this.createSkill({
      name: 'vautour',
      shortName: 'vtr',
      description: "Donne X malus aux ennemis pour le prochain jet d'Esprit",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: "donne X malus aux ennemis pour le prochain jet d'Esprit",
      position: 74,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })
    const balanceSkill = this.createSkill({
      name: 'balance',
      shortName: 'bal',
      description: 'Transférer X blessures sur une cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'transfère X blessures sur une cible',
      position: 75,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const savantSkill = this.createSkill({
      name: 'savant',
      shortName: 'sav',
      description: 'Protéger son esprit',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'protège son esprit',
      position: 76,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true,
      arcaneCost: 1
    })

    const archeologueSkill = this.createSkill({
      name: 'archeologue',
      shortName: 'arcg',
      description: 'Percevoir où se trouve un objet à proximité ou marqué',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'perçoit où se trouve un objet à proximité ou marqué',
      position: 77,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const gardienSkill = this.createSkill({
      name: 'gardien',
      shortName: 'gard',
      description: 'Ressent si un marqué est en danger',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'ressent si un marqué est en danger',
      position: 78,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const destructionSkill = this.createSkill({
      name: 'destruction',
      shortName: 'destr',
      description: 'Détruire une zone',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'détruit une zone',
      position: 79,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1,
      resistance: true,
      blessure: true
    })

    const conteurSkill = this.createSkill({
      name: 'conteur',
      shortName: 'cntr',
      description: 'Provoque un état de sommeil',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'provoque un état de sommeil',
      position: 80,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const lucioleSkill = this.createSkill({
      name: 'luciole',
      shortName: 'luc',
      description: 'Soigne X/2 PV à ses alliés à distance',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'soigne X/2 PV à ses alliés à distance',
      position: 81,
      successCalculation: SuccessCalculation.DIVISE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const chaperonSkill = this.createSkill({
      name: 'chaperon',
      shortName: 'chap',
      description: 'Téléporté une personne marqué ou visible vers soi',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'téléporte une personne marqué ou visible vers soi',
      position: 82,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const chauveSourisSkill = this.createSkill({
      name: 'chauvesouris',
      shortName: 'chvsr',
      description: 'Projeter son esprit pour entendre au loin',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'projette son esprit pour entendre au loin',
      position: 83,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const acrobateSkill = this.createSkill({
      name: 'acrobate',
      shortName: 'acro',
      description: "Pouvoir s'accrocher aux murs",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: "peut s'accrocher aux murs",
      position: 84,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })
    const terreurSkill = this.createSkill({
      name: 'terreur',
      shortName: 'ter',
      description: 'Provoque un sentiment de peur',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'provoque un sentiment de peur',
      position: 85,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })
    const TerreurSkill = this.createSkill({
      name: 'Terreur',
      shortName: 'Ter',
      description: 'Provoque un sentiment de peur',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.MAGIE,
      display: 'provoque un sentiment de peur',
      position: 1,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      dettesCost: 1
    })

    const ectoplasmeSkill = this.createSkill({
      name: 'ectoplasme',
      shortName: 'ecto',
      description: 'Projette une version visible de soit pour voir et entendre au loin',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'projette une version visible pour voir/entendre au loin',
      position: 86,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const torcheSkill = this.createSkill({
      name: 'torche',
      shortName: 'trch',
      description: 'Aura de soin (X tour avec 1 soin de 1 PV par tour)',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'aura de soin pour X tours',
      position: 87,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const survivantSkill = this.createSkill({
      name: 'survivant',
      shortName: 'surv',
      description: 'Protection contre la mort (pv de secours si on tombe KO)',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'protection contre la mort',
      position: 88,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const purificateurSkill = this.createSkill({
      name: 'purificateur',
      shortName: 'purf',
      description: 'Purification (eau/nourriture/maladie)',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'purifie eau, nourriture ou maladies',
      position: 89,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const reparateurSkill = this.createSkill({
      name: 'réparateur',
      shortName: 'rep',
      description: "Réparation d'objets ou de mécanismes",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'répare objets ou mécanismes',
      position: 90,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const voyantSkill = this.createSkill({
      name: 'voyant',
      shortName: 'voy',
      description: 'Scruter une personne à proximité ou précédemment marquée',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'scrute une personne proche ou marquée',
      position: 91,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const nomadeSkill = this.createSkill({
      name: 'nomade',
      shortName: 'nmd',
      description: 'Savoir exactement où on se situe',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'sait exactement où il se situe',
      position: 92,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true,
      arcaneCost: 1
    })

    const silenceSkill = this.createSkill({
      name: 'silence',
      shortName: 'slnc',
      description: 'Bloquer le son dans une zone',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'bloque le son dans une zone',
      position: 93,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const mortSkill = this.createSkill({
      name: 'mort',
      shortName: 'mort',
      description: 'Achève une personne avec 25% max de PV restant',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'achève une cible à 25% de PV ou moins',
      position: 94,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true,
      arcaneCost: 1
    })
    const analysteSkill = this.createSkill({
      name: 'analyste',
      shortName: 'anlst',
      description: "Scanner quelqu'un pour connaitre sa lignée, et ses PV, PF et PP courant et max",
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'scanne pour connaître lignée et stats',
      position: 95,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true,
      arcaneCost: 1
    })

    const farceurSkill = this.createSkill({
      name: 'farceur',
      shortName: 'farc',
      description: 'Ajoute un effet visuel et ou sonore à un objet quand on le touche pour X fois',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'ajoute un effet à un objet touché',
      position: 96,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const observateurSkill = this.createSkill({
      name: 'observateur',
      shortName: 'obsr',
      description: 'Obtenir la vision véritable (voir la magie, les auras, les êtres invisibles, etc...)',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'obtient vision véritable',
      position: 97,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true,
      arcaneCost: 1
    })

    const confesseurSkill = this.createSkill({
      name: 'confesseur',
      shortName: 'conf',
      description: 'Crée une zone de vérité où on ne peut mentir',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'crée une zone de vérité',
      position: 98,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const bouclierSkill = this.createSkill({
      name: 'bouclier',
      shortName: 'bclr',
      description: 'Réduit X dégats en réaction',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'réduit X dégâts',
      position: 99,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const pisteurSkill = this.createSkill({
      name: 'pisteur',
      shortName: 'pist',
      description: 'Perçoit une cible à proximité pour X heures',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'perçoit cible pour X heures',
      position: 100,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const pieuvreSkill = this.createSkill({
      name: 'pieuvre',
      shortName: 'pvr',
      description: "Ajoute des bras pour X tours, donnant une action supplémentaire d'attaque",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'ajoute des bras pour attaque supplémentaire',
      position: 101,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const sobreSkill = this.createSkill({
      name: 'sobre',
      shortName: 'sbr',
      description: 'Force un adversaire à se défendre avec une autre stat',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'force défense avec autre stat',
      position: 102,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true,
      arcaneCost: 1
    })

    const illumineSkill = this.createSkill({
      name: 'illuminé',
      shortName: 'ill',
      description: 'Communion avec son Être Supérieur',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'communion avec Être Supérieur',
      position: 103,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      isArcanique: true,
      arcaneCost: 1
    })

    const souhaitSkill = this.createSkill({
      name: 'souhait',
      shortName: 'sht',
      description: "Utilise n'importe quelle arcane ou modifie le monde avec contre-coup",
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'utilise arcanes ou modifie le monde',
      position: 104,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true,
      arcaneCost: 1
    })
    /*const planteSoutien = this.createSkill({
      name: 'Plante de soutien',
      shortName: 'pl-soutien',
      description: 'Invoquer une plante de soutien',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'invoque une *Plante de Soutien*',
      position: 31,
      invocationTemplate: charactersTemplates.get('Plante Soutien')
    })*/
    const coupDeSeve = this.createSkill({
      name: 'Coup de sève',
      shortName: 'Coup de sève',
      description: 'Donne des bénédictions pour un tour',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'donne des *Bénédictions* pour un tour',
      position: 31
    })
    /*const planteCombat = this.createSkill({
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
    const planteMagie = this.createSkill({
      name: 'Plante de magie',
      shortName: 'pl-magie',
      description: 'Invoquer une plante de magie',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'invoque une *Plante de Magie*',
      position: 33,
      invocationTemplate: charactersTemplates.get('Plante Magie')
    })*/
    const pollen = this.createSkill({
      name: 'Pollen',
      shortName: 'pollen',
      description: 'Crèe un effet magique (poison, soin, etc...)',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'génère un *Pollen Magique*',
      position: 31,
      resistance: true,
      blessure: true
    })
    /*const planteEnvahissante = this.createSkill({
      name: 'Plante envahissante',
      shortName: 'pl-envahis.',
      description: 'Invoquer une plante envahissante',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'invoque une *Plante Envahissante*',
      position: 34,
      invocationTemplate: charactersTemplates.get('Plante Envahissante')
    })*/

    const reconnaissanceNaturelle = this.createSkill({
      name: 'Reco. naturelle',
      shortName: 'reco nat.',
      description: 'Analyser le niveau courant de la Nature',
      allAttribution: false,
      stat: SkillStat.CUSTOM,
      category: DisplayCategory.MAGIE,
      display: 'analyse le *Niveau de la Nature*',
      position: 9,
      successCalculation: SuccessCalculation.CUSTOM,
      secret: true
    })

    const lienNaturel = this.createSkill({
      name: 'Lien naturel',
      shortName: 'lien nat.',
      description: 'Retirer 2 PV à une plante invoquée pour annuler une blessure',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.MAGIE,
      display: 'se *soigne* en puissant dans ses plantes',
      precision: 'Rappel : retirer 2 PV à une plante pour en gagner 1',
      successCalculation: SuccessCalculation.AUCUN,
      position: 10
    })

    const soulevementDeLaNature = this.createSkill({
      name: 'Soulèvement de la Nature',
      shortName: 'soulev nat.',
      description: 'Attaque de Chair à 2*Nature, 1 dégat aux plantes invoquées',
      allAttribution: false,
      stat: SkillStat.CUSTOM,
      category: DisplayCategory.MAGIE,
      display: 'provoque un *Soulèvement de la Nature*',
      precision: 'Rappel : retirer 1 PV à chaque plante invoquée',
      position: 11,
      dettesCost: 1,
      resistance: true,
      blessure: true
    })

    const animationDeLaNature = this.createSkill({
      name: 'Anim. de la Nature',
      shortName: 'anim nat.',
      description: 'Donne une consscience avancée à une plante',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'réalise une *Animation de la Nature*',
      position: 12,
      dettesCost: 1
    })

    const communicationAvecLaNature = this.createSkill({
      name: 'Comm. avec la Nature',
      shortName: 'comm nat.',
      description: 'Lien avec une plante pour communiquer avec elle tant que la Nature est supérieure à 2',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'réalise une *Communication avec la Nature*',
      position: 13,
      dettesCost: 1
    })

    const voieDesArbres = this.createSkill({
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

    const lienAvatar = this.createSkill({
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

    const brasRobotique = this.createSkill({
      name: 'Bras Robotique',
      shortName: 'bras',
      description: 'Attaque double en Chair contre un PV perdu',
      allAttribution: false,
      stat: SkillStat.CHAIR,
      category: DisplayCategory.SOLDATS,
      display: 'utilise son *Bras Mécanique*',
      position: 1,
      pvCost: 1,
      resistance: true,
      blessure: true
    })

    const oeilBionique = this.createSkill({
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

    const munitionCourante = this.createSkill({
      name: 'Mun. courantes',
      shortName: 'm-cour',
      description: 'Utilise une munition courante',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.SOLDATS,
      display: 'utilise une *Munition courante*',
      position: 3,
      resistance: true,
      blessure: true
    })

    const munitionLethale = this.createSkill({
      name: 'Mun. léthales',
      shortName: 'm-leth',
      description: 'Utilise une munition léthale, x2',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.SOLDATS,
      display: 'utilise une *Munition léthale*',
      position: 4,
      successCalculation: SuccessCalculation.DOUBLE,
      soldatCost: 1,
      resistance: true,
      blessure: true
    })

    const munitionAffaiblissante = this.createSkill({
      name: 'Mun. affaiblissantes',
      shortName: 'm-aff',
      description: 'Utilise une munition affaiblissante, +1 malus à la cible touchée',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.SOLDATS,
      display: 'utilise une *Munition affaiblissante*',
      position: 5,
      soldatCost: 2,
      resistance: true,
      blessure: true
    })

    const munitionPeste = this.createSkill({
      name: 'Mun. peste',
      shortName: 'm-pest',
      description: 'Utilise une munition peste, +1 dégat à la cible touchée à chacune de ses actions',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.SOLDATS,
      display: 'utilise une *Munition peste*',
      position: 6,
      soldatCost: 2,
      resistance: true,
      blessure: true
    })

    const munitionMarquage = this.createSkill({
      name: 'Mun. marquage',
      shortName: 'm-marq',
      description: 'Utilise une munition marquage, marque la cible touchée',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.SOLDATS,
      display: 'utilise une *Munition géolocalisable*',
      position: 7,
      soldatCost: 3,
      resistance: true,
      blessure: true
    })

    const munitionDegenerative = this.createSkill({
      name: 'Mun. dégénérative',
      shortName: 'm-deg',
      description: 'Utilise une munition dégénérative, soins divisés par 2',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.SOLDATS,
      display: 'utilise une *Grenade dégénérative*',
      position: 8,
      soldatCost: 2,
      resistance: true,
      blessure: true
    })

    const munitionFumigene = this.createSkill({
      name: 'Gr. fumigène',
      shortName: 'g-fum',
      description: 'Utilise une munition fumigène, crée un nuage de fumée',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.SOLDATS,
      display: 'utilise une *Grenade fumigène*',
      position: 9,
      soldatCost: 1,
      resistance: true,
      blessure: true
    })

    const munitionFlash = this.createSkill({
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

    const perturbationEssence = this.createSkill({
      name: 'perturbation essence',
      shortName: 'pert-ess',
      description: "Empeche un ennemi d'utiliser sa magie",
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.PACIFICATEURS,
      display: 'Perturbe essence',
      position: 1,
      successCalculation: SuccessCalculation.SIMPLE,
      ppCost: 1,
      precision: 'Chaque réussite annule une réussite du jet de magie de la cible'
    })

    const destructionEssence = this.createSkill({
      name: 'destruction essence',
      shortName: 'destr-ess',
      description: 'Fait exploser la magie',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.PACIFICATEURS,
      display: 'Détruit essence',
      position: 2,
      successCalculation: SuccessCalculation.SIMPLE,
      dettesCost: 1,
      resistance: true,
      precision: 'Une Malédiction par PP en moins pour résister, rend 1 PP si au moins un dégat infligé'
    })

    const volMagie = this.createSkill({
      name: 'Vol de magie',
      shortName: 'vol-mag',
      description: 'Vol une magie et la stocke',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.PACIFICATEURS,
      display: 'Vol la magie',
      position: 3,
      successCalculation: SuccessCalculation.AUCUN,
      etherCost: 1
    })

    const empruntMagie = this.createSkill({
      name: 'Emprunt de magie',
      shortName: 'empr-mag',
      description: "Emprunte une magie et la lance immédiatement avec les stats de l'adversaire",
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.PACIFICATEURS,
      display: 'Emprunt de magie',
      position: 3,
      arcanePrimeCost: 0,
      successCalculation: SuccessCalculation.AUCUN,
      etherCost: 1
    })

    const bouteilleKyma = this.createSkill({
      name: 'Bouteille de Kyma',
      shortName: 'btl',
      description: 'Se réfugier dans la bouteille',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      display: "utilise l'*Arcane Prime* de la *Bouteille de Kyma*",
      position: 1,
      arcanePrimeCost: 1,
      owner: 'Atlantide'
    })

    const poignardTemporelle = this.createSkill({
      name: 'Poignard Temporel',
      shortName: 'pgnd',
      description: 'Invoquer un commandant du futur',
      allAttribution: false,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'millia',
      display: "utilise l'*Arcane Prime* du *Poignard Temporelle*",
      position: 1,
      arcanePrimeCost: 1,
      customRolls: '1d10',
      successCalculation: SuccessCalculation.CUSTOM,
      stat: SkillStat.CUSTOM
    })

    const bagueDeirdre = this.createSkill({
      name: 'Bague de Deirdre',
      shortName: 'bgdeird',
      description: 'Contrôler un objet',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'deirdre',
      display: "utilise l'*Arcane Prime* de la *Bague de Deirdre*",
      position: 1,
      arcanePrimeCost: 1
    })

    const jetonLilou = this.createSkill({
      name: 'Jeton de Lilou',
      shortName: 'jtn',
      description: 'Voir les probabilités',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'lilou',
      display: "utilise l'*Arcane Prime* du *Jeton de Lilou*",
      position: 1,
      arcanePrimeCost: 1
    })

    const beretRoger = this.createSkill({
      name: 'Béret de Roger',
      shortName: 'brt',
      description: 'Passer inaperçu',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'roger',
      display: "utilise l'*Arcane Prime* du *Béret de Roger*",
      position: 1,
      arcanePrimeCost: 1
    })

    const ciel = this.createSkill({
      name: 'Ciel',
      shortName: 'ciel',
      description: 'Invoquer Ciel',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'ayoub',
      display: "utilise l'*Arcane Prime* de *Ciel*",
      position: 1,
      arcanePrimeCost: 1
    })

    const guiboleViktor = this.createSkill({
      name: 'Guibole',
      shortName: 'guib',
      description: 'Bloque une Apothéose et crée un fruit',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'viktor',
      display: "utilise l'*Arcane Prime* de la *Guibole de Viktor*",
      position: 1,
      arcanePrimeCost: 1
    })

    const carteTara = this.createSkill({
      name: 'Carte de Tara',
      shortName: 'carte',
      description: 'Crée un effet aléatoire (fascination, amour, etc...)',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      display: "utilise l'*Arcane Prime* de la *Carte de Tara*",
      owner: 'tara',
      position: 1,
      arcanePrimeCost: 1
    })

    const devorer = this.createSkill({
      name: 'Dévorer',
      shortName: 'devorer',
      description: 'Dévorer une âme',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      successCalculation: SuccessCalculation.DOUBLE,
      category: DisplayCategory.MAGIE,
      display: 'tente de dévorer une âme',
      position: 1,
      arcanePrimeCost: 1
    })

    const tatouage = this.createSkill({
      name: 'Tatouage',
      shortName: 'tat',
      description: 'Se transformer la plus grande peur de la cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'aurélien',
      display: "utilise l'*Arcane Prime* du *Tatouage de Terreur*",
      position: 1,
      arcanePrimeCost: 1
    })

    const tarotMathieu = this.createSkill({
      name: 'Tarot de Mathieu',
      shortName: 'tarot',
      description: 'Crée une arcane aléatoirement',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'mathieu',
      display: "utilise l'*Arcane Prime* du *Tarot de Mathieu*",
      position: 1,
      arcanePrimeCost: 1
    })

    const chapeauMerlin = this.createSkill({
      name: 'Chapeau de Merlin',
      shortName: 'merlin',
      description: 'Donne accès à X arcanes',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'rain',
      display: "utilise l'*Arcane Prime* du *Chapeau de Merlin*",
      position: 1,
      arcanePrimeCost: 1
    })

    const medaillonRoy = this.createSkill({
      name: 'Médaillon de Roy',
      shortName: 'medroy',
      description: 'Echange les émotions entre les porteurs du médaillon',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'roy',
      display: "utilise l'*Arcane Prime* du *Médaillon de Roy*",
      position: 1,
      arcanePrimeCost: 1
    })

    const aureoleIllusion = this.createSkill({
      name: 'Aureole d Illusion',
      shortName: 'aureole',
      description: 'Crée une illusion du décor de la pièce',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      successCalculation: SuccessCalculation.SIMPLE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: "utilise l'*Auréole d'Illusion*",
      position: 1,
      arcanePrimeCost: 1
    })

    const chevaliereDiscorde = this.createSkill({
      name: 'Chevalière de Discorde',
      shortName: 'discord',
      description: 'Applique un besoin de se battre à une cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      successCalculation: SuccessCalculation.SIMPLE,
      owner: 'Bouclier',
      display: 'utilise la *Chevalière de Discorde*',
      position: 1,
      arcanePrimeCost: 1
    })

    const bagueDeFoyer = this.createSkill({
      name: 'Bague de Foyer',
      shortName: 'foyer',
      description: 'Renvoie l utilisateur dans le lieu où il se sent en sécurité',
      allAttribution: false,
      stat: SkillStat.FIXE,
      successCalculation: SuccessCalculation.AUCUN,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise la *Bague de Foyer*',
      position: 1,
      arcanePrimeCost: 1
    })

    const pyramideKheops = this.createSkill({
      name: 'Pyramide de Khéops',
      shortName: 'kheops',
      description: 'Perte des dettes des Ombres',
      allAttribution: false,
      stat: SkillStat.FIXE,
      successCalculation: SuccessCalculation.AUCUN,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Prince',
      display: 'utilise la *Pyramide de Kheops*',
      position: 1,
      arcanePrimeCost: 1
    })

    const tourDeBable = this.createSkill({
      name: 'Tour de Babel',
      shortName: 'babel',
      description: 'Ouvre un passage vers un autre plan dans l au delà',
      allAttribution: false,
      stat: SkillStat.FIXE,
      successCalculation: SuccessCalculation.AUCUN,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Prince',
      display: 'utilise la *Tour de Babel*',
      position: 1,
      arcanePrimeCost: 1
    })

    const collierDeNonDetection = this.createSkill({
      name: 'Collier de Non Détection',
      shortName: 'nonDetect',
      description: 'Permet d echapper aux détections diverses',
      allAttribution: false,
      stat: SkillStat.FIXE,
      successCalculation: SuccessCalculation.AUCUN,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Renouveau',
      display: 'utilise le *Collier de Non Détection*',
      position: 1,
      arcanePrimeCost: 1
    })

    const dagueAmes = this.createSkill({
      name: 'Dague des Âmes',
      shortName: 'dague',
      description: "Absorbe l âme d'une cible mourante pour retrouver sa vitalité",
      allAttribution: false,
      stat: SkillStat.FIXE,
      successCalculation: SuccessCalculation.AUCUN,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise la *Dague des Âmes*',
      position: 1,
      arcanePrimeCost: 1
    })

    const montreTemporelle = this.createSkill({
      name: 'Montre Temporelle',
      shortName: 'ontr',
      description: 'Fige le temps',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      successCalculation: SuccessCalculation.SIMPLE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise la *Dague des Âmes*',
      position: 1,
      arcanePrimeCost: 1
    })

    const flasqueJohn = this.createSkill({
      name: 'Flasque de John',
      shortName: 'flasque',
      description: 'Retrouver sa vitalité et même davantage, mais gueule de bois en contact avec le Dévoreur',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise la *Flasque de John*',
      position: 1,
      arcanePrimeCost: 1
    })

    const pokeball = this.createSkill({
      name: 'Pokéball',
      shortName: 'pkb',
      description: 'Invoque aléatoirement un pokémon',
      allAttribution: false,
      stat: SkillStat.CUSTOM,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'invoque un *Pokémon*',
      position: 2,
      arcanePrimeCost: 1,
      customRolls: '1d150',
      successCalculation: SuccessCalculation.CUSTOM
    })

    const boiteASouvenir = this.createSkill({
      name: 'Boite à Souvenir',
      shortName: 'souv',
      description: 'Enferme un souvenir que seul l utilisateur se rappelle',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Atlantide',
      display: 'utilise la *Boîte à Souvenir*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.AUCUN
    })

    const corneAbondance = this.createSkill({
      name: 'Corne d Abondance',
      shortName: 'corne',
      description: 'Crée de la nourriture',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Atlantide',
      display: 'utilise la *Corne d Abondance*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.SIMPLE
    })

    const pierreReconfort = this.createSkill({
      name: 'Pierre de Réconfort',
      shortName: 'reconf',
      description: 'Crée une illusion qui permet de réconforter quelqu un',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Atlantide',
      display: 'utilise la *Pierre de Réconfort*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.SIMPLE
    })

    const collierLien = this.createSkill({
      name: 'Collier de Lien Eternel',
      shortName: 'coll',
      description: 'Lie deux existences ensemble, accordant l esperance de vie',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Atlantide',
      display: 'utilise la *Pierre de Réconfort*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.AUCUN
    })

    const compasDuDésir = this.createSkill({
      name: 'Compas du Désir',
      shortName: 'compas',
      description: 'Donne la direction de ce que l on desire le plus au monde',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Atlantide',
      display: 'utilise le *Compas du Désir*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.AUCUN
    })

    const linceulMaudit = this.createSkill({
      name: 'Linceul du Maudit',
      shortName: 'linc',
      description: 'Linceul du Maudit',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Atlantide',
      display: 'utilise le *Linceul du Maudit*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.SIMPLE
    })

    const mailletMinos = this.createSkill({
      name: 'Maillet de Minos',
      shortName: 'minos',
      description: 'Dommages pyschiques lorsqu un souvenir de péché passé est exprimé',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise le *Maillet de Minos*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.AUCUN
    })

    const phareAlex = this.createSkill({
      name: 'Phare d Alexandrie',
      shortName: 'alex',
      description: 'Perte des dettes pour les champions de lumière',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Prince',
      display: 'utilise le *Phare d Alexandrie*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.AUCUN
    })

    const templeArtemis = this.createSkill({
      name: 'Temple Artémis',
      shortName: 'arté',
      description: 'Perte des dettes pour les champions de vent',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise le *Temple d Artémis*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.AUCUN
    })

    const jardinBabylone = this.createSkill({
      name: 'Jardin de Babylone',
      shortName: 'baby',
      description: 'Perte des dettes pour les champions de feu',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise les *Jardins Suspendus de Babylone*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.AUCUN
    })

    const lunettesPremo = this.createSkill({
      name: 'Lunette de prémonition',
      shortName: 'prémo',
      description: 'Voir les secondes à venir, ou avoir des visions d evenements dans la journée',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Atlantide',
      display: 'utilise les *Lunettes de Prémonitions*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.AUCUN
    })

    const listeMechants = this.createSkill({
      name: 'Liste des méchants',
      shortName: 'méch',
      description: 'Invoque un monstre à minuit qui va attaquer chaque nuit les gens marqué sur la liste',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise la *Liste des Méchants*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.SIMPLE
    })

    const lyreNolan = this.createSkill({
      name: 'Lyre de Nolan',
      shortName: 'méch',
      description: 'Permett d avoir une vision de la personne qu on aime le plus (au sens romantique)',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise la *Lyre de Nolan*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.SIMPLE
    })

    const melrich = this.createSkill({
      name: 'Epée de Melrich',
      shortName: 'melr',
      description: 'Empêche les soirs de blessures en esprit et chair, possible de récupérer les dégats soi même',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise l *Epée de Melrich*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.AUCUN
    })

    const menottes = this.createSkill({
      name: 'Menottes de Cerbères',
      shortName: 'cerb',
      description:
        'Permet de fusionner en additionnant la meilleure stat et prenant les 2 moins fortes pour les autres',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise les *Menottes de Cerbères*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.AUCUN
    })

    const miroirBronze = this.createSkill({
      name: 'Miroir de Bronze',
      shortName: 'bronz',
      description: '1er trésor impérial japonais, inverse la manière de penser de la cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise le *Miroir de Bronze*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.SIMPLE
    })

    const medaillonMagatama = this.createSkill({
      name: 'Médaillon de Magatama',
      shortName: 'maga',
      description: '2ème trésor impérial japonais, inverse la moralité de la cible',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise le *Médaillon de Magatama*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.SIMPLE
    })

    const mosaiqueGaudhi = this.createSkill({
      name: 'Mosaïque de Gaudhi',
      shortName: 'gaudhi',
      description: 'Torture une arcane pour booster son pouvoir',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise la *Mosaïque de Gaudhi*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.SIMPLE
    })

    const nounours = this.createSkill({
      name: 'Nounours',
      shortName: 'nounours',
      description: 'Invoque un ourson géant de combat',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise *Nounours*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.SIMPLE
    })

    const skateWesh = this.createSkill({
      name: 'Skate de Wesh',
      shortName: 'wesh',
      description: 'Se multiplie, chaque clone a 1 stat en moins que le précédent',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Renouveau',
      display: 'utilise le *Skate de Wesh*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.SIMPLE
    })

    const canneMartial = this.createSkill({
      name: 'Canne de Martial',
      shortName: 'martial',
      description: 'Permet de connaître le désir principal de sa cible',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Renouveau',
      display: 'utilise la *Canne de Martial*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.AUCUN
    })

    const statueDeZeus = this.createSkill({
      name: 'Statue de Zeusl',
      shortName: 'zeus',
      description: 'Perte des dettes pour un Champion de Foudre, et résistance à la perte de Contrôle',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise la *Statue de Zeus*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.AUCUN
    })

    const amphoreDyonisos = this.createSkill({
      name: 'Amphore de Dyonisos',
      shortName: 'dyonisos',
      description: 'Création d un espace où l ivresse devient réalité, considérée comme très dangereuse',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise l*Amphore de Dyonisos*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.SIMPLE
    })

    const armureAdamantium = this.createSkill({
      name: 'Armure Adamantium',
      shortName: 'adam',
      description: 'Encaisse une attaque à la place de quelqu un d autre',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Prince',
      display: 'utilise l*Armure d Adamantium*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.AUCUN
    })

    const ceintureIntransigeance = this.createSkill({
      name: 'Intransigeance de Radhamantes',
      shortName: 'radham',
      description: 'Refuse un effet négatif en réaction',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise l *Intransigeance de Radhamantes*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.AUCUN
    })

    const cléDePorte = this.createSkill({
      name: 'Clé de Porte',
      shortName: 'porte',
      description: 'Marque une porte, ou ouvre une porte vers une autre porte marquée',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise la *Clé de Porte*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.AUCUN
    })

    const craieDePorte = this.createSkill({
      name: 'Craie de Porte',
      shortName: 'craie',
      description: 'Permet de dessiner X portes et/ou fenêtres qui deviennent réelles, -1 par heure',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Renouveau',
      display: 'utilise la *Craie de Porte*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.SIMPLE
    })

    const hacheDeSerment = this.createSkill({
      name: 'Hache de Serment',
      shortName: 'hache',
      description: 'Jure de tuer une cible, avantage sur elle et désavantage sur les autres jusqu a sa mort',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES_PRIMES,
      owner: 'Bouclier',
      display: 'utilise la *Hache de Serment*',
      position: 2,
      arcanePrimeCost: 1,
      successCalculation: SuccessCalculation.AUCUN
    })
    return [
      bouteilleKyma,
      ceintureIntransigeance,
      armureAdamantium,
      cléDePorte,
      craieDePorte,
      hacheDeSerment,
      amphoreDyonisos,
      statueDeZeus,
      canneMartial,
      poignardTemporelle,
      bagueDeirdre,
      skateWesh,
      nounours,
      mosaiqueGaudhi,
      medaillonMagatama,
      miroirBronze,
      menottes,
      melrich,
      lyreNolan,
      listeMechants,
      lunettesPremo,
      jardinBabylone,
      templeArtemis,
      phareAlex,
      linceulMaudit,
      mailletMinos,
      compasDuDésir,
      collierLien,
      pierreReconfort,
      corneAbondance,
      boiteASouvenir,
      jetonLilou,
      beretRoger,
      ciel,
      guiboleViktor,
      carteTara,
      devorer,
      tarotMathieu,
      chapeauMerlin,
      medaillonRoy,
      flasqueJohn,
      empruntMagie,
      destructionEssence,
      volMagie,
      perturbationEssence,
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
      jugeAmelioreSkill,
      arbreSkill,
      phoenixSkill,
      phoenixAmelioreSkill,
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
      TerreurSkill,
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
      liberationArcaniqueSkill,
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
      //planteSoutien,
      communicationArcaniqueSkill,
      boostArcaniqueSkill,
      collierDeNonDetection,
      dagueAmes,
      montreTemporelle,
      pyramideKheops,
      tourDeBable,
      aureoleIllusion,
      chevaliereDiscorde,
      bagueDeFoyer,
      blocageArcaniqueSkill,
      copieArcaniqueSkill,
      lienAuxVoyageursSkill,
      peurSkill,
      soin,
      formeAqueuse,
      soinMental,
      vol,
      armure,
      malediction,
      speed,
      invisibilite,
      //planteMagie,
      //planteCombat,
      //planteEnvahissante,
      //planteSoutien,
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
  static getSkillsInvocation(charactersTemplates: Map<string, DBCharacterTemplate>): Omit<DBSkill, 'id'>[] {
    const planteSoutien = this.createSkill({
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
    const planteCombat = this.createSkill({
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
    const planteMagie = this.createSkill({
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
    const planteEnvahissante = this.createSkill({
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
    return [planteSoutien, planteMagie, planteCombat, planteEnvahissante, planteSoutien]
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
    isHeal?: boolean
    resistance?: boolean
    help?: boolean
    blessure?: boolean
    allowsPf?: boolean
    allowsPp?: boolean
    limitedUse?: number
    pvCost?: number
    pfCost?: number
    ppCost?: number
    dettesCost?: number
    etherCost?: number
    arcaneCost?: number
    arcanePrimeCost?: number
    customRolls?: string
    successCalculation?: SuccessCalculation
    secret?: boolean
    invocationTemplate?: DBCharacterTemplate
    precision?: string
    soldatCost?: number
    owner?: string
  }): Omit<DBSkill, 'id'> {
    return {
      name: p.name,
      owner: p.owner || '',
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
      etherCost: p.etherCost || 0,
      arcanePrimeCost: p.arcanePrimeCost || 0,
      customRolls: p.customRolls || '',
      successCalculation: p.successCalculation || SuccessCalculation.SIMPLE,
      secret: p.secret || false,
      display: p.display,
      position: p.position,
      isArcanique: p.isArcanique,
      isHeal: p.isHeal || false,
      resistance: p.resistance || false,
      help: p.help || false,
      blessure: p.blessure || false,
      invocationTemplate: p.invocationTemplate || null,
      invocationTemplateName: p.invocationTemplate ? p.invocationTemplate.name : null,
      soldatCost: p.soldatCost || 0,
      classes: [],
      bloodlines: [],
      characters: [],
      characterTemplates: []
    }
  }
}
