import { IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateJdrRequest {
  @IsString() name: string
  @IsOptional() @IsString() text?: string
}

export class UpdateJdrRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() text?: string
}

// Shared by any slice whose mutation accepts a list of stat modifiers (items, traits, ...).
export class ModifierRequest {
  @IsString() statSlug: string
  @IsNumber() value: number
}
