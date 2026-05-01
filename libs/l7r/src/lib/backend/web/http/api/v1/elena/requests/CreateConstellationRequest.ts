import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class CreateConstellationRequest {
  @ApiProperty({
    description: 'The constellation picture',
    type: String
  })
  @IsString()
  @MinLength(1)
  pictureUrl: string

  @ApiProperty({
    description: 'The constellation name',
    type: String
  })
  @IsString()
  name: string

  @ApiProperty({
    description: 'The constellation real name',
    type: String
  })
  @IsString()
  realName: string

  @ApiProperty({
    description: 'The constellation picture revealed',
    type: String
  })
  @IsString()
  pictureUrlRevealed: string
}

export const CreateConstellationRequestExampleGothel: CreateConstellationRequest = {
  pictureUrl:
    'https://media.discordapp.net/attachments/689044605311647799/1193500974938079292/file-GEoQS1X8fQkB9i52aVIfwDOL.png?ex=65acf166&is=659a7c66&hm=e1d80e540e41728572e04f2b97e460d3a1374a85090aa62855c1a87fdf4c73db&=&format=webp&quality=lossless&width=528&height=528',
  pictureUrlRevealed:
    'https://media.discordapp.net/attachments/689044605311647799/1193504208440274974/image.png?ex=65acf469&is=659a7f69&hm=05a2410465e173ed47376d968b28f3b613cf1e16745c9fdcd5baa4654506f6bd&=&format=webp&quality=lossless&width=526&height=528',
  name: "La Mère Débordante d'Amour",
  realName: 'Mère Gothel'
}
export const CreateConstellationRequestExampleSumra: CreateConstellationRequest = {
  pictureUrl:
    'https://media.discordapp.net/attachments/689044605311647799/1193500975319748609/file-k0xugMum8015ABiwCVIt13ZW.png?ex=65acf166&is=659a7c66&hm=caa194633144deef9ddb013743dadd5f49c32524cd72a5914d8f25d688f6019f&=&format=webp&quality=lossless&width=528&height=528',
  pictureUrlRevealed:
    'https://media.discordapp.net/attachments/689044605311647799/1193504208679358524/image.png?ex=65acf469&is=659a7f69&hm=1d41891cb63d06b56f70c2bed3f826d920455a8ec559a38714faba1acd99fa0d&=&format=webp&quality=lossless&width=526&height=528',
  name: "L'Ours Furieux au Grand Coeur",
  realName: 'Sumra'
}
