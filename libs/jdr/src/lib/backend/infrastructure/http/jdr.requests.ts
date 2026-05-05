import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator'
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
  @IsOptional() @IsString() groupSlug?: string
  @IsOptional() @IsString() text?: string
}

export class UpdateCharacterRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() classSlug?: string
  @IsOptional() @IsString() groupSlug?: string
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
