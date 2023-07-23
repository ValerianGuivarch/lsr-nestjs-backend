import { DBRoll } from './DBRoll'
import { Character } from '../../../domain/models/characters/Character'
import { Roll } from '../../../domain/models/roll/Roll'
import { RollType } from '../../../domain/models/roll/RollType'
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
      rollerName: doc.rollerName,
      rollType: RollType[doc.rollType],
      date: doc.date,
      secret: doc.secret,
      displayDices: doc.displayDices,
      focus: doc.focus,
      power: doc.power,
      proficiency: doc.proficiency,
      benediction: doc.benediction,
      malediction: doc.malediction,
      result: doc.result,
      success: doc.success,
      juge12: doc.juge12,
      juge34: doc.juge34,
      characterToHelp: doc.characterToHelp,
      picture: doc.picture,
      data: doc.data,
      empirique: doc.empirique,
      apotheose: doc.apotheose,
      resistRoll: doc.resistRoll,
      helpUsed: doc.helpUsed
    })
  }

  private static fromRoll(doc: Roll): DBRoll {
    return {
      rollerName: doc.rollerName,
      rollType: doc.rollType.toString(),
      date: doc.date,
      secret: doc.secret,
      displayDices: doc.displayDices,
      focus: doc.focus,
      power: doc.power,
      proficiency: doc.proficiency,
      benediction: doc.benediction,
      malediction: doc.malediction,
      result: doc.result,
      success: doc.success,
      juge12: doc.juge12,
      juge34: doc.juge34,
      helpUsed: doc.helpUsed,
      characterToHelp: doc.characterToHelp,
      picture: doc.picture,
      data: doc.data,
      empirique: doc.empirique,
      apotheose: doc.apotheose,
      resistRoll: doc.resistRoll
    } as DBRoll
  }

  async add(roll: Roll): Promise<Roll> {
    const dbRoll = this.dbRollRepository.create(DBRollProvider.fromRoll(roll))
    return DBRollProvider.toRoll(await this.dbRollRepository.save(dbRoll))
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

  async getLastForCharacter(character: Character): Promise<Roll | undefined> {
    const rollList = await this.dbRollRepository.find()
    return rollList
      .sort((r1, r2) => r2.date.getTime() - r1.date.getTime())
      .map((roll) => DBRollProvider.toRoll(roll))
      .filter(
        (roll) =>
          roll.rollerName === character.name &&
          (roll.rollType === RollType.CHAIR ||
            roll.rollType === RollType.ESPRIT ||
            roll.rollType === RollType.ESSENCE ||
            roll.rollType === RollType.ARCANE_ESPRIT ||
            roll.rollType === RollType.ARCANE_ESSENCE ||
            roll.rollType === RollType.MAGIE_LEGERE ||
            roll.rollType === RollType.MAGIE_FORTE ||
            roll.rollType === RollType.SOIN)
      )[0]
  }

  async helpUsed(rollList: Roll[]): Promise<boolean> {
    for (const roll of rollList) {
      roll.helpUsed = true
      // await this.update(roll)
    }
    return true
  }
  async availableHelp(characterName: string): Promise<Roll[]> {
    return (await this.dbRollRepository.find()).map((roll) => DBRollProvider.toRoll(roll))
  }
}
