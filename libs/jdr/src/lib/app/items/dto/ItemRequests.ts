import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ModifierRequest } from '../../jdr/dto/JdrRequests'

export class AddItemRequest {
  @IsString() name: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsBoolean() unique?: boolean
  @IsOptional() @ValidateNested({ each: true }) @Type(() => ModifierRequest) modifiers?: ModifierRequest[]
}

export class UpdateItemRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsBoolean() unique?: boolean
  @IsOptional() @ValidateNested({ each: true }) @Type(() => ModifierRequest) modifiers?: ModifierRequest[]
}

export class AddGroupItemRequest {
  @IsString() itemSlug: string
  @IsOptional() @IsNumber() quantity?: number
}
