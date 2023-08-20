import { Character } from '../models/characters/Character'
import { CharacterTemplateReferential } from '../models/invocation/CharacterTemplateReferential'
import { Roll } from '../models/roll/Roll'
import { ICharacterProvider } from '../providers/ICharacterProvider'
import { INameProvider } from '../providers/INameProvider'
import { ISessionProvider } from '../providers/ISessionProvider'
import { ISkillProvider } from '../providers/ISkillProvider'
import { Inject, Logger } from '@nestjs/common'

export class InvocationService {
  private readonly logger = new Logger(InvocationService.name)

  constructor(
    @Inject('ICharacterProvider')
    private characterProvider: ICharacterProvider,
    @Inject('ISessionProvider')
    private sessionProvider: ISessionProvider,
    @Inject('ISkillProvider')
    private skillProvider: ISkillProvider,
    @Inject('INameProvider')
    private nameProvider: INameProvider
  ) {}

  async createInvocation(templateName: string, roll: Roll): Promise<Character> {
    const summoner = await this.characterProvider.findOneByName(roll.rollerName)
    const template = await this.characterProvider.findTemplateByName(templateName)
    const skills = await this.skillProvider.findSkillsByCharacterTemplate(template)
    const chair: number = this.valueByReferential(
      summoner,
      roll,
      template.chairValueReferential,
      template.chairValueRule
    )
    const esprit = this.valueByReferential(summoner, roll, template.espritValueReferential, template.espritValueRule)
    const essence = this.valueByReferential(summoner, roll, template.essenceValueReferential, template.essenceValueRule)
    const pvMax = this.valueByReferential(summoner, roll, template.pvMaxValueReferential, template.pvMaxValueRule)

    const randomName = await this.nameProvider.generateName()

    const invocation = await Character.invocationToCreateFactory({
      chair: chair,
      esprit: esprit,
      essence: essence,
      pvMax: pvMax,
      picture: template.picture,
      name: templateName + '-' + randomName,
      summoner: summoner,
      customData: template.customData
    })
    const createdInvocation = await this.characterProvider.createInvocation(invocation)
    for (const skill of skills) {
      await this.skillProvider.affectSkillToCharacter(createdInvocation, skill)
    }
    return createdInvocation
  }

  valueByReferential(
    character: Character,
    roll: Roll,
    valueReferential: CharacterTemplateReferential,
    valueRule: number
  ): number {
    if (valueReferential === CharacterTemplateReferential.FIXE) {
      return valueRule
    } else if (valueReferential === CharacterTemplateReferential.CHAIR) {
      return valueRule * character.chair
    } else if (valueReferential === CharacterTemplateReferential.ESPRIT) {
      return valueRule * character.esprit
    } else if (valueReferential === CharacterTemplateReferential.ESSENCE) {
      return valueRule * character.essence
    } else {
      // if(valueReferential === InvocationReferential.SUCCESS) {
      return valueRule * roll.success
    }
  }
}
