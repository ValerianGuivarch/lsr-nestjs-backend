import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'

export class AdminRegisterRequest {
  @ApiProperty()
  @IsString()
  @IsEmail()
  readonly email: string

  @ApiProperty()
  @IsString()
  readonly password: string

  @ApiProperty()
  @IsString()
  readonly phone: string

  @ApiProperty()
  @IsString()
  readonly name: string
}
