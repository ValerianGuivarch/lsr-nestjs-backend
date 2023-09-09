import { ApotheoseService } from './ApotheoseService'
import { ProficiencyService } from './ProficiencyService'
import { SkillService } from './SkillService'
import { ApotheoseState } from '../models/apotheoses/ApotheoseState'
import { Character } from '../models/characters/Character'
import { FullCharacter } from '../models/characters/FullCharacter'
import { ICharacterProvider } from '../providers/ICharacterProvider'
import { ISessionProvider } from '../providers/ISessionProvider'
import { Inject } from '@nestjs/common'
import { Observable } from 'rxjs'

export class CharacterService {
  constructor(
    @Inject('ICharacterProvider')
    private characterProvider: ICharacterProvider,
    @Inject('ISessionProvider')
    private sessionProvider: ISessionProvider,
    private skillService: SkillService,
    private apotheoseService: ApotheoseService,
    private proficiencyService: ProficiencyService
  ) {
    console.log('CharacterService')
  }

  async findOneByName(name: string): Promise<Character> {
    return this.characterProvider.findOneByName(name)
  }

  async findFullCharacterByName(name: string): Promise<FullCharacter> {
    const character = await this.characterProvider.findOneByName(name)
    return new FullCharacter({
      character: character,
      skills: await this.skillService.findSkillsByCharacter(character),
      apotheoses: await this.apotheoseService.findApotheosesByCharacter(character),
      proficiencies: await this.proficiencyService.findProficienciesByCharacter(character)
    })
  }

  async findAllControllerBy(name: string): Promise<FullCharacter[]> {
    const characters = await this.characterProvider.findAllControlledBy(name)
    return Promise.all(
      characters.map(async (character) => {
        return new FullCharacter({
          character: character,
          skills: await this.skillService.findSkillsByCharacter(character),
          apotheoses: await this.apotheoseService.findApotheosesByCharacter(character),
          proficiencies: await this.proficiencyService.findProficienciesByCharacter(character)
        })
      })
    )
  }

  async updateCharacter(p: { character: Character }): Promise<Character> {
    return await this.characterProvider.update(p.character)
  }

  getCharacterObservable(name: string): Observable<Character> {
    return this.characterProvider.getCharacterObservable(name)
  }
  getCharactersSessionObservable(): Observable<Character[]> {
    return this.characterProvider.getCharactersSessionObservable()
  }

  findAll(): Promise<Character[]> {
    return this.characterProvider.findAll()
  }

  getCharactersControlledObservable(name: string): Observable<Character[]> {
    return this.characterProvider.getCharactersControlledObservable(name)
  }

  async deleteControlledCharacter(controllerName: string, characterToDeleteName: string): Promise<void> {
    const characterToDelete = await this.characterProvider.findOneByName(characterToDeleteName)
    if (characterToDelete.isInvocation) {
      await this.characterProvider.delete(characterToDeleteName)
    } else {
      await this.characterProvider.update({
        ...characterToDelete,
        controlledBy: null
      })
    }
  }

  async rest(name: string): Promise<void> {
    const character = await this.characterProvider.findOneByName(name)
    const updatedCharacter = {
      ...character,
      apotheoseState: ApotheoseState.NONE,
      currentApotheose: null
    }
    character.dailyUseMax.forEach((maxValue, key) => {
      if (character.dailyUse.has(key)) {
        updatedCharacter.dailyUse.set(key, maxValue)
      }
    })

    await this.updateCharacter({
      character: updatedCharacter
    })
  }

  async updateSkillsAttribution(
    characterName: string,
    skillName: string,
    dailyUse?: number,
    dailyUseMax?: number
  ): Promise<void> {
    const character = await this.characterProvider.findOneByName(characterName)
    character.dailyUse[skillName] = dailyUse
    character.dailyUseMax[skillName] = dailyUseMax
    await this.characterProvider.update({
      ...character
    })
  }

  async updateApotheose(p: { characterName: string; apotheoseName: string }): Promise<Character> {
    const character = await this.characterProvider.findOneByName(p.characterName)
    const apotheose = await this.apotheoseService.findOneByName(p.apotheoseName)
    character.currentApotheose = apotheose
    if (character.currentApotheose && character.apotheoseState == ApotheoseState.NONE) {
      character.apotheoseState = ApotheoseState.COST_PAID
    }
    if (
      !character.currentApotheose &&
      (character.apotheoseState == ApotheoseState.COST_PAID || character.apotheoseState == ApotheoseState.COST_TO_PAY)
    ) {
      character.apotheoseState = ApotheoseState.ALREADY_USED
    }
    if (character.currentApotheose && character.apotheoseState == ApotheoseState.ALREADY_USED) {
      character.apotheoseState = ApotheoseState.COST_TO_PAY
    }
    return await this.characterProvider.update({
      ...character
    })
  }
}
