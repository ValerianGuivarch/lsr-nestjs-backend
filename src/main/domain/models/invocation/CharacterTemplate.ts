import { CharacterTemplateReferential } from './CharacterTemplateReferential'

export class CharacterTemplate {
  name: string
  chairValueReferential: CharacterTemplateReferential
  chairValueRule: number
  espritValueReferential: CharacterTemplateReferential
  espritValueRule: number
  essenceValueReferential: CharacterTemplateReferential
  essenceValueRule: number
  pvMaxValueReferential: CharacterTemplateReferential
  pvMaxValueRule: number
  pfMaxValueReferential: CharacterTemplateReferential
  pfMaxValueRule: number
  ppMaxValueReferential: CharacterTemplateReferential
  ppMaxValueRule: number
  picture?: string
  customData?: string
  classeName?: string
  bloodlineName?: string

  constructor(p: CharacterTemplate) {
    Object.assign(this, p)
  }
}
