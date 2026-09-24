import { IsNumber, IsOptional, IsString } from 'class-validator'

export class AddGroupRequest {
  @IsString() name: string
  @IsOptional() @IsString() text?: string
}

export class AddGroupResourceRequest {
  @IsString() name: string
  @IsOptional() @IsNumber() value?: number
}

export class UpdateGroupResourceRequest {
  @IsNumber() value: number
}

export class UpdateGroupRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() text?: string
}
