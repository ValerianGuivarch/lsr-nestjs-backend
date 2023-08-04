import { OwnedArcane } from '../models/arcanes/OwnedArcane'
import { Character } from '../models/characters/Character'
import { IArcaneProvider } from '../providers/IArcaneProvider'
import { Inject, Logger } from '@nestjs/common'

export class ArcaneService {
  private readonly logger = new Logger(ArcaneService.name)

  constructor(
    @Inject('IArcaneProvider')
    private arcaneProvider: IArcaneProvider
  ) {
    console.log('ArcaneService')
  }

  async findOwnedArcanes(character: Character): Promise<OwnedArcane[]> {
    return await this.arcaneProvider.findOwnedArcaneByCharacter(character.name)
  }
}
