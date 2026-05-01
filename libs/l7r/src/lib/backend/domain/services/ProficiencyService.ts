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
    const characterProficiencies = await this.proficienciesProvider.findProficienciesByCharacter(character.name)
    const proficiencyNames = new Set(characterProficiencies.map((ac) => ac.name))

    const bloodlineProficiencies = character.bloodline
      ? await this.proficienciesProvider.findProficienciesByBloodline(character.bloodline.name)
      : []
    const uniqueBloodlineProficiencies = bloodlineProficiencies.filter(
      (proficiency) => !proficiencyNames.has(proficiency.name)
    )
    uniqueBloodlineProficiencies.forEach((proficiency) => proficiencyNames.add(proficiency.name))

    const classeProficiencies = await this.proficienciesProvider.findProficienciesByClasse(character.classe.name)
    const uniqueClasseProficiencies = classeProficiencies.filter(
      (proficiency) => !proficiencyNames.has(proficiency.name)
    )

    return [...characterProficiencies, ...bloodlineProficiencies, ...uniqueClasseProficiencies]
  }
}
