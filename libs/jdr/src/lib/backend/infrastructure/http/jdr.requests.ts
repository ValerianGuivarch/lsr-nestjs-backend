import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateJdrRequest {
  @IsString() name: string
  @IsOptional() @IsString() text?: string
}

export class UpdateJdrRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() text?: string
}

export class AddStatRequest {
  @IsString() name: string
}

export class AddTraitModifierRequest {
  @IsString() statSlug: string
  @IsNumber() value: number
}

export class AddTraitRequest {
  @IsString() name: string
  @IsString() type: string
  @IsOptional() @ValidateNested({ each: true }) @Type(() => AddTraitModifierRequest) modifiers?: AddTraitModifierRequest[]
}

export class UpdateTraitRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() type?: string
  @IsOptional() @ValidateNested({ each: true }) @Type(() => AddTraitModifierRequest) modifiers?: AddTraitModifierRequest[]
}

export class AddResourceRequest {
  @IsString() name: string
  @IsString() type: string
}

export class AddClassRequest {
  @IsString() name: string
  @IsNumber() level: number
  @IsOptional() @IsString() text?: string
}

export class AddClassResourceRequest {
  @IsString() resourceSlug: string
  @IsString() resourceType: string
  @IsOptional() @IsNumber() defaultValue?: number
  @IsOptional() @IsString() behavior?: string
}

export class AddGroupRequest {
  @IsString() name: string
  @IsOptional() @IsString() text?: string
}

export class UpdateGroupResourceRequest {
  @IsNumber() value: number
}

export class AddItemRequest {
  @IsString() name: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsBoolean() unique?: boolean
  @IsOptional() @IsString() traitSlug?: string
}

export class AddGroupItemRequest {
  @IsString() itemSlug: string
  @IsOptional() @IsNumber() quantity?: number
}

export class AddCharacterRequest {
  @IsString() name: string
  @IsOptional() @IsString() classSlug?: string
  @IsOptional() @IsNumber() classLevel?: number
  @IsOptional() @IsBoolean() isPlayable?: boolean
  @IsOptional() @IsString() text?: string
}

export class UpdateCharacterRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() classSlug?: string
  @IsOptional() @IsNumber() classLevel?: number
  @IsOptional() @IsBoolean() isPlayable?: boolean
  @IsOptional() @IsString() text?: string
}

export class AddCharacterItemRequest {
  @IsString() itemSlug: string
  @IsOptional() @IsNumber() quantity?: number
}

export class UpdateCharacterStatRequest {
  @IsNumber() value: number
}

export class UpdateCharacterResourceRequest {
  @IsNumber() value: number
}

export class CreateDraftRequest {
  @IsString() name: string
  @IsString() groupSlug: string
  @IsOptional() @IsString() traitType?: string
  @IsOptional() @IsArray() @IsString({ each: true }) traitSlugs?: string[]
  @IsNumber() rounds: number
}

export class UpdateDraftRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() groupSlug?: string
  @IsOptional() @IsString() traitType?: string
  @IsOptional() @IsArray() @IsString({ each: true }) traitSlugs?: string[]
  @IsOptional() @IsNumber() rounds?: number
}

export class PickDraftRequest {
  @IsString() characterSlug: string
  @IsString() traitSlug: string
}

export class RollDiceRequest {
  @IsOptional()
  @IsIn(['normal', 'disadvantage', 'advantage', 'double_advantage'])
  rollState?: 'normal' | 'disadvantage' | 'advantage' | 'double_advantage'
}

export class RollArbitraryRequest {
  @IsString() formula: string
}

export class UpdateStatRequest {
  @IsString() name: string
}

export class UpdateItemRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsBoolean() unique?: boolean
}

export class UpdateClassRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsNumber() level?: number
  @IsOptional() @IsString() text?: string
}

export class UpdateGroupRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() text?: string
}

export class UpdateResourceRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() type?: string
}
