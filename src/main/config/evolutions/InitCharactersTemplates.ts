import { DBCharacterTemplate } from '../../data/database/character/DBCharacterTemplate'
import { CharacterTemplateReferential } from '../../domain/models/invocation/CharacterTemplateReferential'
import { Injectable } from '@nestjs/common'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InitCharactersTemplates {
  static getCharactersTemplates(): DBCharacterTemplate[] {
    const planteSoutien: DBCharacterTemplate = this.createCharacterTemplate({
      name: 'planteSoutien',
      chairValueReferential: CharacterTemplateReferential.FIXE,
      chairValueRule: 1,
      espritValueReferential: CharacterTemplateReferential.FIXE,
      espritValueRule: 1,
      essenceValueReferential: CharacterTemplateReferential.SUCCESS,
      essenceValueRule: 1,
      pvMaxValueReferential: CharacterTemplateReferential.SUCCESS,
      pvMaxValueRule: 2,
      pfMaxValueReferential: CharacterTemplateReferential.FIXE,
      pfMaxValueRule: 0,
      ppMaxValueReferential: CharacterTemplateReferential.FIXE,
      ppMaxValueRule: 0,
      picture: 'https://i.pinimg.com/236x/4d/f4/1f/4df41fc59d65612f26a046d6d3a481f9.jpg'
    })

    const newCharactersTemplate = [planteSoutien]
    return newCharactersTemplate
  }

  static createCharacterTemplate(p: {
    name: string
    chairValueReferential: CharacterTemplateReferential
    chairValueRule: number
    espritValueReferential: CharacterTemplateReferential
    espritValueRule: number
    essenceValueReferential: CharacterTemplateReferential
    essenceValueRule: number
    pvMaxValueReferential?: CharacterTemplateReferential
    pvMaxValueRule?: number
    pfMaxValueReferential?: CharacterTemplateReferential
    pfMaxValueRule?: number
    ppMaxValueReferential?: CharacterTemplateReferential
    ppMaxValueRule?: number
    picture?: string
  }): DBCharacterTemplate {
    const newCharacterTemplate = new DBCharacterTemplate()
    newCharacterTemplate.name = p.name
    newCharacterTemplate.chairValueReferential = p.chairValueReferential
    newCharacterTemplate.chairValueRule = p.chairValueRule
    newCharacterTemplate.espritValueReferential = p.espritValueReferential
    newCharacterTemplate.espritValueRule = p.espritValueRule
    newCharacterTemplate.essenceValueReferential = p.essenceValueReferential
    newCharacterTemplate.essenceValueRule = p.essenceValueRule
    newCharacterTemplate.pvMaxValueReferential = p.pvMaxValueReferential
      ? p.pvMaxValueReferential
      : CharacterTemplateReferential.CHAIR
    // eslint-disable-next-line no-magic-numbers
    newCharacterTemplate.pvMaxValueRule = p.pvMaxValueRule ? p.pvMaxValueRule : 2
    newCharacterTemplate.pfMaxValueReferential = p.pfMaxValueReferential
      ? p.pfMaxValueReferential
      : CharacterTemplateReferential.ESPRIT
    newCharacterTemplate.pfMaxValueRule = p.pfMaxValueRule ? p.pfMaxValueRule : 1
    newCharacterTemplate.ppMaxValueReferential = p.ppMaxValueReferential
      ? p.ppMaxValueReferential
      : CharacterTemplateReferential.ESSENCE
    newCharacterTemplate.ppMaxValueRule = p.ppMaxValueRule ? p.ppMaxValueRule : 1
    newCharacterTemplate.picture = p.picture || ''
    return newCharacterTemplate
  }
}
