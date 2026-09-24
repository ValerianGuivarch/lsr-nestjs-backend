import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator'

export class AddCharacterRequest {
  @IsString() name: string
  @IsOptional() @IsString() playerSlug?: string
  @IsOptional() @IsString() classSlug?: string
  @IsOptional() @IsString() classLevel?: string
  @IsOptional() @IsBoolean() isPlayable?: boolean
  @IsOptional() @IsBoolean() public?: boolean
  @IsOptional() @IsString() text?: string
}

export class UpdateCharacterRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() playerSlug?: string
  @IsOptional() @IsString() classSlug?: string
  @IsOptional() @IsString() classLevel?: string
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

export class AddCharacterResourceRequest {
  @IsString() name: string
  @IsOptional() @IsNumber() value?: number
}
