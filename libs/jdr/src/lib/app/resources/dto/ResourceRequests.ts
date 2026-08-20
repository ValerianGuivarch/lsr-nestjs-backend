import { IsNumber, IsOptional, IsString } from 'class-validator'

export class AddResourceRequest {
  @IsString() name: string
  @IsString() type: string
}

export class UpdateResourceRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() type?: string
}

export class UpdateGroupResourceRequest {
  @IsNumber() value: number
}
