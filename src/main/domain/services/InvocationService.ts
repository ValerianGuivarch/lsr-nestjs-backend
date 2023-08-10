import { Character } from '../models/characters/Character'
import { Invocation } from '../models/invocation/Invocation'
import { InvocationReferential } from '../models/invocation/InvocationReferential'
import { InvocationTemplate } from '../models/invocation/InvocationTemplate'
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

  async createInvocation(templateName: string, roll: Roll): Promise<Invocation> {
    const summoner = await this.characterProvider.findOneByName(roll.rollerName)
    const template = await this.invocationProvider.findTemplateByName(templateName)
    const chair: number = this.valueByReferential(
      summoner,
      roll,
      template.chairValueReferential,
      template.chairValueRule
    )
    const esprit = this.valueByReferential(summoner, roll, template.espritValueReferential, template.espritValueRule)
    const essence = this.valueByReferential(summoner, roll, template.essenceValueReferential, template.essenceValueRule)
    const pvMax = this.valueByReferential(summoner, roll, template.pvMaxValueReferential, template.pvMaxValueRule)

    const invocation = await Invocation.invocationToCreateFactory({
      id: summoner.name,
      chair: chair,
      esprit: esprit,
      essence: essence,
      pvMax: pvMax,
      templateName: templateName,
      summonerName: summoner.name,
      picture: template.picture,
      healer: template.healer
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

  async update(invocation: Invocation): Promise<Invocation> {
    return this.invocationProvider.update(invocation)
  }

  async delete(name: string): Promise<boolean> {
    return this.invocationProvider.delete(name)
  }

  async getById(invocationId: string): Promise<Invocation> {
    return this.invocationProvider.getById(invocationId)
  }

  async findAll(summonerName: string): Promise<Invocation[]> {
    return this.invocationProvider.findAll(summonerName)
  }

  async findTemplateByName(invocationName: string): Promise<InvocationTemplate> {
    return this.invocationProvider.findTemplateByName(invocationName)
  }
}
