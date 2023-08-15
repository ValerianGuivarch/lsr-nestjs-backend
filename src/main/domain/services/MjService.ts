import { ApotheoseState } from '../models/apotheoses/ApotheoseState'
import { Character } from '../models/characters/Character'
import { ICharacterProvider } from '../providers/ICharacterProvider'
import { ISessionProvider } from '../providers/ISessionProvider'
import { Inject, Logger } from '@nestjs/common'

export class MjService {
  private readonly logger = new Logger(MjService.name)
  constructor(
    @Inject('ICharacterProvider')
    private characterProvider: ICharacterProvider,
    @Inject('ISessionProvider')
    private sessionProvider: ISessionProvider
  ) {
    console.log('MjService')
  }
  // eslint-disable-next-line no-magic-numbers
  private static statByLevel: number[] = [7, 8, 8, 9, 10, 10, 11, 12, 12, 13, 14, 15, 16, 16, 17, 18, 18, 19, 20, 21]

  async getSessionCharacters(): Promise<Character[]> {
    return await this.characterProvider.findAllForSession()
  }

  async newTurn(): Promise<Character[]> {
    return (await this.characterProvider.findAll()).filter(
      (character) => character.apotheoseName && character.apotheoseState === ApotheoseState.COST_PAID
    )
  }
}
