import { DBBloodlineSkill } from './DBBloodlineSkill'
import { DBCharacterSkill } from './DBCharacterSkill'
import { DBClasseSkill } from './DBClasseSkill'
import { DBSkill } from './DBSkill'
import { DBSkillAttrs } from './DBSkillAttrs'
import { Character } from '../../../domain/models/characters/Character'
import { DisplayCategory } from '../../../domain/models/characters/DisplayCategory'
import { SuccessCalculation } from '../../../domain/models/roll/SuccessCalculation'
import { Skill } from '../../../domain/models/skills/Skill'
import { SkillStat } from '../../../domain/models/skills/SkillStat'
import { ISkillProvider } from '../../../domain/providers/ISkillProvider'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class DBSkillProvider implements ISkillProvider {
  constructor(
    @InjectRepository(DBSkill, 'postgres')
    private dbSkillRepository: Repository<DBSkill>,
    @InjectRepository(DBClasseSkill, 'postgres')
    private dbClasseSkillRepository: Repository<DBClasseSkill>,
    @InjectRepository(DBBloodlineSkill, 'postgres')
    private dbBloodlineSkillRepository: Repository<DBBloodlineSkill>,
    @InjectRepository(DBCharacterSkill, 'postgres')
    private dbCharacterSkillRepository: Repository<DBCharacterSkill>
  ) {}

  private static toSkill(
    skill: DBSkill,
    overloadSkill?: DBSkillAttrs,
    limitationMax?: number,
    dailyUse?: number
  ): Skill {
    return new Skill({
      name: skill.name,
      limitationMax: limitationMax !== undefined ? limitationMax : null,
      dailyUse: dailyUse !== undefined ? dailyUse : null,
      description: skill.description,
      shortName: skill.shortName,
      longName: skill.longName,
      display: skill.display,
      position: skill.position,
      invocationTemplateName: skill.invocationTemplateName,
      isArcanique: skill.isArcanique,
      displayCategory:
        overloadSkill && overloadSkill.displayCategory !== null
          ? DisplayCategory[overloadSkill.displayCategory]
          : DisplayCategory[skill.displayCategory] ||
            (() => {
              throw new Error('Missing displayCategory for skill ' + skill.name + ' : ' + skill.displayCategory)
            })(),
      stat:
        overloadSkill && overloadSkill.stat !== null
          ? SkillStat[overloadSkill.stat]
          : SkillStat[skill.stat] ||
            (() => {
              throw new Error('Missing stat for skill ' + skill.name + ' : ' + skill.stat)
            })(),
      pvCost:
        overloadSkill && overloadSkill.pvCost !== null
          ? overloadSkill.pvCost
          : skill.pvCost !== null
          ? skill.pvCost
          : (() => {
              throw new Error('Missing pvCost for skill ' + skill.name)
            })(),
      pfCost:
        overloadSkill && overloadSkill.pfCost !== null
          ? overloadSkill.pfCost
          : skill.pfCost !== null
          ? skill.pfCost
          : (() => {
              throw new Error('Missing pfCost for skill ' + skill.name)
            })(),
      ppCost:
        overloadSkill && overloadSkill.ppCost !== null
          ? overloadSkill.ppCost
          : skill.ppCost !== null
          ? skill.ppCost
          : (() => {
              throw new Error('Missing ppCost for skill ' + skill.name)
            })(),
      dettesCost:
        overloadSkill && overloadSkill.dettesCost !== null
          ? overloadSkill.dettesCost
          : skill.dettesCost !== null
          ? skill.dettesCost
          : (() => {
              throw new Error('Missing dettesCost for skill ' + skill.name)
            })(),
      arcaneCost:
        overloadSkill && overloadSkill.arcaneCost !== null
          ? overloadSkill.arcaneCost
          : skill.arcaneCost !== null
          ? skill.arcaneCost
          : (() => {
              throw new Error('Missing arcaneCost for skill ' + skill.name)
            })(),
      allowsPp:
        overloadSkill && overloadSkill.allowsPp !== null
          ? overloadSkill.allowsPp
          : skill.allowsPp !== null
          ? skill.allowsPp
          : (() => {
              throw new Error('Missing pvCost for skill ' + skill.name)
            })(),
      allowsPf:
        overloadSkill && overloadSkill.allowsPf !== null
          ? overloadSkill.allowsPf
          : skill.allowsPf !== null
          ? skill.allowsPf
          : (() => {
              throw new Error('Missing allowsPf for skill ' + skill.name)
            })(),
      customRolls:
        overloadSkill && overloadSkill.customRolls !== null
          ? overloadSkill.customRolls
          : skill.customRolls !== null
          ? skill.customRolls
          : undefined,
      successCalculation:
        overloadSkill && overloadSkill.successCalculation !== null
          ? SuccessCalculation[overloadSkill.successCalculation]
          : skill.successCalculation !== null
          ? SuccessCalculation[skill.successCalculation]
          : (() => {
              throw new Error('Missing successCalculation for skill ' + skill.name)
            })(),
      secret:
        overloadSkill && overloadSkill.secret ? overloadSkill.secret : skill.secret !== null ? skill.secret : false
    })
  }
  async findSkillOwnedById(id: number): Promise<Skill> {
    try {
      const dbOwnedSkill = await this.dbCharacterSkillRepository.findOneByOrFail({ id: id })
      const skill = await this.dbSkillRepository.findOneByOrFail({ name: dbOwnedSkill.skillName })
      return DBSkillProvider.toSkill(skill, dbOwnedSkill, dbOwnedSkill.limitationMax, dbOwnedSkill.dailyUse)
    } catch (error) {
      return undefined
    }
  }

  async updateDailyUse(skillName: string, characterName: string, number: number): Promise<void> {
    const characterSkill = await this.dbCharacterSkillRepository.findOneByOrFail({
      skillName: skillName,
      characterName: characterName
    })
    characterSkill.dailyUse = number
    await this.dbCharacterSkillRepository.save(characterSkill)
  }

  async findSkillsByCharacter(character: Character): Promise<Skill[]> {
    const skillsForAll = await this.dbSkillRepository.findBy({ allAttribution: true })

    const classeWithSkills = await this.dbClasseSkillRepository.find({
      where: { classeName: character.classeName },
      relations: ['classe', 'skill']
    })
    const bloodlineWithSkills = await this.dbBloodlineSkillRepository.find({
      where: { bloodlineName: character.bloodlineName },
      relations: ['bloodline', 'skill']
    })
    const characterWithSkills = await this.dbCharacterSkillRepository.find({
      where: { characterName: character.name },
      relations: ['character', 'skill']
    })
    const skillPromises: Skill[] = characterWithSkills.map((characterSkill) =>
      DBSkillProvider.toSkill(
        characterSkill.skill,
        characterSkill,
        characterSkill.limitationMax,
        characterSkill.dailyUse
      )
    )
    for (const bloodlineSkill of bloodlineWithSkills) {
      if (skillPromises.filter((skill) => skill.name === bloodlineSkill.skillName).length === 0) {
        skillPromises.push(DBSkillProvider.toSkill(bloodlineSkill.skill, bloodlineSkill))
      }
    }
    for (const classeSkill of classeWithSkills) {
      if (skillPromises.filter((skill) => skill.name === classeSkill.skillName).length === 0) {
        skillPromises.push(DBSkillProvider.toSkill(classeSkill.skill, classeSkill))
      }
    }
    for (const allSkill of skillsForAll) {
      if (skillPromises.filter((skill) => skill.name === allSkill.name).length === 0) {
        skillPromises.push(DBSkillProvider.toSkill(allSkill, undefined))
      }
    }
    return Promise.all(skillPromises.sort((a, b) => a.position - b.position))
  }
}
