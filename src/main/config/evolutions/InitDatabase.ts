import { InitApotheoses } from './InitApotheoses'
import { InitBloodlines } from './InitBloodlines'
import { InitCharacters } from './InitCharacters'
import { InitCharactersTemplates } from './InitCharactersTemplates'
import { InitClasses } from './InitClasses'
import { InitProficiencies } from './InitProficiencies'
import { InitSkills } from './InitSkills'
import { DBApotheose } from '../../data/database/apotheoses/DBApotheose'
import { DBBloodline } from '../../data/database/bloodlines/DBBloodline'
import { DBCharacter } from '../../data/database/character/DBCharacter'
import { DBCharacterTemplate } from '../../data/database/character/DBCharacterTemplate'
import { DBClasse } from '../../data/database/classes/DBClasse'
import { DBProficiency } from '../../data/database/proficiencies/DBProficiency'
import { DBSkill } from '../../data/database/skills/DBSkill'
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
    @InjectRepository(DBApotheose, 'postgres')
    private dbApotheoseRepository: Repository<DBApotheose>,
    @InjectRepository(DBCharacterTemplate, 'postgres')
    private dbCharacterTemplateRepository: Repository<DBCharacterTemplate>
  ) {}

  async initDatabase(): Promise<void> {
    await this.dbCharacterRepository.delete({})
    await this.dbCharacterTemplateRepository.delete({})
    await this.dbClasseRepository.delete({})
    await this.dbBloodlineRepository.delete({})
    await this.dbSkillRepository.delete({})
    await this.dbApotheoseRepository.delete({})
    await this.dbProficiencyRepository.delete({})

    console.log('Initializing skills...')
    const skills = await this.initSkills()

    console.log('Initializing proficiencies...')
    const proficiencies = await this.initProficiencies()

    console.log('Initializing apotheoses...')
    const apotheoses = await this.initApotheoses()

    console.log('Initializing classes...')
    const classes = await this.initClasses(skills, proficiencies, apotheoses)

    console.log('Initializing bloodlines...')
    const bloodlines = await this.initBloodlines(skills, proficiencies)

    console.log('Initializing character templates...')
    const charactersTemplates = await this.initCharactersTemplates(
      skills,
      proficiencies,
      apotheoses,
      classes,
      bloodlines
    )

    console.log('Initializing skills invocations...')
    await this.initSkillsInvocations(charactersTemplates)

    console.log('Initializing characters...')
    await this.initCharacters(skills, proficiencies, apotheoses, classes, bloodlines)

    console.log('Database initialized')
  }

  async initCharactersTemplates(
    skills: Map<string, DBSkill>,
    proficiencies: Map<string, DBProficiency>,
    apotheoses: Map<string, DBApotheose>,
    classes: Map<string, DBClasse>,
    bloodlines: Map<string, DBBloodline>
  ): Promise<Map<string, DBCharacterTemplate>> {
    const newCharactersTemplate = InitCharactersTemplates.getCharactersTemplates(
      skills,
      proficiencies,
      apotheoses,
      classes,
      bloodlines
    )
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
    skills: Map<string, DBSkill>,
    proficiencies: Map<string, DBProficiency>,
    apotheoses: Map<string, DBApotheose>,
    classes: Map<string, DBClasse>,
    bloodlines: Map<string, DBBloodline>
  ): Promise<Map<string, DBCharacter>> {
    const newCharacters = InitCharacters.getCharacters(skills, proficiencies, apotheoses, classes, bloodlines)
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
  async initSkills(): Promise<Map<string, DBSkill>> {
    const newSkills = InitSkills.getSkills()
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
  async initSkillsInvocations(charactersTemplates: Map<string, DBCharacterTemplate>): Promise<Map<string, DBSkill>> {
    const newSkills = InitSkills.getSkillsInvocation(charactersTemplates)
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
  async initBloodlines(
    skills: Map<string, DBSkill>,
    proficiencies: Map<string, DBProficiency>
  ): Promise<Map<string, DBBloodline>> {
    const newBloodlines = InitBloodlines.getBloodlines(skills, proficiencies)

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

  async initClasses(
    skills: Map<string, DBSkill>,
    proficiencies: Map<string, DBProficiency>,
    apotheoses: Map<string, DBApotheose>
  ): Promise<Map<string, DBClasse>> {
    const newClasses = InitClasses.getClasses(skills, proficiencies, apotheoses)
    const classes = new Map<string, DBClasse>()
    for (const classeData of newClasses) {
      const existingClasse = await this.dbClasseRepository.findOneBy({ name: classeData.name })
      if (!existingClasse) {
        const classe = new DBClasse()
        Object.assign(classe, classeData)
        console.log(classe.name)

        const createdClasse = await this.dbClasseRepository.save(classe)
        classes.set(classe.name, createdClasse)
      } else {
        classes.set(existingClasse.name, existingClasse)
      }
    }
    return classes
  }
  /*
  private async skillsAttribution(
    skills: Map<string, DBSkill>,
    classes: Map<string, DBClasse>,
    bloodlines: Map<string, DBBloodline>,
    characters: Map<string, DBCharacter>,
    charactersTemplates: Map<string, DBCharacterTemplate>
  ) {

    // Isycho
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('isycho'),
      skill: {
        ...skills.get('soin'),
        successCalculation: SuccessCalculation.SIMPLE_PLUS_1
      },
      dailyUse: 0
    })
    // Isycho
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('isycho'),
      skill: skills.get('forme aqueuse'),
      dailyUse: 0
    })
    // Isycho
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('isycho'),
      skill: skills.get('soin mental'),
      dailyUse: 0
    })
    // Isycho
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('isycho'),
      skill: skills.get('vol'),
      dailyUse: 0
    })
    // Isycho
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('isycho'),
      skill: skills.get('armure'),
      dailyUse: 0
    })
    // Isycho
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('isycho'),
      skill: skills.get('speed'),
      dailyUse: 0
    })
    // Isycho
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('isycho'),
      skill: skills.get('malédiction'),
      dailyUse: 0
    })
    // Isycho
    await this.saveCharacterSkillIfNotExisting({
      character: characters.get('isycho'),
      skill: skills.get('invisibilité'),
      dailyUse: 0
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
  private async saveCharacterSkillIfNotExisting(p: {
    character: DBCharacter
    skill: DBSkill
    dailyUse?: number
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
        dailyUse: p.dailyUse,
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
    await this.saveBloodlineProficiencyIfNotExisting(bloodlines.get('lumière'), proficiencies.get('sagesse'))
    await this.saveBloodlineProficiencyIfNotExisting(bloodlines.get('lumière'), proficiencies.get('charisme'))
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
  }*/
}
