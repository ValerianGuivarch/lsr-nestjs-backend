import { ApotheoseService } from './ApotheoseService'
import { ProficiencyService } from './ProficiencyService'
import { RollService } from './RollService'
import { SkillService } from './SkillService'
import { Character } from '../models/characters/Character'
import { FullCharacter } from '../models/characters/FullCharacter'
import { ChaosLevel } from '../models/session/ChaosLevel'
import { Session } from '../models/session/Session'
import { ICharacterProvider } from '../providers/ICharacterProvider'
import { ISessionProvider } from '../providers/ISessionProvider'
import { Inject, Logger } from '@nestjs/common'

export class SessionService {
  private readonly logger = new Logger(SessionService.name)
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

  async getSession(): Promise<Session> {
    return await this.sessionProvider.getSession()
  }

  async getRestForCharacter(character: Character): Promise<{
    baseRest: number
    longRest: number
  }> {
    const session = await this.sessionProvider.getSession()
    if (!character.restImproved) {
      return {
        baseRest: session.baseRest,
        // eslint-disable-next-line no-magic-numbers
        longRest: Math.floor(((character.chair + character.esprit + character.essence) * session.chaos.valueOf()) / 100)
      }
    } else {
      const previousChaos = Math.max(session.chaos - 1, ChaosLevel.LEVEL_0_0)
      return {
        baseRest: session.improvedRest,
        // eslint-disable-next-line no-magic-numbers
        longRest: Math.floor(((character.chair + character.esprit + character.essence) * previousChaos.valueOf()) / 100)
      }
    }
  }

  async getSessionCharacters(): Promise<FullCharacter[]> {
    const characters = await this.characterProvider.findAllForSession()
    return Promise.all(
      characters.map(async (character) => {
        return new FullCharacter({
          character: character,
          skills: await this.skillService.findSkillsByCharacter(character),
          apotheoses: await this.apotheoseService.findApotheosesByCharacter(character),
          proficiencies: await this.proficiencyService.findProficienciesByCharacter(character)
        })
      })
    )
  }
}
