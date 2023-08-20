import { InitApotheoses } from './InitApotheoses'
import { InitBloodlines } from './InitBloodlines'
import { InitCharacters } from './InitCharacters'
import { InitCharactersTemplates } from './InitCharactersTemplates'
import { InitClasses } from './InitClasses'
import { InitProficiencies } from './InitProficiencies'
import { InitSkills } from './InitSkills'
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
import { DBCharacterTemplateSkill } from '../../data/database/skills/DBCharacterTemplateSkill'
import { DBClasseSkill } from '../../data/database/skills/DBClasseSkill'
import { DBSkill } from '../../data/database/skills/DBSkill'
import { DisplayCategory } from '../../domain/models/characters/DisplayCategory'
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
    private dbCharacterTemplateRepository: Repository<DBCharacterTemplate>,
    @InjectRepository(DBCharacterTemplateSkill, 'postgres')
    private dbTemplateCharacterSkillRepository: Repository<DBCharacterTemplateSkill>
  ) {}

  async initDatabase(): Promise<void> {
    await this.dbClasseSkillRepository.delete({})
    await this.dbBloodlineSkillRepository.delete({})
    await this.dbCharacterSkillRepository.delete({})
    await this.dbTemplateCharacterSkillRepository.delete({})
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
    await this.dbTemplateCharacterSkillRepository.delete({})
    console.log('Initializing character templates...')
    const charactersTemplates = await this.initCharactersTemplates()

    console.log('Initializing skills...')
    const skills = await this.initSkills(charactersTemplates)

    console.log('Initializing proficiencies...')
    const proficiencies = await this.initProficiencies()

    console.log('Initializing apotheoses...')
    const apotheoses = await this.initApotheoses()

    console.log('Initializing classes...')
    const classes = await this.initClasses()

    console.log('Initializing bloodlines...')
    const bloodlines = await this.initBloodlines()

    console.log('Initializing characters...')
    const characters = await this.initCharacters(classes, bloodlines)

    console.log('Attributing skills...')
    await this.skillsAttribution(skills, classes, bloodlines, characters, charactersTemplates)

    console.log('Attributing proficiencies...')
    await this.proficienciesAttribution(proficiencies, classes, bloodlines, characters)

    console.log('Attributing apotheoses...')
    await this.apotheosesAttribution(apotheoses, classes, bloodlines, characters)

    console.log('Database initialized')
  }

  async initCharactersTemplates(): Promise<Map<string, DBCharacterTemplate>> {
    const newCharactersTemplate = InitCharactersTemplates.getCharactersTemplates()
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
    const newSkills = InitSkills.getSkills(charactersTemplates)
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
    const newProficiencies = InitProficiencies.getProficiencies()
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
    const newApotheoses = InitApotheoses.getApotheoses()
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
    const newBloodlines = InitBloodlines.getBloodlines()

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
    const newClasses = InitClasses.getClasses()
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

  private async skillsAttribution(
    skills: Map<string, DBSkill>,
    classes: Map<string, DBClasse>,
    bloodlines: Map<string, DBBloodline>,
    characters: Map<string, DBCharacter>,
    charactersTemplates: Map<string, DBCharacterTemplate>
  ) {
    await this.saveClasseSkillIfNotExisting(classes.get('champion'), skills.get('magie'))
    await this.saveClasseSkillIfNotExisting(classes.get('champion'), skills.get('cantrip'))
    await this.saveClasseSkillIfNotExisting(classes.get('rejete'), skills.get('magie'))
    await this.saveClasseSkillIfNotExisting(classes.get('rejete'), skills.get('cantrip'))
    await this.saveClasseSkillIfNotExisting(classes.get('corrompu'), skills.get('magie'))
    await this.saveClasseSkillIfNotExisting(classes.get('corrompu'), skills.get('cantrip'))
    await this.saveBloodlineSkillIfNotExisting(bloodlines.get('eau'), skills.get('forme aqueuse'))
    await this.saveBloodlineSkillIfNotExisting(bloodlines.get('feu'), skills.get('soin mental'))
    await this.saveBloodlineSkillIfNotExisting(bloodlines.get('vent'), skills.get('vol'))
    await this.saveBloodlineSkillIfNotExisting(bloodlines.get('terre'), skills.get('armure'))
    await this.saveBloodlineSkillIfNotExisting(bloodlines.get('foudre'), skills.get('speed'))
    await this.saveBloodlineSkillIfNotExisting(bloodlines.get('glace'), skills.get('malédiction'))
    await this.saveBloodlineSkillIfNotExisting(bloodlines.get('neige'), skills.get('malédiction'))
    await this.saveBloodlineSkillIfNotExisting(bloodlines.get('ombre'), skills.get('invisibilité'))

    // Viktor
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('viktor'),
      skill: skills.get('communication arcanique')
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('viktor'),
      skill: skills.get('boost arcanique')
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('viktor'),
      skill: skills.get('blocage arcanique')
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('viktor'),
      skill: skills.get('copie arcanique')
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('viktor'),
      skill: skills.get('arpenteur'),
      limitationMax: 1,
      arcaneCost: 0
    })

    // Vernet
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('vernet'),
      skill: skills.get('Bras Robotique')
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('vernet'),
      skill: skills.get('Oeil Bionique'),
      limitationMax: 1
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('vernet'),
      skill: skills.get('Mun. courantes')
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('vernet'),
      skill: skills.get('Mun. léthales'),
      limitationMax: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('vernet'),
      skill: skills.get('Mun. affaiblissantes'),
      limitationMax: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('vernet'),
      skill: skills.get('Mun. peste'),
      limitationMax: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('vernet'),
      skill: skills.get('Mun. marquage'),
      limitationMax: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('vernet'),
      skill: skills.get('Mun. dégénérative'),
      limitationMax: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('vernet'),
      skill: skills.get('Gr. fumigène'),
      limitationMax: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('vernet'),
      skill: skills.get('Gr. flash'),
      limitationMax: 0
    })

    // Millia
    await this.saveCharacterSkillIfNotExisting({ character: characters.get('millia'), skill: skills.get('montre') })

    // Judith
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('judith'),
      skill: skills.get('Plante de soutien')
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('judith'),
      skill: skills.get('Plante de combat')
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('judith'),
      skill: skills.get('Plante de magie')
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('judith'),
      skill: skills.get('Plante envahissante')
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('judith'),
      skill: skills.get('Reconnaissance naturelle')
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('judith'),
      skill: skills.get('Lien naturel')
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('judith'),
      skill: skills.get('Soulèvement de la Nature')
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('judith'),
      skill: skills.get('Animation de la Nature')
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('judith'),
      skill: skills.get('Communication avec la Nature')
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('judith'),
      skill: skills.get('Voie des Arbres')
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('judith'),
      skill: skills.get("Lien à l'Avatar")
    })
    await this.saveTemplateCharacterSkillIfNotExisting({
      characterTemplate: charactersTemplates.get('Plante Soutien'),
      skill: skills.get('Coup de sève')
    })
    await this.saveTemplateCharacterSkillIfNotExisting({
      characterTemplate: charactersTemplates.get('Plante Magie'),
      skill: skills.get('Pollen')
    })

    // Aurélien
    await this.saveCharacterSkillIfNotExisting({ character: characters.get('aurélien'), skill: skills.get('peur') })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('illusioniste'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('sablier'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('diablotin'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('sorcière'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('forgeron'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('cheval'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('arbre'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('licorne'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('serpent'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('loup'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('ivrogne'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('erudit'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('fantome'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('faucon'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('terreur'),
      displayCategory: DisplayCategory.MAGIE,
      arcaneCost: 0,
      dettesCost: 1
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('mentaliste'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('amnesique'),
      limitationMax: 1,
      arcaneCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('aurélien'),
      skill: skills.get('tatouage'),
      limitationMax: 1,
      arcanePrimeCost: 0
    })
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('viktor'),
      skill: skills.get('pokéball'),
      arcanePrimeCost: 0
    })
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
  private async saveCharacterSkillIfNotExisting(p: {
    character: DBCharacter
    skill: DBSkill
    limitationMax?: number
    arcaneCost?: number
    arcanePrimeCost?: number
    dettesCost?: number
    displayCategory?: DisplayCategory
  }) {
    const existingRelation = await this.dbCharacterSkillRepository.findOne({
      where: {
        characterName: p.character.name,
        skillName: p.skill.name
      }
    })
    if (!existingRelation) {
      await this.dbCharacterSkillRepository.save({
        character: p.character,
        skill: p.skill,
        characterName: p.character.name,
        skillName: p.skill.name,
        arcaneCost: p.arcaneCost === undefined ? p.skill.arcaneCost : p.arcaneCost,
        arcanePrimeCost: p.arcanePrimeCost === undefined ? p.skill.arcanePrimeCost : p.arcanePrimeCost,
        limited: !!p.limitationMax,
        limitationMax: p.limitationMax,
        dailyUse: p.limitationMax,
        dettesCost: p.dettesCost === undefined ? p.skill.dettesCost : p.dettesCost,
        displayCategory: p.displayCategory === undefined ? p.skill.displayCategory : p.displayCategory
      })
    }
  }

  private async saveTemplateCharacterSkillIfNotExisting(p: {
    characterTemplate: DBCharacterTemplate
    skill: DBSkill
    limitationMax?: number
    arcaneCost?: number
    arcanePrimeCost?: number
    dettesCost?: number
    displayCategory?: DisplayCategory
  }) {
    const existingRelation = await this.dbTemplateCharacterSkillRepository.findOne({
      where: {
        characterTemplateName: p.characterTemplate.name,
        skillName: p.skill.name
      }
    })
    if (!existingRelation) {
      await this.dbTemplateCharacterSkillRepository.save({
        template: p.characterTemplate,
        skill: p.skill,
        characterTemplateName: p.characterTemplate.name,
        skillName: p.skill.name,
        arcaneCost: p.arcaneCost === undefined ? p.skill.arcaneCost : p.arcaneCost,
        arcanePrimeCost: p.arcanePrimeCost === undefined ? p.skill.arcanePrimeCost : p.arcanePrimeCost,
        limited: !!p.limitationMax,
        limitationMax: p.limitationMax,
        dailyUse: p.limitationMax,
        dettesCost: p.dettesCost === undefined ? p.skill.dettesCost : p.dettesCost,
        displayCategory: p.displayCategory === undefined ? p.skill.displayCategory : p.displayCategory
      })
    }
  }

  private async proficienciesAttribution(
    proficiencies: Map<string, DBProficiency>,
    classes: Map<string, DBClasse>,
    bloodlines: Map<string, DBBloodline>,
    characters: Map<string, DBCharacter>
  ) {
    await this.saveBloodlineProficiencyIfNotExisting(bloodlines.get('terre'), proficiencies.get('force'))
    await this.saveBloodlineProficiencyIfNotExisting(bloodlines.get('terre'), proficiencies.get('stratégie'))
    await this.saveBloodlineProficiencyIfNotExisting(bloodlines.get('lumiere'), proficiencies.get('sagesse'))
    await this.saveBloodlineProficiencyIfNotExisting(bloodlines.get('lumiere'), proficiencies.get('charisme'))
    await this.saveBloodlineProficiencyIfNotExisting(bloodlines.get('terreur'), proficiencies.get('crainte'))
    await this.saveBloodlineProficiencyIfNotExisting(bloodlines.get('terreur'), proficiencies.get('courage'))
    await this.saveBloodlineProficiencyIfNotExisting(bloodlines.get('vent'), proficiencies.get('rapidité'))
    await this.saveBloodlineProficiencyIfNotExisting(bloodlines.get('vent'), proficiencies.get('adresse'))
    await this.saveBloodlineProficiencyIfNotExisting(bloodlines.get('naga'), proficiencies.get('négociation'))
    await this.saveBloodlineProficiencyIfNotExisting(bloodlines.get('naga'), proficiencies.get('arnaque'))
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
    await this.saveClasseApotheoseIfNotExisting(classes.get('avatar'), apotheoses.get('apotheose arcanique'))
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
