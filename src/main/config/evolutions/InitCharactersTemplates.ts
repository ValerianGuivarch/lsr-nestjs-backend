import { DBCharacterTemplate } from '../../data/database/character/DBCharacterTemplate'
import { CharacterTemplateReferential } from '../../domain/models/invocation/CharacterTemplateReferential'
import { Injectable } from '@nestjs/common'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InitCharactersTemplates {
  static getCharactersTemplates(): DBCharacterTemplate[] {
    const jonathanLight: DBCharacterTemplate = this.createCharacterTemplate({
      name: 'summonLight',
      chairValueReferential: CharacterTemplateReferential.SUCCESS,
      chairValueRule: 1,
      espritValueReferential: CharacterTemplateReferential.SUCCESS,
      espritValueRule: 1,
      essenceValueReferential: CharacterTemplateReferential.SUCCESS,
      essenceValueRule: 1,
      pvMaxValueReferential: CharacterTemplateReferential.SUCCESS,
      pvMaxValueRule: 1,
      pfMaxValueReferential: CharacterTemplateReferential.SUCCESS,
      pfMaxValueRule: 1,
      ppMaxValueReferential: CharacterTemplateReferential.SUCCESS,
      ppMaxValueRule: 1,
      picture: ''
    })

    const newCharactersTemplate = [jonathanLight]
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
