import { Diary } from '../../../../../../domain/models/diaries/Diary'
import { ApiProperty } from '@nestjs/swagger'

export class DiaryVM {
  @ApiProperty({ description: 'The diary id', type: String, format: 'uuid' })
  id: string

  @ApiProperty({ description: 'The diary text', type: String })
  text: string

  @ApiProperty({ description: 'The diary day', type: Number })
  day: number

  @ApiProperty({ description: 'The diary month', type: Number })
  month: number

  @ApiProperty({ description: 'The diary year', type: Number })
  year: number

  @ApiProperty({ description: 'The diary last update', type: Date })
  lastUpdate: Date | null

  constructor(diary: DiaryVM) {
    this.id = diary.id
    this.text = diary.text
    this.day = diary.day
    this.month = diary.month
    this.year = diary.year
    this.lastUpdate = diary.lastUpdate
  }

  static from(diary: Diary): DiaryVM {
    return new DiaryVM({
      id: diary.id,
      text: diary.text,
      day: diary.day,
      month: diary.month,
      year: diary.year,
      lastUpdate: diary.lastUpdate
    })
  }
}

export const DiaryVMExample: DiaryVM = {
  id: '09691b8d-5cc1-4966-b614-d0f04f6422fd',
  text: 'This is a diary',
  day: 1,
  month: 1,
  year: 2021,
  lastUpdate: new Date()
}
