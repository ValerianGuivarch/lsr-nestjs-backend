import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class CreateJoueuseRequest {
  @ApiProperty({
    description: 'The joueuse name',
    type: String
  })
  @IsString()
  name: string
}

export const CreateJoueuseRequestExample: CreateJoueuseRequest = {
  name: 'Elena'
}
