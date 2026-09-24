import { IsEnum, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ModifierRequest } from '../../jdr/dto/JdrRequests'
import { TraitType } from '../../../domain/traits/TraitType'

export class AddTraitRequest {
  @IsString() name: string
  @IsEnum(TraitType) type: TraitType
  @IsOptional() @IsNumber() level?: number
  @IsOptional() @IsObject() data?: Record<string, unknown>
  @IsOptional() @ValidateNested({ each: true }) @Type(() => ModifierRequest) modifiers?: ModifierRequest[]
}

export class UpdateTraitRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsEnum(TraitType) type?: TraitType
  @IsOptional() @IsNumber() level?: number
  @IsOptional() @IsObject() data?: Record<string, unknown> | null
  @IsOptional() @ValidateNested({ each: true }) @Type(() => ModifierRequest) modifiers?: ModifierRequest[]
}
