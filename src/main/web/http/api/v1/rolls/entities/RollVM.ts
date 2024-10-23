import { Roll } from '../../../../../../domain/models/roll/Roll'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class RollVM {
  @ApiProperty()
  @IsString()
  id: string

  @ApiProperty()
  rollerName: string

  @ApiProperty()
  date: Date

  @ApiProperty()
  secret: boolean

  @ApiProperty()
  displayDices: boolean

  @ApiProperty()
  focus: boolean

  @ApiProperty()
  power: boolean

  @ApiProperty()
  proficiency: boolean

  @ApiProperty()
  bonus: number

  @ApiProperty()
  malus: number

  @ApiProperty({ isArray: true, type: Number })
  result: number[]

  @ApiProperty()
  success: number | null

  @ApiProperty()
  juge12: number | null

  @ApiProperty()
  juge34: number | null

  @ApiPropertyOptional({ isArray: true, type: Number })
  resultBis?: number[]

  @ApiPropertyOptional()
  successBis?: number

  @ApiPropertyOptional()
  juge12Bis?: number

  @ApiPropertyOptional()
  juge34Bis?: number

  @ApiProperty({ type: RollVM, isArray: true })
  resistRolls: RollVM[]

  @ApiPropertyOptional()
  picture?: string

  @ApiPropertyOptional()
  data?: string

  @ApiPropertyOptional()
  empiriqueRoll?: string

  @ApiPropertyOptional()
  apotheose?: string

  @ApiProperty()
  display: string

  @ApiProperty()
  stat: string

  @ApiProperty()
  resistance: boolean

  @ApiProperty()
  blessure: boolean

  @ApiProperty()
  help: boolean

  @ApiProperty()
  dark: boolean

  @ApiPropertyOptional()
  avantage?: boolean

  @ApiPropertyOptional()
  precision?: string

  @ApiPropertyOptional()
  pictureUrl?: string

  @ApiPropertyOptional()
  healPoint?: number

  constructor(p: RollVM) {
    Object.assign(this, p)
  }

  static of(p: { roll: Roll; othersRolls: Roll[] }): RollVM {
    return new RollVM({
      id: p.roll.id,
      healPoint: p.roll.healPoint,
      rollerName: p.roll.rollerName,
      date: p.roll.date,
      secret: p.roll.secret,
      displayDices: p.roll.displayDices,
      focus: p.roll.focus,
      power: p.roll.power,
      avantage: p.roll.avantage,
      proficiency: p.roll.proficiency,
      bonus: p.roll.bonus,
      malus: p.roll.malus,
      result: p.roll.result,
      success: p.roll.success,
      juge12: p.roll.juge12,
      juge34: p.roll.juge34,
      resultBis: p.roll.resultBis,
      successBis: p.roll.successBis,
      juge12Bis: p.roll.juge12Bis,
      juge34Bis: p.roll.juge34Bis,
      resistRolls: p.othersRolls.map((r) => RollVM.of({ roll: r, othersRolls: [] })),
      picture: p.roll.picture,
      data: p.roll.data,
      empiriqueRoll: p.roll.empiriqueRoll,
      apotheose: p.roll.apotheose,
      display: p.roll.display,
      stat: p.roll.stat,
      resistance: p.roll.resistance,
      help: p.roll.help,
      blessure: p.roll.blessure,
      precision: p.roll.precision,
      pictureUrl: p.roll.pictureUrl,
      dark: p.roll.dark
    })
  }
}
