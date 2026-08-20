import { IsString } from 'class-validator'

export class AddStatRequest {
  @IsString() name: string
}

export class UpdateStatRequest {
  @IsString() name: string
}
