import { Roll } from '../../../../../../domain/models/roll/Roll'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RollVM {
  @ApiProperty()
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

  @ApiPropertyOptional()
  resistRoll?: string

  @ApiPropertyOptional()
  picture?: string

  @ApiPropertyOptional()
  data?: string

  @ApiPropertyOptional()
  empirique?: string

  @ApiPropertyOptional()
  apotheose?: string

  @ApiProperty()
  display: string

  constructor(p: RollVM) {
    Object.assign(this, p)
  }

  static of(p: { roll: Roll }): RollVM {
    return new RollVM({
      id: p.roll.id,
      rollerName: p.roll.rollerName,
      date: p.roll.date,
      secret: p.roll.secret,
      displayDices: p.roll.displayDices,
      focus: p.roll.focus,
      power: p.roll.power,
      proficiency: p.roll.proficiency,
      bonus: p.roll.bonus,
      malus: p.roll.malus,
      result: p.roll.result,
      success: p.roll.success,
      juge12: p.roll.juge12,
      juge34: p.roll.juge34,
      resistRoll: p.roll.resistRoll,
      picture: p.roll.picture,
      data: p.roll.data,
      empirique: p.roll.empirique,
      apotheose: p.roll.apotheose,
      display: p.roll.display
    })
  }
}
