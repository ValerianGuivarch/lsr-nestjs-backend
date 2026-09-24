import { IsArray, IsOptional, IsString } from 'class-validator'

export class AddClassRequest {
  @IsString() name: string
  @IsOptional() @IsArray() @IsString({ each: true }) levels?: string[]
  @IsOptional() @IsString() text?: string
}

export class UpdateClassRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsArray() @IsString({ each: true }) levels?: string[]
  @IsOptional() @IsString() text?: string
}
