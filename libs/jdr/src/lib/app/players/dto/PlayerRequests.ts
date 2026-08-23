import { IsOptional, IsString } from 'class-validator'

export class AddPlayerRequest {
  @IsString() name: string
}

export class UpdatePlayerRequest {
  @IsOptional() @IsString() name?: string
}
