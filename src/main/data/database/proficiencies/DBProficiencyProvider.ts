import { DBBloodlineProficiency } from './DBBloodlineProficiency'
import { DBCharacterProficiency } from './DBCharacterProficiency'
import { DBClasseProficiency } from './DBClasseProficiency'
import { DBProficiency } from './DBProficiency'
import { DBProficiencyAttrs } from './DBProficiencyAttrs'
import { Character } from '../../../domain/models/characters/Character'
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
    private dbProficiencyRepository: Repository<DBProficiency>,
    @InjectRepository(DBClasseProficiency, 'postgres')
    private dbClasseProficiencyRepository: Repository<DBClasseProficiency>,
    @InjectRepository(DBBloodlineProficiency, 'postgres')
    private dbBloodlineProficiencyRepository: Repository<DBBloodlineProficiency>,
    @InjectRepository(DBCharacterProficiency, 'postgres')
    private dbCharacterProficiencyRepository: Repository<DBCharacterProficiency>
  ) {}

  private static toProficiency(proficiency: DBProficiency, overloadProficiency?: DBProficiencyAttrs): Proficiency {
    return new Proficiency({
      name: proficiency.name,
      shortName: proficiency.shortName,
      minLevel:
        overloadProficiency && overloadProficiency.minLevel ? overloadProficiency.minLevel : proficiency.minLevel || 1,
      displayCategory: DisplayCategory[proficiency.displayCategory],
      description: proficiency.description
    })
  }

  async findProficienciesByCharacter(character: Character): Promise<Proficiency[]> {
    const classeWithProficiencies = await this.dbClasseProficiencyRepository.find({
      where: { classeName: character.classeName },
      relations: ['classe', 'proficiency']
    })
    const bloodlineWithProficiencies = await this.dbBloodlineProficiencyRepository.find({
      where: { bloodlineName: character.bloodlineName },
      relations: ['bloodline', 'proficiency']
    })

    const characterWithProficiencies = await this.dbCharacterProficiencyRepository.find({
      where: { characterName: character.name },
      relations: ['character', 'proficiency']
    })

    const proficiencyPromises: Proficiency[] = characterWithProficiencies.map((characterProficiency) =>
      DBProficiencyProvider.toProficiency(characterProficiency.proficiency, characterProficiency)
    )
    for (const bloodlineProficiency of bloodlineWithProficiencies) {
      if (
        proficiencyPromises.filter((proficiency) => proficiency.name === bloodlineProficiency.proficiencyName)
          .length === 0
      ) {
        proficiencyPromises.push(
          DBProficiencyProvider.toProficiency(bloodlineProficiency.proficiency, bloodlineProficiency)
        )
      }
    }
    for (const classeProficiency of classeWithProficiencies) {
      if (
        proficiencyPromises.filter((proficiency) => proficiency.name === classeProficiency.proficiencyName).length === 0
      ) {
        proficiencyPromises.push(DBProficiencyProvider.toProficiency(classeProficiency.proficiency, classeProficiency))
      }
    }
    proficiencyPromises.sort((a, b) => a.name.localeCompare(b.name))
    return Promise.all(
      proficiencyPromises.filter((proficiency) =>
        proficiency.minLevel ? proficiency.minLevel <= character.niveau : true
      )
    )
  }
}
