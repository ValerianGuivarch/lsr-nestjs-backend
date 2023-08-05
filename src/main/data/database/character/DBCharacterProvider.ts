import { DBCharacter } from './DBCharacter'
import { BattleState } from '../../../domain/models/characters/BattleState'
import { Category } from '../../../domain/models/characters/Category'
import { Character } from '../../../domain/models/characters/Character'
import { Genre } from '../../../domain/models/characters/Genre'
import { ICharacterProvider } from '../../../domain/providers/ICharacterProvider'
import { ProviderErrors } from '../../errors/ProviderErrors'
import { Injectable } from '@nestjs/common' // adjust the path as needed
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class DBCharacterProvider implements ICharacterProvider {
  constructor(
    @InjectRepository(DBCharacter, 'postgres')
    private dbCharacterRepository: Repository<DBCharacter>
  ) {}

  private static toCharacter(doc: DBCharacter): Character {
    return new Character({
      name: doc.name,
      classeName: doc.classeName,
      bloodlineName: doc.bloodlineName,
      apotheoseName: doc.apotheoseName,
      apotheoseImprovement: doc.apotheoseImprovement,
      apotheoseImprovementList: doc.apotheoseImprovementList,
      chair: doc.chair,
      esprit: doc.esprit,
      essence: doc.essence,
      bonus: doc.bonus,
      malus: doc.malus,
      pv: doc.pv,
      pvMax: doc.pvMax,
      pf: doc.pf,
      pfMax: doc.pfMax,
      pp: doc.pp,
      ppMax: doc.ppMax,
      dettes: doc.dettes,
      arcanes: doc.arcanes,
      arcanesMax: doc.arcanesMax,
      niveau: doc.niveau,
      lux: doc.lux,
      umbra: doc.umbra,
      secunda: doc.secunda,
      notes: doc.notes,
      category: Category[doc.category],
      genre: Genre[doc.genre],
      relance: doc.relance,
      playerName: doc.playerName,
      picture: doc.picture,
      pictureApotheose: doc.pictureApotheose,
      background: doc.background,
      buttonColor: doc.buttonColor,
      textColor: doc.textColor,
      boosted: doc.boosted,
      battleState: BattleState[doc.battleState]
    })
  }

  private static fromCharacter(doc: Character): DBCharacter {
    return {
      name: doc.name,
      classeName: doc.classeName,
      bloodlineName: doc.bloodlineName,
      apotheoseName: doc.apotheoseName,
      apotheoseImprovement: doc.apotheoseImprovement,
      apotheoseImprovementList: doc.apotheoseImprovementList,
      chair: doc.chair,
      esprit: doc.esprit,
      essence: doc.essence,
      bonus: doc.bonus,
      malus: doc.malus,
      pv: doc.pv,
      pvMax: doc.pvMax,
      pf: doc.pf,
      pfMax: doc.pfMax,
      pp: doc.pp,
      ppMax: doc.ppMax,
      dettes: doc.dettes,
      arcanes: doc.arcanes,
      arcanesMax: doc.arcanesMax,
      niveau: doc.niveau,
      lux: doc.lux,
      umbra: doc.umbra,
      secunda: doc.secunda,
      notes: doc.notes,
      category: doc.category.toString(),
      genre: doc.genre.toString(),
      relance: doc.relance,
      playerName: doc.playerName,
      picture: doc.picture,
      pictureApotheose: doc.pictureApotheose,
      background: doc.background,
      buttonColor: doc.buttonColor,
      textColor: doc.textColor,
      boosted: doc.boosted,
      battleState: doc.battleState.toString()
    } as DBCharacter
  }

  async create(newCharacter: Character): Promise<Character> {
    let character = await this.dbCharacterRepository.findOneBy({ name: newCharacter.name })
    if (!character) {
      character = this.dbCharacterRepository.create(DBCharacterProvider.fromCharacter(newCharacter))
      return DBCharacterProvider.toCharacter(await this.dbCharacterRepository.save(character))
    } else {
      throw ProviderErrors.EntityAlreadyExists(newCharacter.name)
    }
  }

  async findOneByName(name: string): Promise<Character> {
    const character = await this.dbCharacterRepository.findOneBy({ name: name })
    if (!character) {
      throw ProviderErrors.EntityNotFound(name)
    }
    return DBCharacterProvider.toCharacter(character)
  }

  async findByName(name: string): Promise<Character | undefined> {
    const character = await this.dbCharacterRepository.findOneBy({ name: name })
    return character ? DBCharacterProvider.toCharacter(character) : undefined
  }

  async exist(name: string): Promise<boolean> {
    const count = await this.dbCharacterRepository.countBy({ name: name })
    return count > 0
  }

  async findManyByName(names: string[]): Promise<Character[]> {
    const characters = await this.dbCharacterRepository.findBy({ name: In(names) })
    return characters.map(DBCharacterProvider.toCharacter)
  }

  async findAll(category?: Category): Promise<Character[]> {
    const characters = category
      ? await this.dbCharacterRepository.findBy({ category: category })
      : await this.dbCharacterRepository.find()
    return characters.map(DBCharacterProvider.toCharacter)
  }

  async findAllByCategory(category: Category): Promise<string[]> {
    const characters = await this.dbCharacterRepository.findBy({ category: category.toString() })
    return characters.map((c) => c.name)
  }

  async update(character: Character): Promise<Character> {
    const updatedCharacter = this.dbCharacterRepository.merge(
      await this.dbCharacterRepository.findOneByOrFail({ name: character.name }),
      DBCharacterProvider.fromCharacter(character)
    )
    return DBCharacterProvider.toCharacter(await this.dbCharacterRepository.save(updatedCharacter))
  }

  async delete(name: string): Promise<boolean> {
    const character = await this.dbCharacterRepository.findOneBy({ name: name })
    if (!character) {
      throw ProviderErrors.EntityNotFound(name)
    }
    await this.dbCharacterRepository.remove(character)
    return true
  }

  countAll(): Promise<number> {
    return this.dbCharacterRepository.count()
  }
}
