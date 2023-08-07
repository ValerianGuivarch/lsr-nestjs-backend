import { DBOwnedSkill } from './DBOwnedSkill'
import { DBSkill } from './DBSkill'
import { Character } from '../../../domain/models/characters/Character'
import { SuccessCalculation } from '../../../domain/models/roll/SuccessCalculation'
import { Skill } from '../../../domain/models/skills/Skill'
import { SkillAttribution } from '../../../domain/models/skills/SkillAttribution'
import { SkillCategory } from '../../../domain/models/skills/SkillCategory'
import { SkillStat } from '../../../domain/models/skills/SkillStat'
import { ISkillProvider } from '../../../domain/providers/ISkillProvider'
import { DBClasse } from '../classes/DBClasse'
import { Injectable } from '@nestjs/common' // adjust the path as needed
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class DBSkillProvider implements ISkillProvider {
  constructor(
    @InjectRepository(DBSkill, 'postgres')
    private dbSkillRepository: Repository<DBSkill>,
    @InjectRepository(DBClasse, 'postgres')
    private dbClasseRepository: Repository<DBClasse>,
    @InjectRepository(DBOwnedSkill, 'postgres')
    private dbOwnedSkillRepository: Repository<DBOwnedSkill>
  ) {}

  private static toSkill(skill: DBSkill, ownedSkill?: DBOwnedSkill): Skill {
    return new Skill({
      name: skill.name,
      stat: SkillStat[skill.stat],
      category: SkillCategory[skill.category],
      pvCost: ownedSkill && ownedSkill.pvCost ? ownedSkill.pvCost : skill.pvCost,
      pfCost: ownedSkill && ownedSkill.pfCost ? ownedSkill.pfCost : skill.pfCost,
      ppCost: ownedSkill && ownedSkill.ppCost ? ownedSkill.ppCost : skill.ppCost,
      dettesCost: ownedSkill && ownedSkill.dettesCost ? ownedSkill.dettesCost : skill.dettesCost,
      arcaneCost: ownedSkill && ownedSkill.arcaneCost ? ownedSkill.arcaneCost : skill.arcaneCost,
      allowsPp: ownedSkill && ownedSkill.allowsPp ? ownedSkill.allowsPp : skill.allowsPp,
      allowsPf: ownedSkill && ownedSkill.allowsPf ? ownedSkill.allowsPf : skill.allowsPf,
      customRolls: skill.customRolls,
      successCalculation: SuccessCalculation[skill.successCalculation],
      secret: skill.secret,
      display: skill.display,
      position: skill.position
    })
  }
  async findSkillOwnedById(id: number): Promise<Skill> {
    try {
      const dbOwnedSkill = await this.dbOwnedSkillRepository.findOneByOrFail({ id: id })
      const skill = await this.dbSkillRepository.findOneByOrFail({ name: dbOwnedSkill.skillName })
      return DBSkillProvider.toSkill(skill, dbOwnedSkill)
    } catch (error) {
      return undefined
    }
  }

  async findSkillByCharacterAndSkillName(character: Character, skillName: string): Promise<Skill> {
    try {
      const dbOwnedSkill = await this.dbOwnedSkillRepository.findOneByOrFail({
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
    const skillsForAll = await this.dbSkillRepository.findBy({ attribution: SkillAttribution.ALL })
    const classeWithSkills = await this.dbClasseRepository.findOne({
      where: { name: character.classeName },
      relations: ['skills']
    })
    const skillsForClasse = classeWithSkills ? classeWithSkills.skills : []
    const skillsOwned = await this.dbOwnedSkillRepository.findBy({ characterName: character.name })
    const associatedSkills = await this.dbSkillRepository.findBy({ name: In(skillsOwned.map((s) => s.skillName)) })
    const skillPromises = skillsForAll
      .map((skill) => {
        return DBSkillProvider.toSkill(skill, undefined)
      })
      .concat(
        skillsForClasse.map((skill) => {
          return DBSkillProvider.toSkill(skill, undefined)
        })
      )
      /*.concat(
        skillsForBloodline.map((skill) => {
          return DBSkillProvider.toSkill(skill, undefined)
        })
      )*/
      .concat(
        skillsOwned.map((skill) => {
          return DBSkillProvider.toSkill(
            associatedSkills.find((s) => s.name === skill.skillName),
            skill
          )
        })
      )
    const skillMap = skillPromises.reduce((map, skill) => {
      map.set(skill.name, skill)
      return map
    }, new Map<string, Skill>())

    const reducedSkills = Array.from(skillMap.values())
    return Promise.all(reducedSkills)
  }
}
