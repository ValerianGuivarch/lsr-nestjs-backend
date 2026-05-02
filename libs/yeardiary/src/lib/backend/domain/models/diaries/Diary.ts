export class Diary {
  id: string
  text: string
  day: number
  month: number
  year: number
  lastUpdate: Date | null

  constructor(diary: Diary) {
    this.id = diary.id
    this.text = diary.text
    this.day = diary.day
    this.month = diary.month
    this.year = diary.year
    this.lastUpdate = diary.lastUpdate
  }

  static toDiaryToCreate(p: { text: string; day: number; month: number; year: number }): DiaryToCreate {
    return {
      text: p.text,
      day: p.day,
      month: p.month,
      year: p.year
    }
  }
}

export type DiaryToCreate = Omit<Diary, 'id' | 'lastUpdate'>
export type DiaryToUpdate = Pick<Diary, 'text'>
