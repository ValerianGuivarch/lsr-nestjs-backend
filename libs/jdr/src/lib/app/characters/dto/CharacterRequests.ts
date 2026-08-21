import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator'

export class AddCharacterRequest {
  @IsString() name: string
  @IsOptional() @IsString() classSlug?: string
  @IsOptional() @IsNumber() classLevel?: number
  @IsOptional() @IsBoolean() isPlayable?: boolean
  @IsOptional() @IsBoolean() public?: boolean
  @IsOptional() @IsString() text?: string
}

export class UpdateCharacterRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() classSlug?: string
  @IsOptional() @IsNumber() classLevel?: number
  @IsOptional() @IsBoolean() isPlayable?: boolean
  @IsOptional() @IsBoolean() public?: boolean
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
