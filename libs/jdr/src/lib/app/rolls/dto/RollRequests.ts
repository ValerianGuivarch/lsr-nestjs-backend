import { IsIn, IsOptional, IsString } from 'class-validator'

export class RollDiceRequest {
  @IsOptional()
  @IsIn(['normal', 'disadvantage', 'advantage', 'double_advantage'])
  rollState?: 'normal' | 'disadvantage' | 'advantage' | 'double_advantage'

  @IsOptional() @IsString() text?: string
}

export class RollArbitraryRequest {
  @IsString() formula: string
}
