import { WizardStat } from '../../../../../domain/entities/wizard-stat.entity'
import { StatDto } from '../../stats/entities/stat.dto'
import { ApiProperty } from '@nestjs/swagger'

export class WizardStatDto {
  @ApiProperty({ description: 'The wizard stat level', type: Number })
  level: number

  @ApiProperty({ description: 'The stat', type: StatDto })
  stat: StatDto

  @ApiProperty({ description: 'The wizard stat xp', type: Number })
  xp: number

  constructor(wizardStat: WizardStatDto) {
    this.level = wizardStat.level
    this.stat = wizardStat.stat
    this.xp = wizardStat.xp
  }

  static from(wizardStat: WizardStat): WizardStatDto {
    return new WizardStatDto({
      level: wizardStat.level,
      stat: wizardStat.stat,
      xp: wizardStat.xp
    })
  }
}
