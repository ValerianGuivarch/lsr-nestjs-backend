import { ProviderErrors } from '../../data/errors/ProviderErrors'
import { Category } from '../models/characters/Category'
import { Roll } from '../models/roll/Roll'
import { SuccessCalculation } from '../models/roll/SuccessCalculation'
import { SkillStat } from '../models/skills/SkillStat'
import { IBloodlineProvider } from '../providers/IBloodlineProvider'
import { ICharacterProvider } from '../providers/ICharacterProvider'
import { IRollProvider } from '../providers/IRollProvider'
import { ISessionProvider } from '../providers/ISessionProvider'
import { ISkillProvider } from '../providers/ISkillProvider'
import { Inject, Logger } from '@nestjs/common'
import { Observable, Subject } from 'rxjs'

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

  private rollsChangeSubject = new Subject<Roll[]>()

  constructor(
    @Inject('ICharacterProvider')
    private characterProvider: ICharacterProvider,
    @Inject('ISkillProvider')
    private skillProvider: ISkillProvider,
    @Inject('IBloodlineProvider')
    private bloodlineProvider: IBloodlineProvider,
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
    skillName: string
    secret: boolean
    focus: boolean
    power: boolean
    bonus: number
    malus: number
    proficiency: boolean
    empiriqueRoll?: string
    resistRoll?: string
  }): Promise<Roll> {
    const character = await this.characterProvider.findOneByName(p.rollerName)
    const bloodline = await this.bloodlineProvider.findOneByName(character.bloodlineName ?? undefined)
    const skill = (await this.skillProvider.findSkillsByCharacter(character)).filter(
      (skill) => skill.name === p.skillName
    )[0]

    let diceNumber = 0
    let diceValue = 0
    let pvDelta = 0
    let pfDelta = 0
    let ppDelta = 0
    let arcaneDelta = 0
    let dettesDelta = 0
    let usePf = p.focus && skill.allowsPf
    let usePp = p.power && skill.allowsPp
    let useProficiency = p.proficiency
    const result: number[] = []
    const data = ''
    if (skill.stat === SkillStat.EMPIRIQUE) {
      try {
        diceNumber = Number(p.empiriqueRoll?.substring(0, p.empiriqueRoll.indexOf('d')))
        diceValue = Number(p.empiriqueRoll?.substring(p.empiriqueRoll.indexOf('d') + 1))
        usePf = false
        usePp = false
        useProficiency = false
      } catch (e) {
        throw ProviderErrors.RollWrongEmpiricalRequest()
      }
    } else if (skill.stat === SkillStat.CUSTOM) {
      try {
        diceNumber = Number(skill.customRolls?.substring(0, skill.customRolls.indexOf('d')))
        diceValue = Number(skill.customRolls?.substring(skill.customRolls.indexOf('d') + 1))
        usePf = false
        usePp = false
        useProficiency = false
      } catch (e) {
        throw ProviderErrors.RollWrongEmpiricalRequest()
      }
    } else if (skill.stat === SkillStat.CHAIR || skill.stat === SkillStat.ESPRIT || skill.stat === SkillStat.ESSENCE) {
      let diceValueDelta = p.bonus - p.malus
      if (usePf) {
        diceValueDelta++
        pfDelta--
      }
      if (usePp) {
        ppDelta--
        dettesDelta = dettesDelta + bloodline.detteByPp
      }
      diceValue = RollService.CLASSIC_ROLL_VALUE
      if (skill.stat === SkillStat.CHAIR) {
        diceNumber = character.chair + diceValueDelta
      } else if (skill.stat === SkillStat.ESPRIT) {
        diceNumber = character.esprit + diceValueDelta
      } else if (skill.stat === SkillStat.ESSENCE) {
        diceNumber = character.essence + diceValueDelta
      }
    }
    let success: number | null = null
    let juge12: number | null = null
    let juge34: number | null = null
    if (skill.successCalculation !== SuccessCalculation.AUCUN) {
      success = 0
      juge12 = 0
      juge34 = 0
    }
    for (let i = 0; i < diceNumber; i++) {
      const dice = RollService.randomIntFromInterval(1, diceValue)
      if (skill.successCalculation !== SuccessCalculation.AUCUN) {
        if (character.name === 'vernet' && i === 0) {
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
    if (skill.successCalculation === SuccessCalculation.SIMPLE_PLUS_1) {
      success = (success ?? 0) + 1
      juge12 = (juge12 ?? 0) + 1
      juge34 = (juge34 ?? 0) + 1
    }

    if (skill.successCalculation === SuccessCalculation.DIVISE) {
      // eslint-disable-next-line no-magic-numbers
      success = Math.ceil(success / 2)
      // eslint-disable-next-line no-magic-numbers
      juge12 = Math.ceil(juge12 / 2)
      // eslint-disable-next-line no-magic-numbers
      juge34 = Math.ceil(juge34 / 2)
    }

    if (skill.successCalculation === SuccessCalculation.DIVISE_PLUS_1) {
      // eslint-disable-next-line no-magic-numbers
      success = Math.ceil(success / 2) + 1
      // eslint-disable-next-line no-magic-numbers
      juge12 = Math.ceil(juge12 / 2) + 1
      // eslint-disable-next-line no-magic-numbers
      juge34 = Math.ceil(juge34 / 2) + 1
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

    pvDelta = pvDelta - skill.pvCost
    pfDelta = pfDelta - skill.pfCost
    ppDelta = ppDelta - skill.ppCost
    arcaneDelta = arcaneDelta - skill.arcaneCost
    dettesDelta = dettesDelta + skill.dettesCost * bloodline.detteByMagicAction
    if (character.pv + pvDelta < 0) {
      throw ProviderErrors.RollNotEnoughPv()
    } else if (character.pf + pfDelta < 0) {
      throw ProviderErrors.RollNotEnoughPf()
    } else if (character.pp + ppDelta < 0) {
      throw ProviderErrors.RollNotEnoughPp()
    } else if (character.arcanes + arcaneDelta < 0) {
      throw ProviderErrors.RollNotEnoughArcane()
    }
    const rollToCreate = new Roll({
      rollerName: p.rollerName,
      data: data,
      date: new Date(),
      secret: skill.secret,
      displayDices: character.category === Category.PJ || character.category === Category.PNJ_ALLY,
      focus: usePf,
      power: usePp,
      proficiency: useProficiency,
      bonus: p.bonus,
      malus: p.malus,
      result: result,
      success: success,
      juge12: juge12,
      juge34: juge34,
      resistRoll: p.resistRoll,
      picture: character.apotheoseName ? character.pictureApotheose : character.picture,
      empiriqueRoll: p.empiriqueRoll,
      display: skill.display,
      stat: skill.stat
    })
    const createdRoll = await this.rollProvider.add(rollToCreate)
    character.pv += pvDelta
    character.pf += pfDelta
    character.pp += ppDelta
    character.arcanes += arcaneDelta
    character.dettes += dettesDelta
    await this.characterProvider.update(character)
    const rolls = await this.getLast()
    this.rollsChangeSubject.next(rolls)
    return createdRoll
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

  getRollsChangeObservable(): Observable<Roll[]> {
    return this.rollsChangeSubject.asObservable()
  }
}
