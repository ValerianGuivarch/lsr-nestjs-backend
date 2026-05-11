import { CharacterTemplateReferential } from './CharacterTemplateReferential'
import { Bloodline } from '../characters/Bloodline'
import { Classe } from '../characters/Classe'

export class CharacterTemplate {
  name: string = undefined as any
  chairValueReferential: CharacterTemplateReferential = undefined as any
  chairValueRule: number = undefined as any
  espritValueReferential: CharacterTemplateReferential = undefined as any
  espritValueRule: number = undefined as any
  essenceValueReferential: CharacterTemplateReferential = undefined as any
  essenceValueRule: number = undefined as any
  pvMaxValueReferential: CharacterTemplateReferential = undefined as any
  pvMaxValueRule: number = undefined as any
  pfMaxValueReferential: CharacterTemplateReferential = undefined as any
  pfMaxValueRule: number = undefined as any
  ppMaxValueReferential: CharacterTemplateReferential = undefined as any
  ppMaxValueRule: number = undefined as any
  picture?: string
  customData?: string
  classe: Classe = undefined as any
  bloodline?: Bloodline

  constructor(p: CharacterTemplate) {
    Object.assign(this, p)
  }
}
