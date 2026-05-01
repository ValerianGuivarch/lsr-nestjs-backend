import { DBApotheose } from './DBApotheose'
import { Apotheose } from '../../../domain/models/apotheoses/Apotheose'
import { DisplayCategory } from '../../../domain/models/characters/DisplayCategory'
import { IApotheoseProvider } from '../../../domain/providers/IApotheoseProvider'
import { Injectable } from '@nestjs/common' // adjust the path as needed
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class DBApotheoseProvider implements IApotheoseProvider {
  constructor(
    @InjectRepository(DBApotheose, 'postgres')
    private dbApotheoseRepository: Repository<DBApotheose>
  ) {}

  static toApotheose(apotheose: DBApotheose): Apotheose {
    return new Apotheose({
      name: apotheose.name,
      shortName: apotheose.shortName,
      minLevel: apotheose.minLevel,
      maxLevel: apotheose.maxLevel,
      position: apotheose.position,
      displayCategory: DisplayCategory[apotheose.displayCategory],
      cost: apotheose.cost,
      chairImprovement: apotheose.chairImprovement,
      espritImprovement: apotheose.espritImprovement,
      essenceImprovement: apotheose.essenceImprovement,
      arcaneImprovement: apotheose.arcaneImprovement,
      avantage: apotheose.avantage,
      apotheoseEffect: apotheose.apotheoseEffect,
      description: apotheose.description
    })
  }

  async findApotheosesByCharacter(characterName: string): Promise<Apotheose[]> {
    const apotheoses = await this.dbApotheoseRepository
      .createQueryBuilder('apotheose')
      .innerJoinAndSelect('apotheose.characters', 'character', 'character.name = :name', { name: characterName })
      .getMany()

    return apotheoses.map(DBApotheoseProvider.toApotheose)
  }

  async findApotheosesByClasse(classeName: string): Promise<Apotheose[]> {
    const apotheoses = await this.dbApotheoseRepository
      .createQueryBuilder('apotheose')
      .innerJoinAndSelect('apotheose.classes', 'classe', 'classe.name = :name', { name: classeName })
      .getMany()

    return apotheoses.map(DBApotheoseProvider.toApotheose)
  }

  async findOneByName(name: string): Promise<Apotheose> {
    const apotheose = await this.dbApotheoseRepository.findOneBy({ name: name })
    return DBApotheoseProvider.toApotheose(apotheose)
  }
}
