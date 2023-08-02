import { Character } from '../models/characters/Character'
import { Invocation } from '../models/invocation/Invocation'
import { InvocationReferential } from '../models/invocation/InvocationReferential'
import { Roll } from '../models/roll/Roll'
import { ICharacterProvider } from '../providers/ICharacterProvider'
import { IInvocationProvider } from '../providers/IInvocationProvider'
import { ISessionProvider } from '../providers/ISessionProvider'
import { Inject, Logger } from '@nestjs/common'

export class CharacterService {
  private readonly logger = new Logger(CharacterService.name)
  @Inject('IInvocationProvider')
  private invocationProvider: IInvocationProvider

  constructor(
    @Inject('ICharacterProvider')
    private characterProvider: ICharacterProvider,
    @Inject('ISessionProvider')
    private sessionProvider: ISessionProvider,
    @Inject('IInvocationProvider')
    invocationProvider: IInvocationProvider
  ) {
    this.invocationProvider = invocationProvider
    console.log('InvocationService')
  }

  async createInvocation(typeId: string, roll: Roll, invocationName: string): Promise<Invocation> {
    const summoner = await this.characterProvider.findOneByName(roll.rollerName)
    const success = roll.success
    const invocationType = await this.invocationProvider.findTypeByName(invocationName)
    const chair: number = this.valueByReferential(
      summoner,
      roll,
      invocationType.chairValueReferential,
      invocationType.chairValueRule
    )
    const esprit = this.valueByReferential(
      summoner,
      roll,
      invocationType.espritValueReferential,
      invocationType.espritValueRule
    )
    const essence = this.valueByReferential(
      summoner,
      roll,
      invocationType.essenceValueReferential,
      invocationType.essenceValueRule
    )
    const pvMax = this.valueByReferential(
      summoner,
      roll,
      invocationType.pvMaxValueReferential,
      invocationType.pvMaxValueRule
    )

    const invocation = await Invocation.invocationToCreateFactory({
      id: summoner.name,
      chair: chair,
      esprit: esprit,
      essence: essence,
      pvMax: pvMax,
      typeId: typeId,
      summonerName: summoner.name,
      picture: invocationType.picture,
      healer: invocationType.healer
    })
    return await this.invocationProvider.create(invocation)
  }

  valueByReferential(
    character: Character,
    roll: Roll,
    valueReferential: InvocationReferential,
    valueRule: number
  ): number {
    if (valueReferential === InvocationReferential.FIXE) {
      return valueRule
    } else if (valueReferential === InvocationReferential.CHAIR) {
      return valueRule * character.chair
    } else if (valueReferential === InvocationReferential.ESPRIT) {
      return valueRule * character.esprit
    } else if (valueReferential === InvocationReferential.ESSENCE) {
      return valueRule * character.essence
    } else {
      // if(valueReferential === InvocationReferential.SUCCESS) {
      return valueRule * roll.success
    }
  }
}
