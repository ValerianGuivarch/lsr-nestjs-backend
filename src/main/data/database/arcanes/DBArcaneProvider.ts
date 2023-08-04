import { DBArcane } from './DBArcane'
import { DBOwnedArcane } from './DBOwnedArcane'
import { Arcane } from '../../../domain/models/arcanes/Arcane'
import { ArcaneType } from '../../../domain/models/arcanes/ArcaneType'
import { ArcaneUse } from '../../../domain/models/arcanes/ArcaneUse'
import { OwnedArcane } from '../../../domain/models/arcanes/OwnedArcane'
import { IArcaneProvider } from '../../../domain/providers/IArcaneProvider'
import { Injectable } from '@nestjs/common' // adjust the path as needed
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class DBArcaneProvider implements IArcaneProvider {
  constructor(
    @InjectRepository(DBArcane, 'postgres')
    private dbArcaneRepository: Repository<DBArcane>,
    @InjectRepository(DBOwnedArcane, 'postgres')
    private dbOwnedArcaneRepository: Repository<DBOwnedArcane>
  ) {}

  private static toArcane(doc: DBArcane): Arcane {
    return new Arcane({
      name: doc.name,
      type: ArcaneType[doc.type]
    })
  }

  private static toOwnedArcane(ownedArcane: DBOwnedArcane, arcane: DBArcane): OwnedArcane {
    return new OwnedArcane({
      id: ownedArcane.id,
      arcane: DBArcaneProvider.toArcane(arcane),
      use: ArcaneUse[ownedArcane.use]
    })
  }

  async findOneArcaneByName(name: string): Promise<Arcane> {
    try {
      const arcane = await this.dbArcaneRepository.findOneByOrFail({ name: name })
      return DBArcaneProvider.toArcane(arcane)
    } catch (error) {
      return undefined
    }
  }

  async findAllArcane(): Promise<Arcane[]> {
    const arcanes = await this.dbArcaneRepository.find()
    return arcanes.map(DBArcaneProvider.toArcane)
  }

  async findOwnedArcaneById(id: number): Promise<OwnedArcane> {
    try {
      const ownedArcane = await this.dbOwnedArcaneRepository.findOneByOrFail({ id: id })
      const arcane = await this.dbArcaneRepository.findOneByOrFail({ name: ownedArcane.arcaneName })
      return DBArcaneProvider.toOwnedArcane(ownedArcane, arcane)
    } catch (error) {
      return undefined
    }
  }

  async findOwnedArcaneByCharacter(name: string): Promise<OwnedArcane[]> {
    const ownedArcanes = await this.dbOwnedArcaneRepository.findBy({ characterName: name })
    const arcanePromises = ownedArcanes.map(async (ownedArcane) => {
      const arcane = await this.dbArcaneRepository.findOneByOrFail({ name: ownedArcane.arcaneName })
      return DBArcaneProvider.toOwnedArcane(ownedArcane, arcane)
    })
    return Promise.all(arcanePromises)
  }
}
