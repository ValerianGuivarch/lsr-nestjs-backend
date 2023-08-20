import { Character } from '../models/characters/Character'
import { Skill } from '../models/skills/Skill'
import { ISkillProvider } from '../providers/ISkillProvider'
import { Inject, Logger } from '@nestjs/common'

export class SkillService {
  private readonly logger = new Logger(SkillService.name)

  constructor(
    @Inject('ISkillProvider')
    private skillsProvider: ISkillProvider
  ) {
    console.log('ArcaneService')
  }

  async findSkillsByCharacter(character: Character): Promise<Skill[]> {
    return await this.skillsProvider.findSkillsByCharacter(character)
  }

  async findOneSkillByCharacterAndName(character: Character, skillName: string): Promise<Skill> {
    return (await this.skillsProvider.findSkillsByCharacter(character)).filter((skill) => skill.name === skillName)[0]
  }

  async resetCharacterSkills(character: Character): Promise<void> {
    const skills = await this.findSkillsByCharacter(character)
    skills.forEach((skill) => {
      if (skill.dailyUse != null && skill.limitationMax != null && skill.dailyUse != skill.limitationMax) {
        this.skillsProvider.updateDailyUse(skill.name, character.name, skill.limitationMax)
      }
    })
  }

  async updateMunitions(characterName: string, skillName: string, limitationMax: number): Promise<void> {
    await this.skillsProvider.updateSkillAttribution(characterName, skillName, limitationMax)
  }
}
