import { Character } from '../models/characters/Character'
import { Proficiency } from '../models/proficiencies/Proficiency'
import { IProficiencyProvider } from '../providers/IProficiencyProvider'
import { Inject, Logger } from '@nestjs/common'

export class ProficiencyService {
  private readonly logger = new Logger(ProficiencyService.name)

  constructor(
    @Inject('IProficiencyProvider')
    private proficienciesProvider: IProficiencyProvider
  ) {}

  async findProficienciesByCharacter(character: Character): Promise<Proficiency[]> {
    return await this.proficienciesProvider.findProficienciesByCharacter(character)
  }
}
