import { DBApotheose } from './DBApotheose'
import { DBBloodlineApotheose } from './DBBloodlineApotheose'
import { DBCharacterApotheose } from './DBCharacterApotheose'
import { DBClasseApotheose } from './DBClasseApotheose'
import { Apotheose } from '../../../domain/models/apotheoses/Apotheose'
import { Character } from '../../../domain/models/characters/Character'
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
    private dbApotheoseRepository: Repository<DBApotheose>,
    @InjectRepository(DBClasseApotheose, 'postgres')
    private dbClasseApotheoseRepository: Repository<DBClasseApotheose>,
    @InjectRepository(DBBloodlineApotheose, 'postgres')
    private dbBloodlineApotheoseRepository: Repository<DBBloodlineApotheose>,
    @InjectRepository(DBCharacterApotheose, 'postgres')
    private dbCharacterApotheoseRepository: Repository<DBCharacterApotheose>
  ) {}

  private static toApotheose(apotheose: DBApotheose): Apotheose {
    return new Apotheose({
      name: apotheose.name,
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
      apotheoseEffect: apotheose.apotheoseEffect
    })
  }
  async findApotheosesByCharacter(character: Character): Promise<Apotheose[]> {
    const classeWithApotheoses = await this.dbClasseApotheoseRepository.find({
      where: { classeName: character.classeName },
      relations: ['classe', 'apotheose']
    })
    const bloodlineWithApotheoses = await this.dbBloodlineApotheoseRepository.find({
      where: { bloodlineName: character.bloodlineName },
      relations: ['bloodline', 'apotheose']
    })
    const characterWithApotheoses = await this.dbCharacterApotheoseRepository.find({
      where: { characterName: character.name },
      relations: ['character', 'apotheose']
    })
    const apotheosePromises: Apotheose[] = characterWithApotheoses
      .map((characterApotheose) => DBApotheoseProvider.toApotheose(characterApotheose.apotheose))
      .concat(classeWithApotheoses.map((classeApotheose) => DBApotheoseProvider.toApotheose(classeApotheose.apotheose)))
      .concat(
        bloodlineWithApotheoses.map((bloodlineApotheose) =>
          DBApotheoseProvider.toApotheose(bloodlineApotheose.apotheose)
        )
      )
      .filter((apotheose) => apotheose.minLevel <= character.niveau && apotheose.maxLevel >= character.niveau)
    return Promise.all(apotheosePromises.sort((a, b) => a.position - b.position))
  }
}
