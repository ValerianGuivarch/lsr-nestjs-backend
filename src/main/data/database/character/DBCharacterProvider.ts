import { DBCharacter } from './DBCharacter'
import { DBCharacterTemplate } from './DBCharacterTemplate'
import { ApotheoseState } from '../../../domain/models/apotheoses/ApotheoseState'
import { BattleState } from '../../../domain/models/characters/BattleState'
import { Character, CharacterToCreate } from '../../../domain/models/characters/Character'
import { Genre } from '../../../domain/models/characters/Genre'
import { CharacterTemplate } from '../../../domain/models/invocation/CharacterTemplate'
import { CharacterTemplateReferential } from '../../../domain/models/invocation/CharacterTemplateReferential'
import { NatureLevel } from '../../../domain/models/session/NatureLevel'
import { ICharacterProvider } from '../../../domain/providers/ICharacterProvider'
import { ProviderErrors } from '../../errors/ProviderErrors'
import { DBApotheoseProvider } from '../apotheoses/DBApotheoseProvider'
import { DBSession } from '../session/DBSession'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Observable, Subject } from 'rxjs'
import { In, Not, Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class DBCharacterProvider implements ICharacterProvider {
  private characters: Map<string, Subject<Character>> = new Map()
  private charactersSession: Subject<Character[]> = new Subject()
  private charactersControlled: Map<string, Subject<Character[]>> = new Map()

  constructor(
    @InjectRepository(DBCharacter, 'postgres')
    private dbCharacterRepository: Repository<DBCharacter>,
    @InjectRepository(DBCharacterTemplate, 'postgres')
    private dbCharacterTemplateRepository: Repository<DBCharacterTemplate>,
    @InjectRepository(DBSession, 'postgres')
    private dbSessionRepository: Repository<DBSession>
  ) {}

  public async getNatureLevel(): Promise<NatureLevel> {
    const session = await this.dbSessionRepository.findOneBy({})
    if (!session) {
      throw ProviderErrors.EntityNotFound('session')
    }
    const natureValue = session.nature
    const natureIndex = Object.values(NatureLevel).indexOf(natureValue)
    const arbres = await this.dbCharacterRepository.findBy({
      bloodlineName: 'arbre',
      battleState: In([BattleState.ALLIES, BattleState.ENNEMIES])
    })

    const impact = Math.floor(
      arbres
        .map((arbre) => {
          return parseFloat(arbre.customData ?? '0')
        })
        .reduce((a, b) => {
          return a + b
        }, 0)
    )

    const nextNatureIndex = natureIndex + impact

    let nextNatureValue: NatureLevel
    if (natureValue === NatureLevel.LEVEL_5_DOMINANTE) {
      nextNatureValue = natureValue
    } else if (nextNatureIndex < Object.values(NatureLevel).length - 1) {
      nextNatureValue = Object.values(NatureLevel)[nextNatureIndex]
    } else {
      nextNatureValue = NatureLevel.LEVEL_4_SAUVAGE
    }
    return nextNatureValue
  }

  private async toCharacter(doc: DBCharacter): Promise<Character> {
    let chairBonus = 0
    let espritBonus = 0
    let essenceBonus = 0
    if (doc.bloodlineName && doc.bloodlineName === 'arbre') {
      const nextNatureValue = await this.getNatureLevel()

      switch (nextNatureValue) {
        case NatureLevel.LEVEL_0_PAUVRE:
          chairBonus = 0
          espritBonus = 0
          essenceBonus = 0
          break
        case NatureLevel.LEVEL_1_RARE:
          chairBonus = 0
          espritBonus = 0
          essenceBonus = 1
          break
        case NatureLevel.LEVEL_2_PRESENTE:
          chairBonus = 0
          espritBonus = 1
          // eslint-disable-next-line no-magic-numbers
          essenceBonus = 2
          break
        case NatureLevel.LEVEL_3_ABONDANTE:
          chairBonus = 0
          // eslint-disable-next-line no-magic-numbers
          espritBonus = 2
          // eslint-disable-next-line no-magic-numbers
          essenceBonus = 3
          break
        case NatureLevel.LEVEL_4_SAUVAGE:
          chairBonus = 0
          // eslint-disable-next-line no-magic-numbers
          espritBonus = 3
          // eslint-disable-next-line no-magic-numbers
          essenceBonus = 4
          break
        case NatureLevel.LEVEL_5_DOMINANTE:
          chairBonus = 1
          // eslint-disable-next-line no-magic-numbers
          espritBonus = 4
          // eslint-disable-next-line no-magic-numbers
          essenceBonus = 5
          break
      }
    }
    return new Character({
      name: doc.name,
      restImproved: doc.restImproved,
      classe: doc.classe,
      bloodline: doc.bloodline,
      apotheoseState: ApotheoseState[doc.apotheoseState],
      currentApotheose: doc.currentApotheose ? DBApotheoseProvider.toApotheose(doc.currentApotheose) : undefined,
      chair: doc.chair,
      esprit: doc.esprit,
      essence: doc.essence,
      chairBonus: chairBonus,
      espritBonus: espritBonus,
      essenceBonus: essenceBonus,
      pv: doc.pv,
      pvMax: doc.pvMax,
      pf: doc.pf,
      pfMax: doc.pfMax,
      pp: doc.pp,
      ppMax: doc.ppMax,
      dettes: doc.dettes,
      arcanes: doc.arcanes,
      arcanesMax: doc.arcanesMax,
      arcanePrimes: doc.arcanePrimes,
      arcanePrimesMax: doc.arcanePrimesMax,
      ether: doc.ether,
      etherMax: doc.etherMax,
      munitions: doc.munitions,
      munitionsMax: doc.munitionsMax,
      niveau: doc.niveau,
      lux: doc.lux,
      umbra: doc.umbra,
      secunda: doc.secunda,
      notes: doc.notes,
      genre: Genre[doc.genre],
      relance: doc.relance,
      playerName: doc.playerName,
      picture: doc.picture,
      pictureApotheose: doc.pictureApotheose ? doc.pictureApotheose : doc.picture,
      background: doc.background,
      buttonColor: doc.buttonColor,
      textColor: doc.textColor,
      boosted: doc.boosted,
      battleState: BattleState[doc.battleState],
      isInvocation: doc.isInvocation,
      controlledBy: doc.controlledBy,
      customData: doc.customData,
      dailyUse: new Map(Object.entries(doc.dailyUse ? doc.dailyUse : {})),
      dailyUseMax: new Map(Object.entries(doc.dailyUseMax ? doc.dailyUseMax : {}))
    })
  }

  private static toCharacterTemplate(template: DBCharacterTemplate) {
    return new CharacterTemplate({
      bloodline: template.bloodline,
      classe: template.classe,
      name: template.name,
      chairValueReferential: CharacterTemplateReferential[template.chairValueReferential],
      chairValueRule: template.chairValueRule,
      espritValueReferential: CharacterTemplateReferential[template.espritValueReferential],
      espritValueRule: template.espritValueRule,
      essenceValueReferential: CharacterTemplateReferential[template.essenceValueReferential],
      essenceValueRule: template.essenceValueRule,
      pvMaxValueReferential: CharacterTemplateReferential[template.pvMaxValueReferential],
      pvMaxValueRule: template.pvMaxValueRule,
      pfMaxValueReferential: CharacterTemplateReferential[template.pfMaxValueReferential],
      pfMaxValueRule: template.pfMaxValueRule,
      ppMaxValueReferential: CharacterTemplateReferential[template.ppMaxValueReferential],
      ppMaxValueRule: template.ppMaxValueRule,
      picture: template.picture,
      customData: template.customData
    })
  }

  private static fromCharacterTemplate(template: CharacterTemplate): DBCharacterTemplate {
    return {
      bloodlineName: template.bloodline?.name,
      classeName: template.classe?.name,
      name: template.name,
      chairValueReferential: CharacterTemplateReferential[template.chairValueReferential],
      chairValueRule: template.chairValueRule,
      espritValueReferential: CharacterTemplateReferential[template.espritValueReferential],
      espritValueRule: template.espritValueRule,
      essenceValueReferential: CharacterTemplateReferential[template.essenceValueReferential],
      essenceValueRule: template.essenceValueRule,
      pvMaxValueReferential: CharacterTemplateReferential[template.pvMaxValueReferential],
      pvMaxValueRule: template.pvMaxValueRule,
      pfMaxValueReferential: CharacterTemplateReferential[template.pfMaxValueReferential],
      pfMaxValueRule: template.pfMaxValueRule,
      ppMaxValueReferential: CharacterTemplateReferential[template.ppMaxValueReferential],
      ppMaxValueRule: template.ppMaxValueRule,
      picture: template.picture,
      customData: template.customData
    } as DBCharacterTemplate
  }

  private static fromCharacter(
    doc: CharacterToCreate,
    classeName: string,
    bloodlineName?: string
  ): Partial<DBCharacter> {
    return {
      name: doc.name,
      apotheoseState: doc.apotheoseState,
      classeName: classeName,
      bloodlineName: bloodlineName,
      currentApotheoseName: doc.currentApotheose ? doc.currentApotheose.name : null,
      chair: doc.chair,
      esprit: doc.esprit,
      essence: doc.essence,
      pv: doc.pv,
      pvMax: doc.pvMax,
      pf: doc.pf,
      pfMax: doc.pfMax,
      pp: doc.pp,
      ppMax: doc.ppMax,
      dettes: doc.dettes,
      arcanes: doc.arcanes,
      arcanesMax: doc.arcanesMax,
      ether: doc.ether,
      etherMax: doc.etherMax,
      niveau: doc.niveau,
      lux: doc.lux,
      umbra: doc.umbra,
      secunda: doc.secunda,
      notes: doc.notes,
      genre: doc.genre.toString(),
      relance: doc.relance,
      playerName: doc.playerName,
      picture: doc.picture,
      pictureApotheose: doc.pictureApotheose,
      background: doc.background,
      buttonColor: doc.buttonColor,
      textColor: doc.textColor,
      boosted: doc.boosted,
      battleState: doc.battleState.toString(),
      controlledBy: doc.controlledBy,
      customData: doc.customData,
      isInvocation: doc.isInvocation,
      arcanePrimes: doc.arcanePrimes,
      arcanePrimesMax: doc.arcanePrimesMax,
      munitions: doc.munitions,
      munitionsMax: doc.munitionsMax,
      restImproved: doc.restImproved,
      dailyUse: Object.fromEntries(doc.dailyUse),
      dailyUseMax: Object.fromEntries(doc.dailyUseMax)
    }
  }

  private async dealsWithObservables(character: Character) {
    const characterObservable = this.characters.get(character.name)
    if (characterObservable) {
      characterObservable.next(character)
    }
    const session = await this.findAllForSession()
    this.charactersSession.next(session)

    if (character.controlledBy) {
      const characters = await this.findAllControlledBy(character.controlledBy)
      const charactersControlledObservable = this.charactersControlled.get(character.controlledBy)
      if (charactersControlledObservable) {
        charactersControlledObservable.next(characters)
      }
    }
    const characters = await this.findAllControlledBy(character.name)
    const charactersControlledObservable = this.charactersControlled.get(character.name)
    if (charactersControlledObservable) {
      charactersControlledObservable.next(characters)
    }
  }

  async create(newCharacter: CharacterToCreate, classeName: string, bloodlineName?: string): Promise<Character> {
    let createdCharacter = await this.dbCharacterRepository.findOneBy({ name: newCharacter.name })
    if (!createdCharacter) {
      createdCharacter = this.dbCharacterRepository.create(
        DBCharacterProvider.fromCharacter(newCharacter, classeName, bloodlineName)
      )
      await this.toCharacter(await this.dbCharacterRepository.save(createdCharacter))
      const character = await this.findOneByName(newCharacter.name)
      await this.dealsWithObservables(character)
      return character
    } else {
      throw ProviderErrors.EntityAlreadyExists(newCharacter.name)
    }
  }

  async createInvocation(newCharacter: Character, classeName: string, bloodlineName?: string): Promise<Character> {
    const createdInvocation = this.dbCharacterRepository.create(
      DBCharacterProvider.fromCharacter(newCharacter, classeName, bloodlineName)
    )
    await this.toCharacter(await this.dbCharacterRepository.save(createdInvocation))
    const invocation = await this.findOneByName(newCharacter.name)
    await this.dealsWithObservables(invocation)
    return invocation
  }

  async findOneByName(name: string): Promise<Character> {
    const character = await this.dbCharacterRepository.findOne({
      where: { name: name },
      relations: ['classe', 'bloodline', 'currentApotheose']
    })
    if (!character) {
      throw ProviderErrors.EntityNotFound(name)
    }
    return await this.toCharacter(character)
  }

  async exist(name: string): Promise<boolean> {
    const count = await this.dbCharacterRepository.countBy({ name: name })
    return count > 0
  }

  async findAll(): Promise<Character[]> {
    const characters = await this.dbCharacterRepository.find({
      relations: ['classe', 'bloodline', 'currentApotheose']
    })
    const characterPromises = characters.map((character) => this.toCharacter(character))
    return Promise.all(characterPromises)
  }

  async findAllForSession(): Promise<Character[]> {
    const characters = await this.dbCharacterRepository.find({
      where: {
        battleState: Not(BattleState.NONE)
      },
      relations: ['classe', 'currentApotheose']
    })
    const characterPromises = characters
      .sort((c1, c2) => c1.name.localeCompare(c2.name))
      .map((character) => this.toCharacter(character))
    return Promise.all(characterPromises)
  }

  async findAllControlledBy(characterName: string): Promise<Character[]> {
    const character = await this.dbCharacterRepository.findOneByOrFail({ name: characterName })
    const characters = await this.dbCharacterRepository.find({
      where: { controlledBy: characterName },
      relations: ['classe', 'bloodline', 'currentApotheose']
    })
    characters.sort((c1, c2) => c1.name.localeCompare(c2.name)).push(character)
    const characterPromises = characters.map((character) => this.toCharacter(character))
    return Promise.all(characterPromises)
  }

  async update(characterToUpdate: Character): Promise<Character> {
    const updatedCharacter = this.dbCharacterRepository.merge(
      await this.dbCharacterRepository.findOneByOrFail({ name: characterToUpdate.name }),
      DBCharacterProvider.fromCharacter(
        characterToUpdate,
        characterToUpdate.classe.name,
        characterToUpdate.bloodline?.name
      )
    )
    await this.toCharacter(await this.dbCharacterRepository.save(updatedCharacter))
    const character = await this.findOneByName(characterToUpdate.name)
    await this.dealsWithObservables(character)
    return character
  }

  async delete(name: string): Promise<boolean> {
    const character = await this.dbCharacterRepository.findOneBy({ name: name })
    if (!character) {
      throw ProviderErrors.EntityNotFound(name)
    }
    this.characters.delete(name)
    await this.dbCharacterRepository.remove(character)
    await this.dealsWithObservables(await this.toCharacter(character))
    return true
  }

  countAll(): Promise<number> {
    return this.dbCharacterRepository.count()
  }

  getCharacterObservable(name: string): Observable<Character> {
    if (!this.characters.has(name)) {
      this.characters.set(name, new Subject())
    }
    return this.characters.get(name).asObservable()
  }

  getCharactersControlledObservable(name: string): Observable<Character[]> {
    if (!this.charactersControlled.has(name)) {
      this.charactersControlled.set(name, new Subject())
    }
    return this.charactersControlled.get(name).asObservable()
  }

  getCharactersSessionObservable(): Observable<Character[]> {
    return this.charactersSession.asObservable()
  }

  async findTemplateByName(name: string): Promise<CharacterTemplate> {
    const template = await this.dbCharacterTemplateRepository.findOne({
      where: { name: name },
      relations: ['classe', 'bloodline']
    })
    if (!template) {
      throw ProviderErrors.EntityNotFound(name)
    }
    return DBCharacterProvider.toCharacterTemplate(template)
  }
}
