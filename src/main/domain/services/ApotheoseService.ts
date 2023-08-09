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
    return await this.apotheosesProvider.findApotheosesByCharacter(character)
  }
}
