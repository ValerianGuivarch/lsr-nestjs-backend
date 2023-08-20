import { ProviderErrors } from '../../data/errors/ProviderErrors'
import { Apotheose } from '../models/apotheoses/Apotheose'
import { ApotheoseState } from '../models/apotheoses/ApotheoseState'
import { BattleState } from '../models/characters/BattleState'
import { Character } from '../models/characters/Character'
import { Roll } from '../models/roll/Roll'
import { SuccessCalculation } from '../models/roll/SuccessCalculation'
import { NatureLevel } from '../models/session/NatureLevel'
import { Skill } from '../models/skills/Skill'
import { SkillStat } from '../models/skills/SkillStat'
import { IApotheoseProvider } from '../providers/IApotheoseProvider'
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
    @Inject('IApotheoseProvider')
    private apotheoseProvider: IApotheoseProvider,
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
    character: Character
    skill: Skill
    secret: boolean
    focus: boolean
    power: boolean
    bonus: number
    malus: number
    proficiency: boolean
    empiriqueRoll?: string
    resistRoll?: string
  }): Promise<Roll> {
    const apotheose = p.character.apotheoseName
      ? (await this.apotheoseProvider.findApotheosesByCharacter(p.character)).filter(
          (apotheose) => apotheose.name === p.character.apotheoseName
        )[0]
      : undefined
    const controller = await this.characterProvider.findOneByName(p.character.controlledBy)

    let diceNumber = 0
    let diceValue = 0
    let pvDelta = 0
    let pfDelta = 0
    let ppDelta = 0
    let arcaneDelta = 0
    let arcanePrimeDelta = 0
    let dettesDelta = 0
    let usePf = p.focus && p.skill.allowsPf
    let usePp = p.power && p.skill.allowsPp
    let useProficiency = p.proficiency
    const result: number[] = []
    let data = ''
    if (p.skill.stat === SkillStat.EMPIRIQUE) {
      try {
        diceNumber = Number(p.empiriqueRoll?.substring(0, p.empiriqueRoll.indexOf('d')))
        diceValue = Number(p.empiriqueRoll?.substring(p.empiriqueRoll.indexOf('d') + 1))
        usePf = false
        usePp = false
        useProficiency = false
      } catch (e) {
        throw ProviderErrors.RollWrongEmpiricalRequest()
      }
    } else if (p.skill.stat === SkillStat.CUSTOM) {
      try {
        diceNumber = Number(p.skill.customRolls?.substring(0, p.skill.customRolls.indexOf('d')))
        diceValue = Number(p.skill.customRolls?.substring(p.skill.customRolls.indexOf('d') + 1))
        usePf = false
        usePp = false
        useProficiency = false
      } catch (e) {
        throw ProviderErrors.RollWrongEmpiricalRequest()
      }
    } else if (
      p.skill.stat === SkillStat.CHAIR ||
      p.skill.stat === SkillStat.ESPRIT ||
      p.skill.stat === SkillStat.ESSENCE
    ) {
      let diceValueDelta = p.bonus - p.malus
      if (usePf) {
        diceValueDelta++
        pfDelta--
      }
      if (usePp) {
        ppDelta--
      }

      if (apotheose) {
        if (!p.skill.isArcanique || (p.skill.isArcanique && apotheose.arcaneImprovement)) {
          if (p.skill.stat === SkillStat.CHAIR) {
            diceValueDelta += apotheose.chairImprovement
          } else if (p.skill.stat === SkillStat.ESPRIT) {
            diceValueDelta += apotheose.espritImprovement
          } else if (p.skill.stat === SkillStat.ESSENCE) {
            diceValueDelta += apotheose.essenceImprovement
          }
        }
      }

      diceValue = RollService.CLASSIC_ROLL_VALUE
      if (p.skill.stat === SkillStat.CHAIR) {
        diceNumber = p.character.chair + diceValueDelta + p.character.chairBonus
      } else if (p.skill.stat === SkillStat.ESPRIT) {
        diceNumber = p.character.esprit + diceValueDelta + p.character.espritBonus
      } else if (p.skill.stat === SkillStat.ESSENCE) {
        diceNumber = p.character.essence + diceValueDelta + p.character.essenceBonus
      }
    }
    let success: number | null = null
    let juge12: number | null = null
    let juge34: number | null = null
    if (p.skill.successCalculation !== SuccessCalculation.AUCUN) {
      success = 0
      juge12 = 0
      juge34 = 0
    }
    for (let i = 0; i < diceNumber; i++) {
      const dice = RollService.randomIntFromInterval(1, diceValue)
      if (p.skill.successCalculation !== SuccessCalculation.AUCUN) {
        if (p.character.name === 'vernet' && i === 0) {
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
    if (p.skill.successCalculation === SuccessCalculation.SIMPLE_PLUS_1) {
      success = (success ?? 0) + 1
      juge12 = (juge12 ?? 0) + 1
      juge34 = (juge34 ?? 0) + 1
    }

    if (p.skill.successCalculation === SuccessCalculation.DIVISE) {
      // eslint-disable-next-line no-magic-numbers
      success = Math.ceil(success / 2)
      // eslint-disable-next-line no-magic-numbers
      juge12 = Math.ceil(juge12 / 2)
      // eslint-disable-next-line no-magic-numbers
      juge34 = Math.ceil(juge34 / 2)
    }

    if (p.skill.successCalculation === SuccessCalculation.DIVISE_PLUS_1) {
      // eslint-disable-next-line no-magic-numbers
      success = Math.ceil(success / 2) + 1
      // eslint-disable-next-line no-magic-numbers
      juge12 = Math.ceil(juge12 / 2) + 1
      // eslint-disable-next-line no-magic-numbers
      juge34 = Math.ceil(juge34 / 2) + 1
    }

    if (p.skill.successCalculation === SuccessCalculation.DOUBLE) {
      // eslint-disable-next-line no-magic-numbers
      success = Math.ceil(success * 2)
      // eslint-disable-next-line no-magic-numbers
      juge12 = Math.ceil(juge12 * 2)
      // eslint-disable-next-line no-magic-numbers
      juge34 = Math.ceil(juge34 * 2)
    }

    if (p.skill.successCalculation === SuccessCalculation.DOUBLE_PLUS_1) {
      // eslint-disable-next-line no-magic-numbers
      success = Math.ceil(success * 2) + 1
      // eslint-disable-next-line no-magic-numbers
      juge12 = Math.ceil(juge12 * 2) + 1
      // eslint-disable-next-line no-magic-numbers
      juge34 = Math.ceil(juge34 * 2) + 1
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

    pvDelta = pvDelta - p.skill.pvCost
    pfDelta = pfDelta - p.skill.pfCost
    ppDelta = ppDelta - p.skill.ppCost
    arcaneDelta = arcaneDelta - p.skill.arcaneCost
    dettesDelta = dettesDelta + p.skill.dettesCost
    arcanePrimeDelta = arcanePrimeDelta + p.skill.arcanePrimeCost
    if (p.character.pv + pvDelta < 0) {
      throw ProviderErrors.RollNotEnoughPv()
    } else if (p.character.pf + pfDelta < 0) {
      throw ProviderErrors.RollNotEnoughPf()
    } else if (p.character.pp + ppDelta < 0) {
      throw ProviderErrors.RollNotEnoughPp()
    } else if (p.character.arcanes + arcaneDelta < 0) {
      throw ProviderErrors.RollNotEnoughArcane()
    } else if (p.character.arcanePrimes + arcanePrimeDelta < 0) {
      throw ProviderErrors.RollNotEnoughArcanePrime()
    } else if (p.skill.dailyUse === 0) {
      throw ProviderErrors.RollNotEnoughDailyUse()
    }
    if (p.skill.successCalculation === SuccessCalculation.CUSTOM) {
      if (p.skill.name === 'KO') {
        // eslint-disable-next-line no-magic-numbers
        if (result[0] == 1) {
          data = ' et échoue dangereusement'
          // eslint-disable-next-line no-magic-numbers
        } else if (result[0] == 20) {
          data = ' et se relève'
          // eslint-disable-next-line no-magic-numbers
        } else if (result[0] < 10) {
          data = ' et échoue'
        } else {
          data = ' et réussi'
        }
      } else if (p.skill.name === 'Reconnaissance naturelle') {
        const natureLevel = await this.characterProvider.getNatureLevel()
        switch (natureLevel) {
          case NatureLevel.LEVEL_0_PAUVRE:
            data = ' et perçoit un niveau de nature pauvre (0).'
            break
          case NatureLevel.LEVEL_1_RARE:
            data = ' et perçoit un niveau de nature rare (1).'
            break
          case NatureLevel.LEVEL_2_PRESENTE:
            data = ' et perçoit un niveau de nature présente (2).'
            break
          case NatureLevel.LEVEL_3_ABONDANTE:
            data = ' et perçoit un niveau de nature abondante (3).'
            break
          case NatureLevel.LEVEL_4_SAUVAGE:
            data = ' et perçoit un niveau de nature sauvage (4).'
            break
          case NatureLevel.LEVEL_5_DOMINANTE:
            data = ' et perçoit un niveau de nature dominante (5).'
            break
          default:
            data = ' et perçoit un niveau de nature inconnu.'
            break
        }
      } else if (p.skill.name === 'pokéball') {
        const pokemons = [
          'Bulbizarre',
          'Herbizarre',
          'Florizarre',
          'Salamèche',
          'Reptincel',
          'Dracaufeu',
          'Carapuce',
          'Carabaffe',
          'Tortank',
          'Chenipan',
          'Chrysacier',
          'Papilusion',
          'Aspicot',
          'Coconfort',
          'Dardargnan',
          'Roucool',
          'Roucoups',
          'Roucarnage',
          'Rattata',
          'Rattatac',
          'Piafabec',
          'Rapasdepic',
          'Abra',
          'Kadabra',
          'Alakazam',
          'Machoc',
          'Machopeur',
          'Mackogneur',
          'Chétiflor',
          'Boustiflor',
          'Empiflor',
          'Tentacool',
          'Tentacruel',
          'Miaouss',
          'Persian',
          'Psykokwak',
          'Akwakwak',
          'Férosinge',
          'Colossinge',
          'Caninos',
          'Arcanin',
          'Ptitard',
          'Têtarte',
          'Tarpaud',
          'Abra',
          'Kadabra',
          'Alakazam',
          'Machoc',
          'Machopeur',
          'Mackogneur',
          'Nosferapti',
          'Nosferalto',
          'Mystherbe',
          'Orthan',
          'Ectoplasma',
          'Onix',
          'Soporifik',
          'Hypnomade',
          'Krabby',
          'Krabboss',
          'Voltorbe',
          'Électrode',
          'Noeunoeuf',
          'Noadkoko',
          'Osselait',
          'Ossatueur',
          'Kicklee',
          'Tygnon',
          'Excelangue',
          'Smogo',
          'Smogogo',
          'Rhinocorne',
          'Rhinoféros',
          'Leveinard',
          'Saquedeneu',
          'Kangourex',
          'Hypotrempe',
          'Hypocéan',
          'Poissirène',
          'Poissoroy',
          'Stari',
          'Staross',
          'M.Mime',
          'Insécateur',
          'Lippoutou',
          'Élektek',
          'Magmar',
          'Pinsir',
          'Tauros',
          'Magicarpe',
          'Léviator',
          'Lokhlass',
          'Métamorph',
          'Évoli',
          'Aquali',
          'Voltali',
          'Pyroli',
          'Porygon',
          'Amonita',
          'Amonistar',
          'Kabuto',
          'Kabutops',
          'Ptéra',
          'Ronflex',
          'Artikodin',
          'Électhor',
          'Sulfura',
          'Minidraco',
          'Draco',
          'Dracolosse',
          'Mewtwo'
        ]

        data = ' et fait apparaître'

        // eslint-disable-next-line no-magic-numbers
        if (result[0] >= 1 && result[0] <= 150) {
          console.log('result[0] : ' + result[0])
          data += ' un *' + pokemons[result[0] - 1] + '*'
          console.log('data : ' + data)
        } else {
          data += ' un pokémon inconnu'
        }
      }
    }
    const rollToCreate = await Roll.rollToCreateFactory({
      rollerName: p.character.name,
      data: data,
      date: new Date(),
      secret: p.skill.secret || p.secret,
      displayDices: p.character.battleState === BattleState.ALLIES || controller.battleState === BattleState.ALLIES,
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
      picture: apotheose ? p.character.pictureApotheose : p.character.picture,
      empiriqueRoll: p.empiriqueRoll,
      display: p.skill.display,
      stat: p.skill.stat
    })
    const createdRoll = await this.rollProvider.add(rollToCreate)
    if (p.skill.dailyUse !== null) {
      await this.skillProvider.updateDailyUse(p.skill.name, p.character.name, p.skill.dailyUse - 1)
    }
    p.character.pv += pvDelta
    p.character.pf += pfDelta
    p.character.pp += ppDelta
    p.character.arcanes += arcaneDelta
    p.character.arcanePrimes += arcanePrimeDelta
    p.character.dettes += dettesDelta
    await this.characterProvider.update(p.character)
    const rolls = await this.getLast()
    this.rollsChangeSubject.next(rolls)
    return createdRoll
  }

  async deleteAll(): Promise<void> {
    await this.rollProvider.deleteAll()
    const rolls = await this.getLast()
    this.rollsChangeSubject.next(rolls)
  }

  async delete(id: string): Promise<void> {
    await this.rollProvider.delete(id)
    const rolls = await this.getLast()
    this.rollsChangeSubject.next(rolls)
  }

  private static randomIntFromInterval(min, max) {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  getRollsChangeObservable(): Observable<Roll[]> {
    return this.rollsChangeSubject.asObservable()
  }

  async rollApotheose(p: { apotheose: Apotheose; character: Character }): Promise<void> {
    if (p.apotheose.apotheoseEffect.length > 0) {
      const diceValue = p.apotheose.apotheoseEffect.length
      const dice = RollService.randomIntFromInterval(1, diceValue)
      const rollToCreate = await Roll.rollToCreateFactory({
        rollerName: p.character.name,
        data: '',
        date: new Date(),
        secret: true,
        displayDices: true,
        focus: false,
        power: false,
        proficiency: false,
        bonus: 0,
        malus: 0,
        result: [dice],
        success: null,
        juge12: null,
        juge34: null,
        resistRoll: null,
        picture: p.character.pictureApotheose,
        empiriqueRoll: '1d' + diceValue,
        display: p.apotheose.apotheoseEffect[dice - 1],
        stat: SkillStat.EMPIRIQUE
      })
      await this.rollProvider.add(rollToCreate)
      const rolls = await this.getLast()
      this.rollsChangeSubject.next(rolls)
    }
    p.character.apotheoseState = ApotheoseState.COST_TO_PAY
    await this.characterProvider.update(p.character)
  }
}
