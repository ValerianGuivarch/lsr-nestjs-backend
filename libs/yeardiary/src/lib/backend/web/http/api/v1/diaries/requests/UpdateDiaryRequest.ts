import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class UpdateDiaryRequest {
  @ApiPropertyOptional({ description: 'The diary text', type: String })
  @IsString()
  text: string
}

export const UpdateDiaryRequestExample = {
  text: 'This is a diary'
}
