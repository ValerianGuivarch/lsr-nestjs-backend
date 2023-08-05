import { Character } from '../models/characters/Character'
import { Skill } from '../models/skills/Skill'
import { ISkillProvider } from '../providers/ISkillProvider'
import { Inject, Logger } from '@nestjs/common'

export class ArcaneService {
  private readonly logger = new Logger(ArcaneService.name)

  constructor(
    @Inject('IArcaneProvider')
    private arcaneProvider: ISkillProvider
  ) {
    console.log('ArcaneService')
  }

  async findOwnedArcanes(character: Character): Promise<Skill[]> {
    return await this.arcaneProvider.findSkillsByCharacter(character)
  }
}
