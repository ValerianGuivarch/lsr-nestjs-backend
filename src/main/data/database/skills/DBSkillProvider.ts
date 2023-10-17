import { DBSkill } from './DBSkill'
import { Character } from '../../../domain/models/characters/Character'
import { DisplayCategory } from '../../../domain/models/characters/DisplayCategory'
import { SuccessCalculation } from '../../../domain/models/roll/SuccessCalculation'
import { Skill } from '../../../domain/models/skills/Skill'
import { SkillStat } from '../../../domain/models/skills/SkillStat'
import { ISkillProvider } from '../../../domain/providers/ISkillProvider'
import { DBCharacter } from '../character/DBCharacter'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class DBSkillProvider implements ISkillProvider {
  constructor(
    @InjectRepository(DBSkill, 'postgres')
    private dbSkillRepository: Repository<DBSkill>,
    @InjectRepository(DBCharacter, 'postgres')
    private dbCharacterRepository: Repository<DBCharacter>
  ) {}

  static fromSkill(skill: Skill): DBSkill {
    return {
      id: skill.id,
      owner: skill.owner,
      name: skill.name,
      description: skill.description,
      shortName: skill.shortName,
      longName: skill.longName,
      display: skill.display,
      position: skill.position,
      soldatCost: skill.soldatCost,
      invocationTemplateName: skill.invocationTemplateName,
      isArcanique: skill.isArcanique,
      isHeal: skill.isHeal,
      resistance: skill.resistance,
      help: skill.help,
      blessure: skill.blessure,
      displayCategory: DisplayCategory[skill.displayCategory],
      stat: SkillStat[skill.stat],
      pvCost: skill.pvCost,
      pfCost: skill.pfCost,
      ppCost: skill.ppCost,
      etherCost: skill.etherCost,
      dettesCost: skill.dettesCost,
      arcaneCost: skill.arcaneCost,
      arcanePrimeCost: skill.arcanePrimeCost,
      allowsPf: skill.allowsPf,
      allowsPp: skill.allowsPp,
      customRolls: skill.customRolls !== undefined ? skill.customRolls : null,
      successCalculation: SuccessCalculation[skill.successCalculation],
      secret: skill.secret,
      precision: skill.precision
    } as DBSkill
  }

  static toSkill(skill: DBSkill): Skill {
    return new Skill({
      id: skill.id,
      owner: skill.owner,
      name: skill.name,
      description: skill.description,
      shortName: skill.shortName,
      longName: skill.longName,
      display: skill.display,
      position: skill.position,
      soldatCost: skill.soldatCost,
      invocationTemplateName: skill.invocationTemplateName,
      isArcanique: skill.isArcanique,
      isHeal: skill.isHeal,
      resistance: skill.resistance,
      help: skill.help,
      blessure: skill.blessure,
      displayCategory: DisplayCategory[skill.displayCategory],
      stat: SkillStat[skill.stat],
      pvCost: skill.pvCost,
      pfCost: skill.pfCost,
      ppCost: skill.ppCost,
      etherCost: skill.etherCost,
      dettesCost: skill.dettesCost,
      arcaneCost: skill.arcaneCost,
      arcanePrimeCost: skill.arcanePrimeCost,
      allowsPf: skill.allowsPf,
      allowsPp: skill.allowsPp,
      customRolls: skill.customRolls !== null ? skill.customRolls : undefined,
      successCalculation: SuccessCalculation[skill.successCalculation],
      secret: skill.secret,
      precision: skill.precision
    })
  }

  async findOneById(id: string): Promise<Skill> {
    try {
      const skill = await this.dbSkillRepository.findOneBy({ id: id })
      return DBSkillProvider.toSkill(skill)
    } catch (error) {
      throw new Error('Skill not found')
    }
  }

  async findSkillsForAll(): Promise<Skill[]> {
    const skills = await this.dbSkillRepository.findBy({
      allAttribution: true
    })
    return skills.map(DBSkillProvider.toSkill)
  }

  async findSkillsByCharacter(characterName: string): Promise<Skill[]> {
    const skills = await this.dbSkillRepository
      .createQueryBuilder('skill')
      .innerJoinAndSelect('skill.characters', 'character', 'character.name = :name', { name: characterName })
      .getMany()

    return skills.map(DBSkillProvider.toSkill)
  }

  async findSkillsByBloodline(bloodlineName: string): Promise<Skill[]> {
    const skills = await this.dbSkillRepository
      .createQueryBuilder('skill')
      .innerJoinAndSelect('skill.bloodlines', 'bloodline', 'bloodline.name = :name', { name: bloodlineName })
      .getMany()

    return skills.map(DBSkillProvider.toSkill)
  }

  async findSkillsByClasse(classeName: string): Promise<Skill[]> {
    const skills = await this.dbSkillRepository
      .createQueryBuilder('skill')
      .innerJoinAndSelect('skill.classes', 'classe', 'classe.name = :name', { name: classeName })
      .getMany()

    return skills.map(DBSkillProvider.toSkill)
  }

  async findSkillsByCharacterTemplate(name: string): Promise<Skill[]> {
    const skills = await this.dbSkillRepository
      .createQueryBuilder('skill')
      .innerJoinAndSelect('skill.characterTemplates', 'characterTemplate', 'characterTemplate.name = :name', {
        name: name
      })
      .getMany()

    return skills.map(DBSkillProvider.toSkill)
  }

  async findSkillsByDisplayCategory(category: DisplayCategory): Promise<Skill[]> {
    const skills = await this.dbSkillRepository.findBy({ displayCategory: DisplayCategory[category] })
    return skills.map(DBSkillProvider.toSkill)
  }

  async affectSkillToCharacter(createdInvocation: Character, skill: Skill, affected: boolean): Promise<void> {
    const dbCharacter = await this.dbCharacterRepository.findOne({
      where: { name: createdInvocation.name },
      relations: ['skills']
    })
    const dbSkill = await this.dbSkillRepository.findOneBy({ id: skill.id })
    if (affected) {
      dbCharacter.skills.push(dbSkill)
    } else {
      dbCharacter.skills = dbCharacter.skills.filter((dbSkill) => dbSkill.id !== skill.id)
    }
    await this.dbCharacterRepository.save(dbCharacter)
  }
}
