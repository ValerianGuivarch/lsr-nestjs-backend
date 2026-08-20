import { IsOptional, IsString } from 'class-validator'

export class AddGroupRequest {
  @IsString() name: string
  @IsOptional() @IsString() text?: string
}

export class UpdateGroupRequest {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() text?: string
}
