import { Diary, DiaryToUpdate, DiaryToCreate } from '../../models/diaries/Diary'

export interface IDiaryProvider {
  create(race: DiaryToCreate): Promise<Diary>
  findManyByDayAndMonth(p: { day: number; month: number }): Promise<Diary[]>
  update(p: { diaryId: string; diary: Partial<DiaryToUpdate> }): Promise<Diary>
  findAllMissingEntries(): Promise<{
    day: number
    month: number
    year: number
  }[]>
}
