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
import { Injectable } from '@nestjs/common' // adjust the path as needed
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

  private static toSkill(skill: DBSkill, overloadSkill?: DBSkillAttrs): Skill {
    return new Skill({
      name: skill.name,
      display: skill.display,
      position: skill.position,
      displayCategory: DisplayCategory[skill.displayCategory],
      stat:
        overloadSkill && overloadSkill.stat
          ? SkillStat[overloadSkill.stat]
          : SkillStat[skill.stat] ||
            (() => {
              throw new Error('Missing stat for skill ' + skill.name + ' : ' + skill.stat)
            })(),
      pvCost:
        overloadSkill && overloadSkill.pvCost
          ? overloadSkill.pvCost
          : skill.pvCost !== null
          ? skill.pvCost
          : (() => {
              throw new Error('Missing pvCost for skill ' + skill.name)
            })(),
      pfCost:
        overloadSkill && overloadSkill.pfCost
          ? overloadSkill.pfCost
          : skill.pfCost !== null
          ? skill.pfCost
          : (() => {
              throw new Error('Missing pfCost for skill ' + skill.name)
            })(),
      ppCost:
        overloadSkill && overloadSkill.ppCost
          ? overloadSkill.ppCost
          : skill.ppCost !== null
          ? skill.ppCost
          : (() => {
              throw new Error('Missing ppCost for skill ' + skill.name)
            })(),
      dettesCost:
        overloadSkill && overloadSkill.dettesCost
          ? overloadSkill.dettesCost
          : skill.dettesCost !== null
          ? skill.dettesCost
          : (() => {
              throw new Error('Missing dettesCost for skill ' + skill.name)
            })(),
      arcaneCost:
        overloadSkill && overloadSkill.arcaneCost
          ? overloadSkill.arcaneCost
          : skill.arcaneCost !== null
          ? skill.arcaneCost
          : (() => {
              throw new Error('Missing arcaneCost for skill ' + skill.name)
            })(),
      allowsPp:
        overloadSkill && overloadSkill.allowsPp
          ? overloadSkill.allowsPp
          : skill.allowsPp !== null
          ? skill.allowsPp
          : (() => {
              throw new Error('Missing pvCost for skill ' + skill.name)
            })(),
      allowsPf:
        overloadSkill && overloadSkill.allowsPf
          ? overloadSkill.allowsPf
          : skill.allowsPf !== null
          ? skill.allowsPf
          : (() => {
              throw new Error('Missing allowsPf for skill ' + skill.name)
            })(),
      customRolls:
        overloadSkill && overloadSkill.customRolls
          ? overloadSkill.customRolls
          : skill.customRolls !== null
          ? skill.customRolls
          : (() => {
              throw new Error('Missing customRolls for skill ' + skill.name)
            })(),
      successCalculation:
        overloadSkill && overloadSkill.successCalculation
          ? SuccessCalculation[overloadSkill.successCalculation]
          : skill.successCalculation !== null
          ? SuccessCalculation[skill.successCalculation]
          : (() => {
              throw new Error('Missing successCalculation for skill ' + skill.name)
            })(),
      secret:
        overloadSkill && overloadSkill.secret
          ? overloadSkill.secret
          : skill.secret !== null
          ? skill.secret
          : (() => {
              throw new Error('Missing secret for skill ' + skill.name)
            })()
    })
  }
  async findSkillOwnedById(id: number): Promise<Skill> {
    try {
      const dbOwnedSkill = await this.dbCharacterSkillRepository.findOneByOrFail({ id: id })
      const skill = await this.dbSkillRepository.findOneByOrFail({ name: dbOwnedSkill.skillName })
      return DBSkillProvider.toSkill(skill, dbOwnedSkill)
    } catch (error) {
      return undefined
    }
  }

  async findSkillByCharacterAndSkillName(character: Character, skillName: string): Promise<Skill> {
    try {
      const dbOwnedSkill = await this.dbCharacterSkillRepository.findOneByOrFail({
        characterName: character.name,
        skillName: skillName
      })

      const skill = await this.dbSkillRepository.findOneByOrFail({ name: dbOwnedSkill.skillName })
      return DBSkillProvider.toSkill(skill, dbOwnedSkill)
    } catch (error) {
      const skill = await this.dbSkillRepository.findOneByOrFail({ name: skillName })
      return DBSkillProvider.toSkill(skill, undefined)
    }
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
      DBSkillProvider.toSkill(characterSkill.skill, characterSkill)
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
    return Promise.all(skillPromises)
  }
}
