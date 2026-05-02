import { DBDiary, DBDiaryToCreate, DBDiaryToUpdate } from './DBDiary'
import { Diary, DiaryToCreate, DiaryToUpdate } from '../../../domain/models/diaries/Diary'
import { IDiaryProvider } from '../../../domain/providers/diaries/IDiaryProvider'
import { ProviderErrors } from '../../errors/ProviderErrors'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { eachDayOfInterval } from 'date-fns'
import { Repository } from 'typeorm'

@Injectable()
export class DBDiaryProvider implements IDiaryProvider {
  constructor(
    @InjectRepository(DBDiary)
    private readonly diaryRepository: Repository<DBDiary>
  ) {}

  async findOneById(id: string): Promise<Diary> {
    const res = await this.diaryRepository.findOne({
      where: {
        id: id
      },
      relations: DBDiary.RELATIONS
    })
    if (!res) {
      throw ProviderErrors.EntityNotFound(DBDiary.name)
    }
    return DBDiary.toDiary(res)
  }

  async create(diaryToCreate: DiaryToCreate): Promise<Diary> {
    const toCreate: DBDiaryToCreate = {
      text: diaryToCreate.text,
      day: diaryToCreate.day,
      month: diaryToCreate.month,
      year: diaryToCreate.year,
      createdDate: new Date(),
      updatedDate: new Date()
    }
    const created = this.diaryRepository.create(toCreate)
    await this.diaryRepository.insert(created)
    return await this.findOneById(created.id)
  }

  async update(p: { diaryId: string; diary: Partial<DiaryToUpdate> }): Promise<Diary> {
    const toUpdate: Partial<DBDiaryToUpdate> = {
      text: p.diary.text,
      updatedDate: new Date()
    }
    await this.diaryRepository.update(
      {
        id: p.diaryId
      },
      toUpdate
    )
    return await this.findOneById(p.diaryId)
  }

  async findManyByDayAndMonth(p: { day: number; month: number }): Promise<Diary[]> {
    const res = await this.diaryRepository.find({
      where: {
        day: p.day,
        month: p.month
      }
    })
    return res.map(DBDiary.toDiary)
  }
  i

  async findAllMissingEntries(): Promise<{ day: number; month: number; year: number }[]> {
    const res = await this.diaryRepository.find({
      select: ['day', 'month', 'year']
    })

    // Générer la liste complète des triplets day/month/year du 1er janvier 2020 à aujourd'hui
    const startDate = new Date(2020, 0, 1) // 1er janvier 2020
    const today = new Date() // Aujourd'hui
    const yesterday = today.setDate(today.getDate() - 1)

    const allDates = eachDayOfInterval({ start: startDate, end: yesterday })

    const allDays = allDates.map((date) => ({
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear()
    }))

    const existingEntries = res.map((r) => ({
      day: r.day,
      month: r.month,
      year: r.year
    }))

    // Retirer les triplets présents dans la base de données de la liste complète des triplets
    const missingEntries = allDays.filter(
      (dayEntry) =>
        !existingEntries.some(
          (dbEntry) =>
            dbEntry.day === dayEntry.day && dbEntry.month === dayEntry.month && dbEntry.year === dayEntry.year
        )
    )

    return missingEntries
  }
}
