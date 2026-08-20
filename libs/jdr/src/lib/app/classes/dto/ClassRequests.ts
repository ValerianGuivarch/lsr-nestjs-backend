import { IsNumber, IsOptional, IsString } from 'class-validator'

export class AddClassRequest {
  @IsString() name: string
  @IsNumber() level: number
  @IsOptional() @IsString() text?: string
}

export class UpdateClassRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsNumber() level?: number
  @IsOptional() @IsString() text?: string
}

export class AddClassResourceRequest {
  @IsString() resourceSlug: string
  @IsString() resourceType: string
  @IsOptional() @IsNumber() defaultValue?: number
  @IsOptional() @IsString() behavior?: string
}
