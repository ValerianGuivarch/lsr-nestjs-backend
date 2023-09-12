import { ApotheoseService } from './ApotheoseService'
import { ProficiencyService } from './ProficiencyService'
import { RollService } from './RollService'
import { SkillService } from './SkillService'
import { ApotheoseState } from '../models/apotheoses/ApotheoseState'
import { ICharacterProvider } from '../providers/ICharacterProvider'
import { ISessionProvider } from '../providers/ISessionProvider'
import { Inject, Logger } from '@nestjs/common'

export class MjService {
  private readonly logger = new Logger(MjService.name)
  constructor(
    @Inject('ICharacterProvider')
    private characterProvider: ICharacterProvider,
    @Inject('ISessionProvider')
    private sessionProvider: ISessionProvider,
    private rollService: RollService,
    private skillService: SkillService,
    private apotheoseService: ApotheoseService,
    private proficiencyService: ProficiencyService
  ) {
    console.log('MjService')
  }
  // eslint-disable-next-line no-magic-numbers
  private static statByLevel: number[] = [7, 8, 8, 9, 10, 10, 11, 12, 12, 13, 14, 15, 16, 16, 17, 18, 18, 19, 20, 21]

  async newTurn(): Promise<void> {
    const apotheosedCharacters = (await this.characterProvider.findAll()).filter(
      (character) => character.currentApotheose && character.apotheoseState === ApotheoseState.COST_PAID
    )
    await Promise.all(
      apotheosedCharacters.map(async (apotheosedCharacter) => {
        await this.rollService.rollApotheose({
          character: apotheosedCharacter,
          apotheose: apotheosedCharacter.currentApotheose
        })
      })
    )
  }
}
