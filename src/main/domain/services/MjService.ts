import { BattleState } from '../models/characters/BattleState'
import { Session } from '../models/session/Session'
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

  async getSession(): Promise<Session> {
    return await this.sessionProvider.getSession()
  }

  async updateCharacterBattleState(characterName: string, battleState: BattleState): Promise<void> {
    const character = await this.characterProvider.findByName(characterName)
    character.battleState = battleState
    await this.characterProvider.update(character)
  }
}
