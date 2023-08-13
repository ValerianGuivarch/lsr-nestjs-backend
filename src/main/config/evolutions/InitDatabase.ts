import { InitCharacters } from './InitCharacters'
import { DBApotheose } from '../../data/database/apotheoses/DBApotheose'
import { DBBloodlineApotheose } from '../../data/database/apotheoses/DBBloodlineApotheose'
import { DBCharacterApotheose } from '../../data/database/apotheoses/DBCharacterApotheose'
import { DBClasseApotheose } from '../../data/database/apotheoses/DBClasseApotheose'
import { DBBloodline } from '../../data/database/bloodlines/DBBloodline'
import { DBCharacter } from '../../data/database/character/DBCharacter'
import { DBCharacterTemplate } from '../../data/database/character/DBCharacterTemplate'
import { DBClasse } from '../../data/database/classes/DBClasse'
import { DBBloodlineProficiency } from '../../data/database/proficiencies/DBBloodlineProficiency'
import { DBCharacterProficiency } from '../../data/database/proficiencies/DBCharacterProficiency'
import { DBClasseProficiency } from '../../data/database/proficiencies/DBClasseProficiency'
import { DBProficiency } from '../../data/database/proficiencies/DBProficiency'
import { DBBloodlineSkill } from '../../data/database/skills/DBBloodlineSkill'
import { DBCharacterSkill } from '../../data/database/skills/DBCharacterSkill'
import { DBClasseSkill } from '../../data/database/skills/DBClasseSkill'
import { DBSkill } from '../../data/database/skills/DBSkill'
import { DisplayCategory } from '../../domain/models/characters/DisplayCategory'
import { CharacterTemplateReferential } from '../../domain/models/invocation/CharacterTemplateReferential'
import { SuccessCalculation } from '../../domain/models/roll/SuccessCalculation'
import { SkillOwnedUse } from '../../domain/models/skills/SkillOwnedUse'
import { SkillStat } from '../../domain/models/skills/SkillStat'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InitDatabase {
  constructor(
    @InjectRepository(DBClasse, 'postgres')
    private dbClasseRepository: Repository<DBClasse>,
    @InjectRepository(DBBloodline, 'postgres')
    private dbBloodlineRepository: Repository<DBBloodline>,
    @InjectRepository(DBSkill, 'postgres')
    private dbSkillRepository: Repository<DBSkill>,
    @InjectRepository(DBCharacter, 'postgres')
    private dbCharacterRepository: Repository<DBCharacter>,
    @InjectRepository(DBProficiency, 'postgres')
    private dbProficiencyRepository: Repository<DBProficiency>,
    @InjectRepository(DBClasseSkill, 'postgres')
    private dbClasseSkillRepository: Repository<DBClasseSkill>,
    @InjectRepository(DBBloodlineSkill, 'postgres')
    private dbBloodlineSkillRepository: Repository<DBBloodlineSkill>,
    @InjectRepository(DBCharacterSkill, 'postgres')
    private dbCharacterSkillRepository: Repository<DBCharacterSkill>,
    @InjectRepository(DBClasseProficiency, 'postgres')
    private dbClasseProficiencyRepository: Repository<DBClasseProficiency>,
    @InjectRepository(DBBloodlineProficiency, 'postgres')
    private dbBloodlineProficiencyRepository: Repository<DBBloodlineProficiency>,
    @InjectRepository(DBCharacterProficiency, 'postgres')
    private dbCharacterProficiencyRepository: Repository<DBCharacterProficiency>,
    @InjectRepository(DBApotheose, 'postgres')
    private dbApotheoseRepository: Repository<DBApotheose>,
    @InjectRepository(DBClasseApotheose, 'postgres')
    private dbClasseApotheoseRepository: Repository<DBClasseApotheose>,
    @InjectRepository(DBBloodlineApotheose, 'postgres')
    private dbBloodlineApotheoseRepository: Repository<DBBloodlineApotheose>,
    @InjectRepository(DBCharacterApotheose, 'postgres')
    private dbCharacterApotheoseRepository: Repository<DBCharacterApotheose>,
    @InjectRepository(DBCharacterTemplate, 'postgres')
    private dbCharacterTemplateRepository: Repository<DBCharacterTemplate>
  ) {}

  async initDatabase(): Promise<void> {
    await this.dbClasseSkillRepository.delete({})
    await this.dbBloodlineSkillRepository.delete({})
    await this.dbCharacterSkillRepository.delete({})
    await this.dbClasseApotheoseRepository.delete({})
    await this.dbBloodlineApotheoseRepository.delete({})
    await this.dbCharacterApotheoseRepository.delete({})
    await this.dbClasseProficiencyRepository.delete({})
    await this.dbBloodlineProficiencyRepository.delete({})
    await this.dbCharacterProficiencyRepository.delete({})
    await this.dbCharacterRepository.delete({})
    await this.dbClasseRepository.delete({})
    await this.dbBloodlineRepository.delete({})
    await this.dbSkillRepository.delete({})
    await this.dbApotheoseRepository.delete({})
    await this.dbProficiencyRepository.delete({})
    await this.dbCharacterTemplateRepository.delete({})
    const charactersTemplates = await this.initCharactersTemplates()
    const skills = await this.initSkills(charactersTemplates)
    const proficiencies = await this.initProficiencies()
    const apotheoses = await this.initApotheoses()
    const classes = await this.initClasses()
    const bloodlines = await this.initBloodlines()
    const characters = await this.initCharacters(classes, bloodlines)
    await this.skillsAttribution(skills, classes, bloodlines, characters)
    await this.proficienciesAttribution(proficiencies, classes, bloodlines, characters)
    await this.apotheosesAttribution(apotheoses, classes, bloodlines, characters)
  }

  async initCharactersTemplates(): Promise<Map<string, DBCharacterTemplate>> {
    const jonathanLight: DBCharacterTemplate = this.createCharacterTemplate({
      name: 'summonLight',
      chairValueReferential: CharacterTemplateReferential.SUCCESS,
      chairValueRule: 1,
      espritValueReferential: CharacterTemplateReferential.SUCCESS,
      espritValueRule: 1,
      essenceValueReferential: CharacterTemplateReferential.SUCCESS,
      essenceValueRule: 1,
      pvMaxValueReferential: CharacterTemplateReferential.SUCCESS,
      pvMaxValueRule: 1,
      pfMaxValueReferential: CharacterTemplateReferential.SUCCESS,
      pfMaxValueRule: 1,
      ppMaxValueReferential: CharacterTemplateReferential.SUCCESS,
      ppMaxValueRule: 1,
      picture: ''
    })

    const newCharactersTemplate = [jonathanLight]
    const charactersTemplate = new Map<string, DBCharacterTemplate>()
    for (const characterTemplateData of newCharactersTemplate) {
      const existingCharacterTemplate = await this.dbCharacterTemplateRepository.findOneBy({
        name: characterTemplateData.name
      })
      if (!existingCharacterTemplate) {
        const characterTemplate = new DBCharacterTemplate()
        Object.assign(characterTemplate, characterTemplateData)
        const createdCharacterTemplate = await this.dbCharacterTemplateRepository.save(characterTemplate)
        charactersTemplate.set(characterTemplate.name, createdCharacterTemplate)
      } else {
        charactersTemplate.set(existingCharacterTemplate.name, existingCharacterTemplate)
      }
    }
    return charactersTemplate
  }

  async initCharacters(
    classes: Map<string, DBClasse>,
    bloodlines: Map<string, DBBloodline>
  ): Promise<Map<string, DBCharacter>> {
    const newCharacters = InitCharacters.getCharacters(classes, bloodlines)
    const characters = new Map<string, DBCharacter>()
    for (const characterData of newCharacters) {
      const existingCharacter = await this.dbCharacterRepository.findOneBy({ name: characterData.name })
      if (!existingCharacter) {
        const character = new DBCharacter()
        Object.assign(character, characterData)
        const createdCharacter = await this.dbCharacterRepository.save(character)
        characters.set(character.name, createdCharacter)
      } else {
        characters.set(existingCharacter.name, existingCharacter)
      }
    }
    return characters
  }
  async initSkills(charactersTemplates: Map<string, DBCharacterTemplate>): Promise<Map<string, DBSkill>> {
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
      position: 1,
      ppCost: 1
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
      shortName: 'phantom',
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
      shortName: 'illusionist',
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
      shortName: 'comedien',
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
      shortName: 'mentaliste',
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
      shortName: 'erudit',
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
      shortName: 'ivrogne',
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
      shortName: 'arbre',
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
      shortName: 'necromancien',
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
      shortName: 'licorne',
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
      shortName: 'chouette',
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
      shortName: 'cheval',
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
      shortName: 'diablotin',
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
      shortName: 'protecteur',
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
      shortName: 'corbeau',
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
      shortName: 'araignee',
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
      shortName: 'tisserand',
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
      shortName: 'commandant',
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
      shortName: 'pretre',
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
      shortName: 'bourreau',
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
      shortName: 'marionnettiste',
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
      shortName: 'taureau',
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
      shortName: 'renard',
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
      shortName: 'miroir',
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
      shortName: 'devin',
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
      shortName: 'peintre',
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
      shortName: 'telepathe',
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
      shortName: 'montre',
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
      shortName: 'omniscient',
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
      shortName: 'messager',
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
      shortName: 'chaman',
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
      shortName: 'cryptesthesiste',
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
      shortName: 'professeur',
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
      shortName: 'magicien',
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
      shortName: 'empoisonneur',
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
      shortName: 'amnesique',
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
      shortName: 'pragmatique',
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
      shortName: 'parfumeur',
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
      shortName: 'banquier',
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
      shortName: 'collet',
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
      shortName: 'linguiste',
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
      shortName: 'equilibriste',
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
      description: 'Lier deux cibles par un contrat magique',
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
      shortName: 'mecanicien',
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
      shortName: 'cadavre',
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
      shortName: 'leprechaun',
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
      shortName: 'berger',
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
      shortName: 'orateur',
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
      shortName: 'scorpion',
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
      shortName: 'vautour',
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
      shortName: 'balance',
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
      shortName: 'savant',
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
      shortName: 'archeologue',
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
      shortName: 'gardien',
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
      shortName: 'destruction',
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
      shortName: 'conteur',
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
      shortName: 'luciole',
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
      shortName: 'chaperon',
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
      shortName: 'chauvesouris',
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
      shortName: 'acrobate',
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
      shortName: 'terreur',
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
      shortName: 'ectoplasme',
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
      shortName: 'torche',
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
      shortName: 'survivant',
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
      shortName: 'purificateur',
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
      shortName: 'réparateur',
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
      shortName: 'voyant',
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
      shortName: 'nomade',
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
      shortName: 'silence',
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
      shortName: 'analyste',
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
      shortName: 'farceur',
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
      shortName: 'observateur',
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
      shortName: 'confesseur',
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
      shortName: 'bouclier',
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
      shortName: 'pisteur',
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
      shortName: 'pieuvre',
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
      shortName: 'sobre',
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
      shortName: 'illuminé',
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
      shortName: 'souhait',
      description: "Utilise n'importe quelle arcane ou modifie le monde avec contre-coup",
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'utilise arcanes ou modifie le monde',
      position: 104,
      successCalculation: SuccessCalculation.AUCUN,
      isArcanique: true
    })

    const lightSummon: DBSkill = this.createSkill({
      name: 'summonLight',
      shortName: 'inv',
      description: 'Invoquer une créature de lumiere',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'fait une *Invocation de lumiere*',
      position: 25,
      invocationTemplate: charactersTemplates.get('summonLight')
    })
    const newSkills = [
      chairSkill,
      espritSkill,
      essenceSkill,
      empiriqueSkill,
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
      lightSummon
    ]
    const skills = new Map<string, DBSkill>()
    for (const skillData of newSkills) {
      const existingSkill = await this.dbSkillRepository.findOneBy({ name: skillData.name })
      if (!existingSkill) {
        const skill = new DBSkill()
        Object.assign(skill, skillData)
        const createdSkill = await this.dbSkillRepository.save(skill)
        skills.set(skill.name, createdSkill)
      } else {
        skills.set(existingSkill.name, existingSkill)
      }
    }
    return skills
  }
  async initProficiencies(): Promise<Map<string, DBProficiency>> {
    const lumiereSagesse: DBProficiency = this.createProficiency({
      name: 'sagesse',
      shortName: 'sg',
      category: DisplayCategory.MAGIE,
      minLevel: 1
    })
    const lumiereCharisme: DBProficiency = this.createProficiency({
      name: 'charisme',
      shortName: 'ka',
      category: DisplayCategory.MAGIE,
      minLevel: 10
    })
    const newProficiencies = [lumiereSagesse, lumiereCharisme]
    const proficiencies = new Map<string, DBProficiency>()
    for (const proficiencyData of newProficiencies) {
      const existingProficiency = await this.dbProficiencyRepository.findOneBy({ name: proficiencyData.name })
      if (!existingProficiency) {
        const proficiency = new DBProficiency()
        Object.assign(proficiency, proficiencyData)
        const createdProficiency = await this.dbProficiencyRepository.save(proficiency)
        proficiencies.set(proficiency.name, createdProficiency)
      } else {
        proficiencies.set(existingProficiency.name, existingProficiency)
      }
    }
    return proficiencies
  }

  async initApotheoses(): Promise<Map<string, DBApotheose>> {
    const apotheoseBasic: DBApotheose = this.createApotheose({
      name: 'apotheose',
      shortName: 'apt',
      category: DisplayCategory.MAGIE,
      maxLevel: 9,
      position: 1
    })
    const apotheoseAmelioree: DBApotheose = this.createApotheose({
      name: 'apotheose améliorée',
      shortName: 'apt-am',
      category: DisplayCategory.MAGIE,
      minLevel: 10,
      position: 5
    })
    const apotheoseFinal: DBApotheose = this.createApotheose({
      name: 'apotheose finale',
      shortName: 'apt-fin',
      category: DisplayCategory.MAGIE,
      minLevel: 20,
      position: 10,
      chairImprovement: 5,
      espritImprovement: 5,
      essenceImprovement: 5
    })
    const newApotheoses = [apotheoseBasic, apotheoseAmelioree, apotheoseFinal]
    const apotheoses = new Map<string, DBApotheose>()
    for (const apotheoseData of newApotheoses) {
      const existingApotheose = await this.dbApotheoseRepository.findOneBy({ name: apotheoseData.name })
      if (!existingApotheose) {
        const apotheose = new DBApotheose()
        Object.assign(apotheose, apotheoseData)
        const createdPApotheose = await this.dbApotheoseRepository.save(apotheose)
        apotheoses.set(apotheose.name, createdPApotheose)
      } else {
        apotheoses.set(existingApotheose.name, existingApotheose)
      }
    }
    return apotheoses
  }
  async initBloodlines(): Promise<Map<string, DBBloodline>> {
    const aucunBloodline: DBBloodline = this.createBloodline({
      name: 'aucun',
      display: ''
    })
    const eauBloodline: DBBloodline = this.createBloodline({
      name: 'eau',
      display: "de l'Eau"
    })

    const feuBloodline: DBBloodline = this.createBloodline({
      name: 'feu',
      display: 'du Feu',
      detteByMagicAction: 2
    })

    const ventBloodline: DBBloodline = this.createBloodline({
      name: 'vent',
      display: 'du Vent'
    })

    const terreBloodline: DBBloodline = this.createBloodline({
      name: 'terre',
      display: 'de la Terre'
    })

    const lumiereBloodline: DBBloodline = this.createBloodline({
      name: 'lumiere',
      display: 'de la lumiere',
      healthImproved: true
    })

    const ombreBloodline: DBBloodline = this.createBloodline({
      name: 'ombre',
      display: 'des Ombres'
    })

    const foudreBloodline: DBBloodline = this.createBloodline({
      name: 'foudre',
      display: 'de la Foudre'
    })

    const glaceBloodline: DBBloodline = this.createBloodline({
      name: 'glace',
      display: 'de la Glace'
    })

    const neigeBloodline: DBBloodline = this.createBloodline({
      name: 'neige',
      display: 'de la Neige'
    })

    const arbreBloodline: DBBloodline = this.createBloodline({
      name: 'arbre',
      display: "de l'Arbre"
    })

    const terreurBloodline: DBBloodline = this.createBloodline({
      name: 'terreur',
      display: 'de la Terreur'
    })

    const lycanBloodline: DBBloodline = this.createBloodline({
      name: 'lycan',
      display: 'Lycan'
    })

    const gouleBloodline: DBBloodline = this.createBloodline({
      name: 'goule',
      display: 'goule'
    })

    const succubeBloodline: DBBloodline = this.createBloodline({
      name: 'succube',
      display: 'succube'
    })

    const gorgoneBloodline: DBBloodline = this.createBloodline({
      name: 'gorgone',
      display: 'gorgone'
    })

    const illithideBloodline: DBBloodline = this.createBloodline({
      name: 'illithide',
      display: 'illithide'
    })

    const troglodyteBloodline: DBBloodline = this.createBloodline({
      name: 'troglodyte',
      display: 'troglodyte'
    })
    const nagaBloodline: DBBloodline = this.createBloodline({
      name: 'naga',
      display: 'naga'
    })

    const newBloodlines = [
      nagaBloodline,
      troglodyteBloodline,
      illithideBloodline,
      aucunBloodline,
      gorgoneBloodline,
      lycanBloodline,
      gouleBloodline,
      succubeBloodline,
      terreurBloodline,
      eauBloodline,
      feuBloodline,
      ventBloodline,
      terreBloodline,
      lumiereBloodline,
      ombreBloodline,
      foudreBloodline,
      glaceBloodline,
      neigeBloodline,
      arbreBloodline
    ]

    const bloodlines = new Map<string, DBBloodline>()
    for (const bloodlineData of newBloodlines) {
      const existingBloodline = await this.dbBloodlineRepository.findOneBy({ name: bloodlineData.name })
      if (!existingBloodline) {
        const bloodline = new DBBloodline()
        Object.assign(bloodline, bloodlineData)
        const createdBloodline = await this.dbBloodlineRepository.save(bloodline)
        bloodlines.set(bloodline.name, createdBloodline)
      } else {
        bloodlines.set(existingBloodline.name, existingBloodline)
      }
    }
    return bloodlines
  }

  async initClasses(): Promise<Map<string, DBClasse>> {
    const championClasse: DBClasse = this.createClasse({
      name: 'champion',
      displayMale: 'Champion',
      displayFemale: 'Championne'
    })
    const corrompuClasse: DBClasse = this.createClasse({
      name: 'corrompu',
      displayMale: 'Corrompu',
      displayFemale: 'Corrompue'
    })
    const rejeteClasse: DBClasse = this.createClasse({
      name: 'rejete',
      displayMale: 'Rejeté',
      displayFemale: 'Rejetée'
    })
    const pacificateurClasse: DBClasse = this.createClasse({
      name: 'pacificateur',
      displayMale: 'Pacificateur',
      displayFemale: 'Pacificatrice'
    })
    const spiriteClasse: DBClasse = this.createClasse({
      name: 'spirite',
      displayMale: 'Spirit',
      displayFemale: 'Spirite'
    })
    const arcanisteClasse: DBClasse = this.createClasse({
      name: 'arcaniste',
      displayMale: 'Arcaniste',
      displayFemale: 'Arcaniste'
    })
    const championArcaniqueClasse: DBClasse = this.createClasse({
      name: 'champion arcanique',
      displayMale: 'Champion Arcanique',
      displayFemale: 'Championne Arcanique'
    })
    const soldatClasse: DBClasse = this.createClasse({
      name: 'soldat',
      displayMale: 'Soldat',
      displayFemale: 'Soldate'
    })
    const avatarClasse: DBClasse = this.createClasse({
      name: 'avatar',
      displayMale: 'Avatar',
      displayFemale: 'Avatar'
    })
    const skinwalkerClasse: DBClasse = this.createClasse({
      name: 'skinwalker',
      displayMale: 'Skinwalker',
      displayFemale: 'Skinwalker'
    })
    const roiClasse: DBClasse = this.createClasse({
      name: 'roi',
      displayMale: 'Roi',
      displayFemale: 'Reine'
    })
    const parolierClasse: DBClasse = this.createClasse({
      name: 'parolier',
      displayMale: 'Parolier',
      displayFemale: 'Parolière'
    })
    const dragonClasse: DBClasse = this.createClasse({
      name: 'dragon',
      displayMale: 'Dragon',
      displayFemale: 'Dragon'
    })
    const inconnuClasse: DBClasse = this.createClasse({
      name: 'inconnu',
      displayMale: 'Inconnu',
      displayFemale: 'Inconnue'
    })
    const newClasses: DBClasse[] = [
      championClasse,
      corrompuClasse,
      rejeteClasse,
      pacificateurClasse,
      spiriteClasse,
      arcanisteClasse,
      championArcaniqueClasse,
      soldatClasse,
      avatarClasse,
      skinwalkerClasse,
      roiClasse,
      parolierClasse,
      dragonClasse,
      inconnuClasse
    ]

    const classes = new Map<string, DBClasse>()
    for (const classeData of newClasses) {
      const existingClasse = await this.dbClasseRepository.findOneBy({ name: classeData.name })
      if (!existingClasse) {
        const classe = new DBClasse()
        Object.assign(classe, classeData)
        const createdClasse = await this.dbClasseRepository.save(classe)
        classes.set(classe.name, createdClasse)
      } else {
        classes.set(existingClasse.name, existingClasse)
      }
    }
    return classes
  }
  createClasse(p: { name: string; displayMale: string; displayFemale: string }): DBClasse {
    const newClass = new DBClasse()
    newClass.name = p.name
    newClass.displayMale = p.displayMale
    newClass.displayFemale = p.displayFemale
    return newClass
  }

  createCharacterTemplate(p: {
    name: string
    chairValueReferential: CharacterTemplateReferential
    chairValueRule: number
    espritValueReferential: CharacterTemplateReferential
    espritValueRule: number
    essenceValueReferential: CharacterTemplateReferential
    essenceValueRule: number
    pvMaxValueReferential?: CharacterTemplateReferential
    pvMaxValueRule?: number
    pfMaxValueReferential?: CharacterTemplateReferential
    pfMaxValueRule?: number
    ppMaxValueReferential?: CharacterTemplateReferential
    ppMaxValueRule?: number
    picture?: string
  }): DBCharacterTemplate {
    const newCharacterTemplate = new DBCharacterTemplate()
    newCharacterTemplate.name = p.name
    newCharacterTemplate.chairValueReferential = p.chairValueReferential
    newCharacterTemplate.chairValueRule = p.chairValueRule
    newCharacterTemplate.espritValueReferential = p.espritValueReferential
    newCharacterTemplate.espritValueRule = p.espritValueRule
    newCharacterTemplate.essenceValueReferential = p.essenceValueReferential
    newCharacterTemplate.essenceValueRule = p.essenceValueRule
    newCharacterTemplate.pvMaxValueReferential = p.pvMaxValueReferential
      ? p.pvMaxValueReferential
      : CharacterTemplateReferential.CHAIR
    // eslint-disable-next-line no-magic-numbers
    newCharacterTemplate.pvMaxValueRule = p.pvMaxValueRule ? p.pvMaxValueRule : 2
    newCharacterTemplate.pfMaxValueReferential = p.pfMaxValueReferential
      ? p.pfMaxValueReferential
      : CharacterTemplateReferential.ESPRIT
    newCharacterTemplate.pfMaxValueRule = p.pfMaxValueRule ? p.pfMaxValueRule : 1
    newCharacterTemplate.ppMaxValueReferential = p.ppMaxValueReferential
      ? p.ppMaxValueReferential
      : CharacterTemplateReferential.ESSENCE
    newCharacterTemplate.ppMaxValueRule = p.ppMaxValueRule ? p.ppMaxValueRule : 1
    newCharacterTemplate.picture = p.picture || ''
    return newCharacterTemplate
  }

  createBloodline(p: {
    name: string
    display: string
    detteByMagicAction?: number
    detteByPp?: number
    healthImproved?: boolean
  }): DBBloodline {
    const newBloodline = new DBBloodline()
    newBloodline.name = p.name
    newBloodline.display = p.display
    newBloodline.detteByMagicAction = p.detteByMagicAction || 1
    newBloodline.detteByPp = p.detteByPp || 1
    newBloodline.healthImproved = p.healthImproved || false
    return newBloodline
  }

  createSkill(p: {
    name: string
    description: string
    shortName: string
    allAttribution: boolean
    stat: SkillStat
    category: DisplayCategory
    display: string
    position: number
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
    customRolls?: string
    successCalculation?: SuccessCalculation
    secret?: boolean
    invocationTemplate?: DBCharacterTemplate
  }): DBSkill {
    return {
      name: p.name,
      description: p.description,
      shortName: p.shortName,
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
      customRolls: p.customRolls || '',
      successCalculation: p.successCalculation || SuccessCalculation.SIMPLE,
      secret: p.secret || false,
      display: p.display,
      position: p.position,
      isArcanique: p.isArcanique,
      invocationTemplate: p.invocationTemplate || null,
      invocationTemplateName: p.invocationTemplate ? p.invocationTemplate.name : null
    }
  }

  createProficiency(p: {
    name: string
    shortName: string
    category: DisplayCategory
    minLevel?: number
  }): DBProficiency {
    return {
      name: p.name,
      shortName: p.shortName,
      displayCategory: p.category,
      minLevel: p.minLevel || 1
    }
  }

  createApotheose(p: {
    name: string
    shortName: string
    category: DisplayCategory
    position: number
    minLevel?: number
    maxLevel?: number
    cost?: number
    chairImprovement?: number
    espritImprovement?: number
    essenceImprovement?: number
    arcaneImprovement?: boolean
    avantage?: boolean
    apotheoseEffect?: string[]
  }): DBApotheose {
    return {
      name: p.name,
      shortName: p.shortName,
      displayCategory: p.category,
      position: p.position,
      // eslint-disable-next-line no-magic-numbers
      maxLevel: p.maxLevel || 100,
      minLevel: p.minLevel || 1,
      // eslint-disable-next-line no-magic-numbers
      cost: p.cost || 3,
      // eslint-disable-next-line no-magic-numbers
      chairImprovement: p.chairImprovement || 3,
      // eslint-disable-next-line no-magic-numbers
      espritImprovement: p.espritImprovement || 3,
      // eslint-disable-next-line no-magic-numbers
      essenceImprovement: p.essenceImprovement || 3,
      arcaneImprovement: p.arcaneImprovement || false,
      avantage: p.avantage || false,
      apotheoseEffect: p.apotheoseEffect || [
        'perd le contrôle',
        'garde le contrôle',
        'garde le contrôle',
        'garde le contrôle',
        'garde le contrôle',
        'garde le contrôle'
      ]
    }
  }

  private async skillsAttribution(
    skills: Map<string, DBSkill>,
    classes: Map<string, DBClasse>,
    bloodlines: Map<string, DBBloodline>,
    characters: Map<string, DBCharacter>
  ) {
    await this.saveClasseSkillIfNotExisting(classes.get('champion'), skills.get('magie'))
    await this.saveClasseSkillIfNotExisting(classes.get('champion'), skills.get('cantrip'))
    await this.saveCharacterSkillIfNotExisting(characters.get('jonathan'), skills.get('arbre'))
    await this.saveCharacterSkillIfNotExisting(characters.get('jonathan'), skills.get('mort'))
    await this.saveCharacterSkillIfNotExisting(characters.get('jonathan'), skills.get('summonLight'))
  }

  private async saveClasseSkillIfNotExisting(classe: DBClasse, skill: DBSkill) {
    const existingRelation = await this.dbClasseSkillRepository.findOne({
      where: {
        classeName: classe.name,
        skillName: skill.name
      }
    })
    if (!existingRelation) {
      await this.dbClasseSkillRepository.save({
        classe: classe,
        skill: skill,
        classeName: classe.name,
        skillName: skill.name
      })
    }
  }
  private async saveBloodlineSkillIfNotExisting(bloodline: DBBloodline, skill: DBSkill) {
    const existingRelation = await this.dbBloodlineSkillRepository.findOne({
      where: {
        bloodlineName: bloodline.name,
        skillName: skill.name
      }
    })
    if (!existingRelation) {
      await this.dbBloodlineSkillRepository.save({
        bloodline: bloodline,
        skill: skill,
        bloodlineName: bloodline.name,
        skillName: skill.name
      })
    }
  }
  private async saveCharacterSkillIfNotExisting(character: DBCharacter, skill: DBSkill) {
    const existingRelation = await this.dbCharacterSkillRepository.findOne({
      where: {
        characterName: character.name,
        skillName: skill.name
      }
    })
    if (!existingRelation) {
      await this.dbCharacterSkillRepository.save({
        character: character,
        skill: skill,
        characterName: character.name,
        skillName: skill.name
      })
    }
  }

  private async proficienciesAttribution(
    proficiencies: Map<string, DBProficiency>,
    classes: Map<string, DBClasse>,
    bloodlines: Map<string, DBBloodline>,
    characters: Map<string, DBCharacter>
  ) {
    await this.saveBloodlineProficiencyIfNotExisting(bloodlines.get('lumiere'), proficiencies.get('sagesse'))
    await this.saveBloodlineProficiencyIfNotExisting(bloodlines.get('lumiere'), proficiencies.get('charisme'))
  }

  private async saveClasseProficiencyIfNotExisting(classe: DBClasse, proficiency: DBProficiency) {
    const existingRelation = await this.dbClasseProficiencyRepository.findOne({
      where: {
        classeName: classe.name,
        proficiencyName: proficiency.name
      }
    })
    if (!existingRelation) {
      await this.dbClasseProficiencyRepository.save({
        classe: classe,
        proficiency: proficiency,
        classeName: classe.name,
        proficiencyName: proficiency.name
      })
    }
  }
  private async saveBloodlineProficiencyIfNotExisting(bloodline: DBBloodline, proficiency: DBProficiency) {
    const existingRelation = await this.dbBloodlineProficiencyRepository.findOne({
      where: {
        bloodlineName: bloodline.name,
        proficiencyName: proficiency.name
      }
    })
    if (!existingRelation) {
      await this.dbBloodlineProficiencyRepository.save({
        bloodline: bloodline,
        proficiency: proficiency,
        bloodlineName: bloodline.name,
        proficiencyName: proficiency.name
      })
    }
  }
  private async saveCharacterProficiencyIfNotExisting(character: DBCharacter, proficiency: DBProficiency) {
    const existingRelation = await this.dbCharacterProficiencyRepository.findOne({
      where: {
        characterName: character.name,
        proficiencyName: proficiency.name
      }
    })
    if (!existingRelation) {
      await this.dbCharacterProficiencyRepository.save({
        character: character,
        proficiency: proficiency,
        characterName: character.name,
        proficiencyName: proficiency.name
      })
    }
  }

  private async apotheosesAttribution(
    apotheoses: Map<string, DBApotheose>,
    classes: Map<string, DBClasse>,
    bloodlines: Map<string, DBBloodline>,
    characters: Map<string, DBCharacter>
  ) {
    await this.saveClasseApotheoseIfNotExisting(classes.get('champion'), apotheoses.get('apotheose'))
    await this.saveClasseApotheoseIfNotExisting(classes.get('champion'), apotheoses.get('apotheose améliorée'))
    await this.saveClasseApotheoseIfNotExisting(classes.get('champion'), apotheoses.get('apotheose finale'))
  }

  private async saveClasseApotheoseIfNotExisting(classe: DBClasse, apotheose: DBApotheose) {
    const existingRelation = await this.dbClasseApotheoseRepository.findOne({
      where: {
        classeName: classe.name,
        apotheoseName: apotheose.name
      }
    })
    if (!existingRelation) {
      await this.dbClasseApotheoseRepository.save({
        classe: classe,
        apotheose: apotheose,
        classeName: classe.name,
        apotheoseName: apotheose.name
      })
    }
  }
  private async saveBloodlineApotheoseIfNotExisting(bloodline: DBBloodline, apotheose: DBApotheose) {
    const existingRelation = await this.dbBloodlineApotheoseRepository.findOne({
      where: {
        bloodlineName: bloodline.name,
        apotheoseName: apotheose.name
      }
    })
    if (!existingRelation) {
      await this.dbBloodlineApotheoseRepository.save({
        bloodline: bloodline,
        apotheose: apotheose,
        bloodlineName: bloodline.name,
        apotheoseName: apotheose.name
      })
    }
  }
  private async saveCharacterApotheoseIfNotExisting(character: DBCharacter, apotheose: DBApotheose) {
    const existingRelation = await this.dbCharacterApotheoseRepository.findOne({
      where: {
        characterName: character.name,
        apotheoseName: apotheose.name
      }
    })
    if (!existingRelation) {
      await this.dbCharacterApotheoseRepository.save({
        character: character,
        apotheose: apotheose,
        characterName: character.name,
        apotheoseName: apotheose.name
      })
    }
  }
}
