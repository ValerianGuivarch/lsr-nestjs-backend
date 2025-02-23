import { DBRoll } from './DBRoll'
import { Roll, RollToCreate } from '../../../domain/models/roll/Roll'
import { SkillStat } from '../../../domain/models/skills/SkillStat'
import { IRollProvider } from '../../../domain/providers/IRollProvider'
import { ProviderErrors } from '../../errors/ProviderErrors'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class DBRollProvider implements IRollProvider {
  constructor(
    @InjectRepository(DBRoll, 'postgres')
    private dbRollRepository: Repository<DBRoll>
  ) {}

  private static toRoll(doc: DBRoll): Roll {
    return new Roll({
      id: doc.id,
      healPoint: doc.healPoint,
      rollerName: doc.rollerName,
      date: doc.date,
      secret: doc.secret,
      displayDices: doc.displayDices,
      focus: doc.focus,
      power: doc.power,
      proficiency: doc.proficiency,
      bonus: doc.bonus,
      malus: doc.malus,
      result: doc.result,
      success: doc.success,
      juge12: doc.juge12,
      juge34: doc.juge34,
      resultBis: doc.resultBis,
      successBis: doc.successBis,
      juge12Bis: doc.juge12Bis,
      juge34Bis: doc.juge34Bis,
      avantage: doc.avantage,
      picture: doc.picture,
      data: doc.data,
      empiriqueRoll: doc.empiriqueRoll,
      resistRoll: doc.resistRoll,
      display: doc.display,
      stat: SkillStat[doc.stat],
      resistance: doc.resistance,
      blessure: doc.blessure,
      help: doc.help,
      precision: doc.precision,
      pictureUrl: doc.pictureUrl,
      dark: doc.dark
    })
  }

  private static fromRoll(doc: RollToCreate): Partial<DBRoll> {
    return {
      healPoint: doc.healPoint,
      rollerName: doc.rollerName,
      date: doc.date,
      secret: doc.secret,
      displayDices: doc.displayDices,
      focus: doc.focus,
      power: doc.power,
      proficiency: doc.proficiency,
      bonus: doc.bonus,
      malus: doc.malus,
      result: doc.result,
      success: doc.success,
      juge12: doc.juge12,
      juge34: doc.juge34,
      avantage: doc.avantage,
      resultBis: doc.resultBis,
      successBis: doc.successBis,
      juge12Bis: doc.juge12Bis,
      juge34Bis: doc.juge34Bis,
      characterToHelp: doc.characterToHelp,
      picture: doc.picture,
      data: doc.data,
      empiriqueRoll: doc.empiriqueRoll,
      resistRoll: doc.resistRoll,
      display: doc.display,
      stat: doc.stat,
      resistance: doc.resistance,
      blessure: doc.blessure,
      help: doc.help,
      precision: doc.precision,
      pictureUrl: doc.pictureUrl,
      dark: doc.dark
    } as Partial<DBRoll>
  }

  async add(roll: RollToCreate): Promise<Roll> {
    const dbRoll = this.dbRollRepository.create(DBRollProvider.fromRoll(roll))
    return DBRollProvider.toRoll(await this.dbRollRepository.save(dbRoll))
  }

  async update(roll: Roll): Promise<Roll> {
    await this.dbRollRepository.update({ id: roll.id }, DBRollProvider.fromRoll(roll))
    const dbRoll = await this.dbRollRepository.findOneBy({ id: roll.id })
    return DBRollProvider.toRoll(dbRoll)
  }

  async findOneById(id: string): Promise<Roll> {
    console.log('findOneById', id)
    const roll = await this.dbRollRepository.findOneBy({ id: id })
    if (!roll) {
      throw ProviderErrors.EntityNotFound('roll ${id}')
    }
    return DBRollProvider.toRoll(roll)
  }

  async getLast(size: number): Promise<Roll[]> {
    const rollList = await this.dbRollRepository.find()
    return (
      rollList
        .sort((r1, r2) => r2.date.getTime() - r1.date.getTime())
        //.slice(rollList.length - size, rollList.length)
        .slice(0, size)
        .map((roll) => DBRollProvider.toRoll(roll))
    )
  }

  async deleteAll(): Promise<boolean> {
    await this.dbRollRepository.clear()
    return true
  }

  async delete(id: string): Promise<boolean> {
    const roll = await this.dbRollRepository.delete(id)
    if (!roll) {
      throw ProviderErrors.EntityNotFound('roll ${id}')
    }
    return true
  }
}
