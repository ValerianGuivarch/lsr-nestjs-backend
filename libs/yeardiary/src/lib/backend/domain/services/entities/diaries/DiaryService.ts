import { Diary, DiaryToCreate, DiaryToUpdate } from '../../../models/diaries/Diary'
import { IDiaryProvider } from '../../../providers/diaries/IDiaryProvider'
import { Inject, Injectable, Logger } from '@nestjs/common'

@Injectable()
export class DiaryService {
  private readonly logger = new Logger(DiaryService.name)
  constructor(@Inject('IDiaryProvider') private readonly diaryProvider: IDiaryProvider) {}

  async createDiary(diaryToCreate: DiaryToCreate): Promise<Diary> {
    return await this.diaryProvider.create(diaryToCreate)
  }

  async getManyDiariesByDayAndMonth(p: { day: number; month: number }): Promise<Diary[]> {
    return await this.diaryProvider.findManyByDayAndMonth(p)
  }

  async updateDiary(p: { diaryId: string; diaryToUpdate: Partial<DiaryToUpdate> }): Promise<Diary> {
    return await this.diaryProvider.update({ diaryId: p.diaryId, diary: p.diaryToUpdate })
  }

  async findAllMissingEntries(): Promise<{
    day: number
    month: number
    year: number
  }[]> {
    return await this.diaryProvider.findAllMissingEntries()
  }
}
