import { ProviderErrors } from '../../data/errors/ProviderErrors'
import { Apotheose } from '../models/characters/Apotheose'
import { Bloodline } from '../models/characters/Bloodline'
import { Category } from '../models/characters/Category'
import { Classe } from '../models/characters/Classe'
import { Roll } from '../models/roll/Roll'
import { RollType } from '../models/roll/RollType'
import { ICharacterProvider } from '../providers/ICharacterProvider'
import { IRollProvider } from '../providers/IRollProvider'
import { ISessionProvider } from '../providers/ISessionProvider'
import { Inject, Logger } from '@nestjs/common'

export class RollService {
  // eslint-disable-next-line no-magic-numbers
  public static readonly MAX_ROLL_LIST_SIZE = 50
  // eslint-disable-next-line no-magic-numbers
  public static readonly CLASSIC_ROLL_VALUE = 6
  // eslint-disable-next-line no-magic-numbers
  public static readonly DEATH_ROLL_VALUE = 20
  // eslint-disable-next-line no-magic-numbers
  public static readonly ONE_SUCCESS_DICE_12 = 1
  // eslint-disable-next-line no-magic-numbers
  public static readonly TWO_SUCCESS_DICE_12 = 2
  // eslint-disable-next-line no-magic-numbers
  public static readonly ONE_SUCCESS_DICE_34 = 3
  // eslint-disable-next-line no-magic-numbers
  public static readonly TWO_SUCCESS_DICE_34 = 4
  // eslint-disable-next-line no-magic-numbers
  public static readonly ONE_SUCCESS_DICE_56 = 5
  // eslint-disable-next-line no-magic-numbers
  public static readonly TWO_SUCCESS_DICE_56 = 6
  // eslint-disable-next-line no-magic-numbers
  public static readonly ONE_SUCCESS_EFFECT = 1
  // eslint-disable-next-line no-magic-numbers
  public static readonly TWO_SUCCESS_EFFECT = 2
  // eslint-disable-next-line no-magic-numbers
  public static readonly PACIFICATEUR_CONSEQUENCE = 10

  private readonly logger = new Logger(RollService.name)
  constructor(
    @Inject('ICharacterProvider')
    private characterProvider: ICharacterProvider,
    @Inject('ISessionProvider')
    private sessionProvider: ISessionProvider,
    @Inject('IRollProvider')
    private rollProvider: IRollProvider
  ) {
    console.log('RollService')
  }
  async getLast(): Promise<Roll[]> {
    return this.rollProvider.getLast(RollService.MAX_ROLL_LIST_SIZE)
  }

  async roll(p: {
    rollerName: string
    rollType: RollType
    secret: boolean
    focus: boolean
    power: boolean
    proficiency: boolean
    benediction: number
    malediction: number
    empirique?: string
    characterToHelp?: string
    resistRoll?: string
  }): Promise<Roll> {
    const character = await this.characterProvider.findOneByName(p.rollerName)
    if (p.rollType === RollType.RELANCE) {
      const lastRoll = await this.rollProvider.getLastForCharacter(character)
      if (lastRoll === undefined) {
        throw ProviderErrors.RollNoPreviousRoll()
      }

      let relance = character.relance
      if (character.category != Category.PJ) {
        relance = (await this.sessionProvider.getSessionCharacter()).relanceMj
      }
      if (relance <= 0) {
        throw ProviderErrors.RollNotEnoughRelance()
      }
      lastRoll.date = new Date()
      lastRoll.juge12 =
        (lastRoll.juge12 ?? 0) -
        lastRoll.result.filter((r) => r === RollService.ONE_SUCCESS_DICE_12).length * RollService.ONE_SUCCESS_EFFECT -
        lastRoll.result.filter((r) => r === RollService.TWO_SUCCESS_DICE_12).length * RollService.TWO_SUCCESS_EFFECT
      lastRoll.juge34 =
        (lastRoll.juge34 ?? 0) -
        lastRoll.result.filter((r) => r === RollService.ONE_SUCCESS_DICE_34).length * RollService.ONE_SUCCESS_EFFECT -
        lastRoll.result.filter((r) => r === RollService.TWO_SUCCESS_DICE_34).length * RollService.TWO_SUCCESS_EFFECT
      lastRoll.success =
        (lastRoll.success ?? 0) -
        lastRoll.result.filter((r) => r === RollService.ONE_SUCCESS_DICE_56).length * RollService.ONE_SUCCESS_EFFECT -
        lastRoll.result.filter((r) => r === RollService.TWO_SUCCESS_DICE_56).length * RollService.TWO_SUCCESS_EFFECT

      const diceNumber = lastRoll.result.length
      lastRoll.result = []
      for (let i = 0; i < diceNumber; i++) {
        const dice = RollService.randomIntFromInterval(1, RollService.CLASSIC_ROLL_VALUE)
        if (dice === RollService.ONE_SUCCESS_DICE_56) {
          lastRoll.success = (lastRoll.success ?? 0) + RollService.ONE_SUCCESS_EFFECT
        }
        if (dice === RollService.TWO_SUCCESS_DICE_56) {
          // eslint-disable-next-line no-magic-numbers
          lastRoll.success = (lastRoll.success ?? 0) + RollService.TWO_SUCCESS_EFFECT
        }
        if (dice === RollService.ONE_SUCCESS_DICE_12) {
          lastRoll.juge12 = (lastRoll.success ?? 0) + RollService.ONE_SUCCESS_EFFECT
        }
        if (dice === RollService.TWO_SUCCESS_DICE_12) {
          // eslint-disable-next-line no-magic-numbers
          lastRoll.juge12 = (lastRoll.success ?? 0) + RollService.TWO_SUCCESS_EFFECT
        }
        if (dice === RollService.ONE_SUCCESS_DICE_34) {
          lastRoll.juge34 = (lastRoll.success ?? 0) + RollService.ONE_SUCCESS_EFFECT
        }
        if (dice === RollService.TWO_SUCCESS_DICE_34) {
          // eslint-disable-next-line no-magic-numbers
          lastRoll.juge34 = (lastRoll.success ?? 0) + RollService.TWO_SUCCESS_EFFECT
        }
        lastRoll.result.push(dice)
      }
      character.relance = relance - 1
      await this.characterProvider.createOrUpdate(character)
      return lastRoll //await this.rollProvider.update(lastRoll)
    }
    let diceNumber = 0
    let diceValue = 0
    let diceValueDelta = p.benediction - p.malediction
    let pfDelta = 0
    let ppDelta = 0
    let arcaneDelta = 0
    let dettesDelta = 0
    let usePf = p.focus
    let usePp = p.power
    let useProficiency = p.proficiency
    let result: number[] = []
    let successToCalculate = true
    const availableHelp = await this.rollProvider.availableHelp(p.rollerName)
    let helpCanBeUsed = false
    let data = ''
    let secret = p.secret
    if (
      p.rollType === RollType.SOIN ||
      p.rollType === RollType.MAGIE_FORTE ||
      p.rollType === RollType.MAGIE_LEGERE ||
      p.rollType === RollType.ESPRIT ||
      p.rollType === RollType.ARCANE_ESPRIT ||
      p.rollType === RollType.ESSENCE ||
      p.rollType === RollType.ARCANE_ESSENCE ||
      p.rollType === RollType.CHAIR
    ) {
      helpCanBeUsed = true
      for (const help of availableHelp) {
        if (!help.helpUsed) {
          if (help.success === 0) {
            diceValueDelta--
          } else {
            diceValueDelta = diceValueDelta + (help.success ?? 0)
          }
        }
      }
    }
    if (p.rollType === RollType.APOTHEOSE) {
      secret = true
    }
    if (
      character.apotheose != Apotheose.NONE &&
      (p.rollType === RollType.SOIN ||
        p.rollType === RollType.MAGIE_FORTE ||
        p.rollType === RollType.MAGIE_LEGERE ||
        p.rollType === RollType.ESPRIT ||
        p.rollType === RollType.ESSENCE ||
        p.rollType === RollType.CHAIR)
    ) {
      if (character.apotheose == Apotheose.FINALE) {
        // eslint-disable-next-line no-magic-numbers
        diceValueDelta = diceValueDelta + 5
      } else if (character.apotheose == Apotheose.ARCANIQUE) {
        // eslint-disable-next-line no-magic-numbers
        diceValueDelta = diceValueDelta + 2
      } else {
        // eslint-disable-next-line no-magic-numbers
        diceValueDelta = diceValueDelta + 3
      }
    }

    if (usePf) {
      diceValueDelta++
    }
    if (p.rollType === RollType.CHAIR) {
      diceNumber = character.chair + diceValueDelta
      diceValue = RollService.CLASSIC_ROLL_VALUE
    } else if (p.rollType === RollType.ESPRIT) {
      diceNumber = character.esprit + diceValueDelta
      diceValue = RollService.CLASSIC_ROLL_VALUE
    } else if (p.rollType === RollType.ESSENCE) {
      diceNumber = character.essence + diceValueDelta
      diceValue = RollService.CLASSIC_ROLL_VALUE
    } else if (p.rollType === RollType.ARCANE_FIXE) {
      diceNumber = 0
      diceValue = 0
      arcaneDelta--
      usePp = false
      usePf = false
      useProficiency = false
      successToCalculate = false
    } else if (p.rollType === RollType.ARCANE_ESPRIT) {
      diceNumber = character.esprit + diceValueDelta
      diceValue = RollService.CLASSIC_ROLL_VALUE
      arcaneDelta--
      usePp = false
    } else if (p.rollType === RollType.ARCANE_ESSENCE) {
      diceNumber = character.essence + diceValueDelta
      diceValue = RollService.CLASSIC_ROLL_VALUE
      arcaneDelta--
      usePp = false
    } else if (p.rollType === RollType.MAGIE_LEGERE) {
      diceNumber = character.essence + diceValueDelta
      diceValue = RollService.CLASSIC_ROLL_VALUE
      usePp = false
      ppDelta--
    } else if (p.rollType === RollType.MAGIE_FORTE) {
      diceNumber = character.essence + diceValueDelta
      if (character.name === 'Jack Frost') {
        // eslint-disable-next-line no-magic-numbers
        diceNumber = diceNumber + 18
      }
      diceValue = RollService.CLASSIC_ROLL_VALUE
      dettesDelta++
      if (character.bloodline === Bloodline.FOUDRE) {
        dettesDelta++
      }
    } else if (p.rollType === RollType.SOIN && character.bloodline !== Bloodline.LUMIERE) {
      diceNumber = character.essence + diceValueDelta
      diceValue = RollService.CLASSIC_ROLL_VALUE
      dettesDelta++
      if (character.bloodline === Bloodline.FOUDRE) {
        dettesDelta++
      }
      ppDelta--
    } else if (p.rollType === RollType.SOIN && character.bloodline === Bloodline.LUMIERE) {
      diceNumber = character.essence + diceValueDelta
      diceValue = RollService.CLASSIC_ROLL_VALUE
      ppDelta--
    } else if (p.rollType === RollType.EMPIRIQUE) {
      try {
        diceNumber = Number(p.empirique?.substring(0, p.empirique.indexOf('d')))
        diceValue = Number(p.empirique?.substring(p.empirique.indexOf('d') + 1))
        usePf = false
        usePp = false
        useProficiency = false
        successToCalculate = false
      } catch (e) {
        throw ProviderErrors.RollWrongEmpiricalRequest()
      }
    } else if (p.rollType === RollType.APOTHEOSE) {
      try {
        diceNumber = 1
        diceValue = RollService.CLASSIC_ROLL_VALUE
        usePf = false
        usePp = false
        useProficiency = false
        successToCalculate = false
      } catch (e) {
        throw ProviderErrors.RollWrongEmpiricalRequest()
      }
    } else if (p.rollType === RollType.SAUVEGARDE_VS_MORT) {
      diceNumber = 1
      diceValue = RollService.DEATH_ROLL_VALUE
      usePf = false
      usePp = false
      useProficiency = false
      successToCalculate = false
    }
    if (usePf) {
      pfDelta--
    }
    if (usePp) {
      ppDelta--
      dettesDelta++
      if (character.bloodline === Bloodline.FOUDRE) {
        dettesDelta++
      }
    }
    let success: number | null = null
    let juge12: number | null = null
    let juge34: number | null = null
    if (successToCalculate) {
      success = 0
      juge12 = 0
      juge34 = 0
    }
    for (let i = 0; i < diceNumber; i++) {
      const dice = RollService.randomIntFromInterval(1, diceValue)
      if (successToCalculate) {
        if (character.name === 'Vernet' && i === 0) {
          if (
            dice === RollService.ONE_SUCCESS_DICE_12 ||
            dice === RollService.ONE_SUCCESS_DICE_34 ||
            dice === RollService.ONE_SUCCESS_DICE_56
          ) {
            success = (success ?? 0) + RollService.ONE_SUCCESS_EFFECT
          }
          if (
            dice === RollService.TWO_SUCCESS_DICE_12 ||
            dice === RollService.TWO_SUCCESS_DICE_34 ||
            dice === RollService.TWO_SUCCESS_DICE_56
          ) {
            success = (success ?? 0) + RollService.TWO_SUCCESS_EFFECT
          }
        } else {
          if (dice === RollService.ONE_SUCCESS_DICE_56) {
            success = (success ?? 0) + RollService.ONE_SUCCESS_EFFECT
          }
          if (dice === RollService.TWO_SUCCESS_DICE_56) {
            success = (success ?? 0) + RollService.TWO_SUCCESS_EFFECT
          }
          if (dice === RollService.ONE_SUCCESS_DICE_12) {
            juge12 = (juge12 ?? 0) + RollService.ONE_SUCCESS_EFFECT
          }
          if (dice === RollService.TWO_SUCCESS_DICE_12) {
            juge12 = (juge12 ?? 0) + RollService.TWO_SUCCESS_EFFECT
          }
          if (dice === RollService.ONE_SUCCESS_DICE_34) {
            juge34 = (juge34 ?? 0) + RollService.ONE_SUCCESS_EFFECT
          }
          if (dice === RollService.TWO_SUCCESS_DICE_34) {
            juge34 = (juge34 ?? 0) + RollService.TWO_SUCCESS_EFFECT
          }
        }
      }
      result.push(dice)
    }

    let successBis: number | null = null
    let juge12Bis: number | null = null
    let juge34Bis: number | null = null
    const resultBis: number[] = []

    if (character.boosted) {
      for (let i = 0; i < diceNumber; i++) {
        const dice = RollService.randomIntFromInterval(1, diceValue)
        if (successToCalculate) {
          if (dice === RollService.ONE_SUCCESS_DICE_56) {
            successBis = (successBis ?? 0) + RollService.ONE_SUCCESS_EFFECT
          }
          if (dice === RollService.TWO_SUCCESS_DICE_56) {
            successBis = (successBis ?? 0) + RollService.TWO_SUCCESS_EFFECT
          }
          if (dice === RollService.ONE_SUCCESS_DICE_12) {
            juge12Bis = (juge12Bis ?? 0) + RollService.ONE_SUCCESS_EFFECT
          }
          if (dice === RollService.TWO_SUCCESS_DICE_12) {
            juge12Bis = (juge12Bis ?? 0) + RollService.TWO_SUCCESS_EFFECT
          }
          if (dice === RollService.ONE_SUCCESS_DICE_34) {
            juge34Bis = (juge34Bis ?? 0) + RollService.ONE_SUCCESS_EFFECT
          }
          if (dice === RollService.TWO_SUCCESS_DICE_34) {
            juge34Bis = (juge34Bis ?? 0) + RollService.TWO_SUCCESS_EFFECT
          }
        }
        resultBis.push(dice)
      }
    }
    if ((success ? success : 0) < (successBis ? successBis : 0)) {
      success = successBis
      juge12 = juge12Bis
      juge34 = juge34Bis
      result = resultBis
    }
    if (usePp) {
      success = (success ?? 0) + 1
      juge12 = (juge12 ?? 0) + 1
      juge34 = (juge34 ?? 0) + 1
    }
    if (useProficiency) {
      success = (success ?? 0) + 1
      juge12 = (juge12 ?? 0) + 1
      juge34 = (juge34 ?? 0) + 1
    }

    if (p.rollType === RollType.SOIN) {
      if (character.bloodline !== Bloodline.LUMIERE) {
        // eslint-disable-next-line no-magic-numbers
        success = Math.floor((1 + (success ?? 0)) / 2)
        // eslint-disable-next-line no-magic-numbers
        juge12 = Math.floor((1 + (juge12 ?? 0)) / 2)
        // eslint-disable-next-line no-magic-numbers
        juge34 = Math.floor((1 + (juge34 ?? 0)) / 2)
      }
      success = (success ?? 0) + 1
      juge12 = (juge12 ?? 0) + 1
      juge34 = (juge34 ?? 0) + 1
    }
    if (character.pf + pfDelta < 0) {
      throw ProviderErrors.RollNotEnoughPf()
    } else if (character.pp + ppDelta < 0) {
      throw ProviderErrors.RollNotEnoughPp()
    } else if (character.arcanes + arcaneDelta < 0) {
      throw ProviderErrors.RollNotEnoughArcane()
    } else {
      let helpUsed: boolean | null = null
      if (p.characterToHelp) {
        helpUsed = false
      }

      if (character.classe === Classe.PACIFICATEUR && p.rollType === RollType.APOTHEOSE && result[0] === 1) {
        const consequence = RollService.randomIntFromInterval(1, RollService.PACIFICATEUR_CONSEQUENCE)
        if (consequence == 1) {
          data = "Dysfonctionnement, impossible d'agir"
          // eslint-disable-next-line no-magic-numbers
        } else if (consequence == 2) {
          data = 'Subit un effet de dette du roi de la dernière attaque magique subit'
          // eslint-disable-next-line no-magic-numbers
        } else if (consequence == 3) {
          data = 'Le personnage émet de la musique et se met à faire la danse du robot'
          // eslint-disable-next-line no-magic-numbers
        } else if (consequence == 4) {
          data = 'Exacerber l’Umbra'
          // eslint-disable-next-line no-magic-numbers
        } else if (consequence == 5) {
          data = "Le personnage brille d'une lumière aléatoire"
          // eslint-disable-next-line no-magic-numbers
        } else if (consequence == 6) {
          data = 'Perturbation du don des langues'
          // eslint-disable-next-line no-magic-numbers
        } else if (consequence == 7) {
          data = 'Hallucination'
          // eslint-disable-next-line no-magic-numbers
        } else if (consequence == 8) {
          data = 'Rayon laser avec les yeux'
          // eslint-disable-next-line no-magic-numbers
        } else if (consequence == 9) {
          data = 'Le personnage redevient un enfant pendant un certain temps'
          // eslint-disable-next-line no-magic-numbers
        } else if (consequence == 10) {
          data = 'Communication avec le grand concepteur'
        }
      }
      const rollToCreate = new Roll({
        rollerName: p.rollerName,
        rollType: p.rollType,
        data: data,
        date: new Date(),
        secret: secret,
        displayDices: character.category === Category.PJ || character.category === Category.PNJ_ALLY,
        focus: usePf,
        power: usePp,
        proficiency: useProficiency,
        benediction: p.benediction,
        malediction: p.malediction,
        result: result,
        success: success,
        juge12: juge12,
        juge34: juge34,
        characterToHelp: p.characterToHelp,
        resistRoll: p.resistRoll,
        helpUsed: helpUsed,
        picture: character.apotheose != Apotheose.NONE ? character.pictureApotheose : character.picture,
        empirique: p.empirique,
        apotheose: character.apotheose
      })
      const createdRoll = await this.rollProvider.add(rollToCreate)
      character.pf += pfDelta
      character.pp += ppDelta
      character.arcanes += arcaneDelta
      character.dettes += dettesDelta
      this.characterProvider.createOrUpdate(character)
      if (helpCanBeUsed) {
        this.rollProvider.helpUsed(availableHelp)
      }

      /*if (
        createdRoll.resistRoll === '' &&
        createdRoll.empirique === '' &&
        createdRoll.rollType != RollType.APOTHEOSE &&
        createdRoll.rollType != RollType.EMPIRIQUE &&
        createdRoll.rollType != RollType.SAUVEGARDE_VS_MORT &&
        createdRoll.rollType != RollType.RELANCE
      ) {
        await this.sessionProvider.addCharacterBattle(
          createdRoll.rollerName,
          character.category == Category.PJ || character.category == Category.PNJ_ALLY
        )
      }*/
      return createdRoll
    }
  }

  async deleteAll(): Promise<boolean> {
    return this.rollProvider.deleteAll()
  }

  async delete(id: string): Promise<boolean> {
    return this.rollProvider.delete(id)
  }

  private static randomIntFromInterval(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  async getHelp(name: string): Promise<number> {
    const availableHelp = await this.rollProvider.availableHelp(name)
    let totalHelp = 0
    for (const help of availableHelp) {
      if (!help.helpUsed) {
        if (help.success === 0) {
          totalHelp--
        } else {
          totalHelp = totalHelp + (help.success ?? 0)
        }
      }
    }
    return totalHelp
  }
}
