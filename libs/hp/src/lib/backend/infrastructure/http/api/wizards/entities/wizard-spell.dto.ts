import { Difficulty } from '../../../../../domain/entities/difficulty.enum'
import { WizardSpell } from '../../../../../domain/entities/wizard-spell.entity'
import { SpellDto } from '../../spells/entities/spell.dto'
import { ApiProperty } from '@nestjs/swagger'

export class WizardSpellDto {
  @ApiProperty({ description: 'The spell', type: SpellDto })
  spell: SpellDto

  @ApiProperty({ description: 'The wizard spell xp', type: Number })
  xp: number

  @ApiProperty({ description: 'The wizard spell difficulty', type: String })
  difficulty: Difficulty

  constructor(wizardSpell: WizardSpellDto) {
    this.spell = wizardSpell.spell
    this.xp = wizardSpell.xp
    this.difficulty = wizardSpell.difficulty
  }

  static from(wizardSpell: WizardSpell): WizardSpellDto {
    return new WizardSpellDto({
      spell: wizardSpell.spell,
      xp: wizardSpell.xp,
      difficulty: wizardSpell.difficulty
    })
  }
}
