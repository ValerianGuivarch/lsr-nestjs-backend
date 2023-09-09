import { CharacterTemplateReferential } from './CharacterTemplateReferential'
import { Bloodline } from '../characters/Bloodline'
import { Classe } from '../characters/Classe'

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
  classe: Classe
  bloodline?: Bloodline

  constructor(p: CharacterTemplate) {
    Object.assign(this, p)
  }
}
