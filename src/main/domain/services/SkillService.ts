import { Character } from '../models/characters/Character'
import { DisplayCategory } from '../models/characters/DisplayCategory'
import { CharacterTemplate } from '../models/invocation/CharacterTemplate'
import { Skill } from '../models/skills/Skill'
import { ISessionProvider } from '../providers/ISessionProvider'
import { ISkillProvider } from '../providers/ISkillProvider'
import { Inject, Logger } from '@nestjs/common'

export class SkillService {
  private readonly logger = new Logger(SkillService.name)

  constructor(
    @Inject('ISkillProvider')
    private skillsProvider: ISkillProvider,
    @Inject('ISessionProvider')
    private sessionProvider: ISessionProvider
  ) {
    //console.log('SkillService')
  }

  async findSkillsByCharacter(character: Character): Promise<Skill[]> {
    const uniqueCharacterSkills = await this.skillsProvider.findSkillsByCharacter(character.name)
    const skillNames = new Set(uniqueCharacterSkills.map((ac) => ac.name))

    const bloodlineSkills = character.bloodline
      ? await this.skillsProvider.findSkillsByBloodline(character.bloodline.name)
      : []
    const uniqueBloodlineSkills = bloodlineSkills.filter((skill) => !skillNames.has(skill.name))
    uniqueBloodlineSkills.forEach((skill) => skillNames.add(skill.name))

    const classeSkills = await this.skillsProvider.findSkillsByClasse(character.classe.name)
    const uniqueClasseSkills = classeSkills.filter((skill) => !skillNames.has(skill.name))

    const skillsForAll = await this.skillsProvider.findSkillsForAll()
    const uniqueAllSkills = skillsForAll.filter((skill) => !skillNames.has(skill.name))
    uniqueAllSkills.forEach((skill) => skillNames.add(skill.name))

    return [...uniqueAllSkills, ...uniqueCharacterSkills, ...uniqueBloodlineSkills, ...uniqueClasseSkills]
  }
  async findSkillById(skillId: string): Promise<Skill> {
    return this.skillsProvider.findOneById(skillId)
  }
  async findSkillsByCharacterTemplate(template: CharacterTemplate): Promise<Skill[]> {
    return this.skillsProvider.findSkillsByCharacterTemplate(template.name)
  }
  async findArcanePrimes(me: string): Promise<Skill[]> {
    const arcanePrimes = await this.skillsProvider.findSkillsByDisplayCategory(DisplayCategory.ARCANES_PRIMES)
    const owners = (await this.sessionProvider.getSession()).owners
    return arcanePrimes.filter((skill) => owners.includes(skill.owner) || skill.owner === me)
  }

  async affectSkillToCharacter(createdInvocation: Character, skill: Skill, affected: boolean): Promise<void> {
    return this.skillsProvider.affectSkillToCharacter(createdInvocation, skill, affected)
  }

  findSkillByArcaneId(dice: number): Promise<Skill> {
    return this.skillsProvider.findSkillByArcaneId(dice)
  }
}
