import { Apotheose } from '../models/apotheoses/Apotheose'
import { Character } from '../models/characters/Character'
import { IApotheoseProvider } from '../providers/IApotheoseProvider'
import { Inject, Logger } from '@nestjs/common'

export class ApotheoseService {
  private readonly logger = new Logger(ApotheoseService.name)

  constructor(
    @Inject('IApotheoseProvider')
    private apotheosesProvider: IApotheoseProvider
  ) {}

  async findApotheosesByCharacter(character: Character): Promise<Apotheose[]> {
    const characterApotheoses = (await this.apotheosesProvider.findApotheosesByCharacter(character.name)).filter(
      (apotheose) => apotheose.minLevel <= character.niveau && apotheose.maxLevel >= character.niveau
    )
    const classeApotheoses = (await this.apotheosesProvider.findApotheosesByClasse(character.classe.name)).filter(
      (apotheose) => apotheose.minLevel <= character.niveau && apotheose.maxLevel >= character.niveau
    )

    const apotheoseCharacterNames = new Set(characterApotheoses.map((ac) => ac.name))
    const uniqueClasseApotheoses = classeApotheoses.filter((apotheose) => !apotheoseCharacterNames.has(apotheose.name))

    return [...characterApotheoses, ...uniqueClasseApotheoses]
  }

  async findOneByName(name: string): Promise<Apotheose> {
    return this.apotheosesProvider.findOneByName(name)
  }
}
