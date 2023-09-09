import { DBProficiency } from './DBProficiency'
import { DisplayCategory } from '../../../domain/models/characters/DisplayCategory'
import { Proficiency } from '../../../domain/models/proficiencies/Proficiency'
import { IProficiencyProvider } from '../../../domain/providers/IProficiencyProvider'
import { Injectable } from '@nestjs/common' // adjust the path as needed
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class DBProficiencyProvider implements IProficiencyProvider {
  constructor(
    @InjectRepository(DBProficiency, 'postgres')
    private dbProficiencyRepository: Repository<DBProficiency>
  ) {}

  static toProficiency(proficiency: DBProficiency): Proficiency {
    return new Proficiency({
      name: proficiency.name,
      shortName: proficiency.shortName,
      minLevel: proficiency.minLevel || 1,
      displayCategory: DisplayCategory[proficiency.displayCategory],
      description: proficiency.description
    })
  }

  async findProficienciesByCharacter(characterName: string): Promise<Proficiency[]> {
    const proficiencies = await this.dbProficiencyRepository
      .createQueryBuilder('proficiency')
      .innerJoinAndSelect('proficiency.characters', 'character', 'character.name = :name', { name: characterName })
      .getMany()

    return proficiencies.map(DBProficiencyProvider.toProficiency)
  }

  async findProficienciesByBloodline(bloodlineName: string): Promise<Proficiency[]> {
    const proficiencies = await this.dbProficiencyRepository
      .createQueryBuilder('proficiency')
      .innerJoinAndSelect('proficiency.bloodlines', 'bloodline', 'bloodline.name = :name', { name: bloodlineName })
      .getMany()

    return proficiencies.map(DBProficiencyProvider.toProficiency)
  }

  async findProficienciesByClasse(classeName: string): Promise<Proficiency[]> {
    const proficiencies = await this.dbProficiencyRepository
      .createQueryBuilder('proficiency')
      .innerJoinAndSelect('proficiency.classes', 'classe', 'classe.name = :name', { name: classeName })
      .getMany()

    return proficiencies.map(DBProficiencyProvider.toProficiency)
  }
}
