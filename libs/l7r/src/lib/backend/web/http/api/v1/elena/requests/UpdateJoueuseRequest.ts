import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString } from 'class-validator'

export class UpdateJoueuseRequest {
  @ApiPropertyOptional({
    description: 'The sponsor id',
    type: String,
    required: false,
    format: 'uuid'
  })
  @IsString()
  @IsOptional()
  sponsorId?: string

  @ApiPropertyOptional({
    description: 'The joueuse coins',
    type: Number,
    required: false
  })
  @IsNumber()
  @IsOptional()
  coins?: number

  @ApiPropertyOptional({
    description: 'The scenario id',
    type: String,
    required: false,
    format: 'uuid'
  })
  @IsOptional()
  @IsString()
  scenarioId?: string
}

export const UpdateJoueuseRequestExample: UpdateJoueuseRequest = {
  sponsorId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  coins: 0,
  scenarioId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'
}
