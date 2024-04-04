/* eslint-disable no-magic-numbers */
import { InvocationService } from './InvocationService'
import { SkillService } from './SkillService'
import { ProviderErrors } from '../../data/errors/ProviderErrors'
import { Apotheose } from '../models/apotheoses/Apotheose'
import { ApotheoseState } from '../models/apotheoses/ApotheoseState'
import { BattleState } from '../models/characters/BattleState'
import { Character } from '../models/characters/Character'
import { Roll } from '../models/roll/Roll'
import { SuccessCalculation } from '../models/roll/SuccessCalculation'
import { NatureLevel } from '../models/session/NatureLevel'
import { SkillStat } from '../models/skills/SkillStat'
import { IApotheoseProvider } from '../providers/IApotheoseProvider'
import { IBloodlineProvider } from '../providers/IBloodlineProvider'
import { ICharacterProvider } from '../providers/ICharacterProvider'
import { IPokeProvider } from '../providers/IPokeProvider'
import { IRollProvider } from '../providers/IRollProvider'
import { ISessionProvider } from '../providers/ISessionProvider'
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
    private skillService: SkillService,
    private invocationService: InvocationService,
    @Inject('IBloodlineProvider')
    private bloodlineProvider: IBloodlineProvider,
    @Inject('IApotheoseProvider')
    private apotheoseProvider: IApotheoseProvider,
    @Inject('ISessionProvider')
    private sessionProvider: ISessionProvider,
    @Inject('IRollProvider')
    private rollProvider: IRollProvider,
    @Inject('IPokeProvider')
    private pokeProvider: IPokeProvider
  ) {
    console.log('RollService')
  }
  async getLast(): Promise<Roll[]> {
    return this.rollProvider.getLast(RollService.MAX_ROLL_LIST_SIZE)
  }
  async getLastExceptSecret(name: string): Promise<Roll[]> {
    return (await this.rollProvider.getLast(RollService.MAX_ROLL_LIST_SIZE)).filter((roll) => {
      return !roll.secret || roll.rollerName === name || name === 'MJ'
    })
  }

  async roll(p: {
    character: Character
    skillId: string
    secret: boolean
    focus: boolean
    power: boolean
    bonus: number
    malus: number
    proficiency: boolean
    empiriqueRoll?: string
    resistRoll?: string
    affect: boolean
  }): Promise<void> {
    const skill = await this.skillService.findSkillById(p.skillId)
    const apotheose = p.character.currentApotheose
    const controller = await this.characterProvider.findOneByName(p.character.controlledBy)

    if (p.character.name === 'esther' && skill.arcaneCost > 0) {
      skill.arcaneCost = 0
      if (
        skill.name === 'corbeau' ||
        skill.name === 'luciole' ||
        skill.name === 'empoisonneur' ||
        skill.name === 'chauvesouris' ||
        skill.name === 'rat' ||
        skill.name === 'chaperon' ||
        skill.name === 'araignée'
      ) {
        skill.pfCost = 1
        skill.ppCost = 0
      } else {
        skill.pfCost = 0
        skill.ppCost = 1
      }
    }
    if (p.character.name === skill.owner) {
      skill.arcanePrimeCost = 0
    }

    if (p.character.classe.name === 'avatar' && skill.arcaneCost > 0) {
      skill.arcaneCost = 0
    }
    if (
      (p.character.classe.name === 'soldat' ||
        p.character.classe.name === 'arcaniste' ||
        p.character.classe.name === 'sorcière') &&
      skill.arcaneCost > 0
    ) {
      skill.arcaneCost = 0
      skill.ppCost = 1
    }

    let diceNumber = 0
    let diceValue = 0
    let pvDelta = 0
    let pfDelta = 0
    let ppDelta = 0
    let arcaneDelta = 0
    let etherDelta = 0
    let arcanePrimeDelta = 0
    let dettesDelta = 0
    let dragonDettesDelta = 0
    let usePf = p.focus && skill.allowsPf
    let usePp = p.power && skill.allowsPp
    let useProficiency = p.proficiency
    let pictureUrl: string | undefined = undefined
    const result: number[] = []
    let data = ''
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
      if (p.character.hurtMalus && p.character.classe.name !== 'troglodyte' && skill.stat === SkillStat.CHAIR) {
        const diff = p.character.pvMax - p.character.pv
        p.malus = p.malus + Math.floor(diff / 6)
      }
      let diceValueDelta = p.bonus - p.malus
      if (usePf) {
        diceValueDelta++
        pfDelta--
      }
      if (usePp) {
        ppDelta--
      }

      if (apotheose) {
        if (!skill.isArcanique || (skill.isArcanique && apotheose.arcaneImprovement)) {
          if (skill.stat === SkillStat.CHAIR) {
            diceValueDelta += apotheose.chairImprovement
          } else if (skill.stat === SkillStat.ESPRIT) {
            diceValueDelta += apotheose.espritImprovement
          } else if (skill.stat === SkillStat.ESSENCE) {
            diceValueDelta += apotheose.essenceImprovement
          }
        }
      }

      diceValue = RollService.CLASSIC_ROLL_VALUE
      if (skill.stat === SkillStat.CHAIR) {
        diceNumber = p.character.chair + diceValueDelta + p.character.chairBonus
      } else if (skill.stat === SkillStat.ESPRIT) {
        diceNumber = p.character.esprit + diceValueDelta + p.character.espritBonus
      } else if (skill.stat === SkillStat.ESSENCE) {
        diceNumber = p.character.essence + diceValueDelta + p.character.essenceBonus
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
    const fake = (await this.sessionProvider.getSession()).fake
    if (fake !== 0 && diceNumber === 1 && diceValue === 103) {
      result.push(fake)
      skill.precision += '\n' + (await this.skillService.findSkillByArcaneId(fake)).name
    } else if (fake !== 0 && diceValue === 10) {
      result.push(fake)
    } else {
      for (let i = 0; i < diceNumber; i++) {
        const dice = RollService.randomIntFromInterval(1, diceValue)
        if (skill.successCalculation !== SuccessCalculation.AUCUN) {
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
        if (diceValue === 103 || diceValue === 104) {
          skill.precision += '\n' + (await this.skillService.findSkillByArcaneId(dice)).name
        }
      }
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

    if (skill.successCalculation === SuccessCalculation.DOUBLE) {
      // eslint-disable-next-line no-magic-numbers
      success = Math.ceil(success * 2)
      // eslint-disable-next-line no-magic-numbers
      juge12 = Math.ceil(juge12 * 2)
      // eslint-disable-next-line no-magic-numbers
      juge34 = Math.ceil(juge34 * 2)
    }

    if (skill.successCalculation === SuccessCalculation.DOUBLE_PLUS_1) {
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

    pvDelta = pvDelta - skill.pvCost
    pfDelta = pfDelta - skill.pfCost
    ppDelta = ppDelta - skill.ppCost
    arcaneDelta = arcaneDelta - skill.arcaneCost
    etherDelta = etherDelta - skill.etherCost
    dettesDelta = dettesDelta + skill.dettesCost
    dragonDettesDelta = dragonDettesDelta + skill.dragonDettesCost
    arcanePrimeDelta = arcanePrimeDelta - skill.arcanePrimeCost
    if (p.character.pv + pvDelta < 0) {
      throw ProviderErrors.RollNotEnoughPv()
    } else if (p.character.pf + pfDelta < 0) {
      throw ProviderErrors.RollNotEnoughPf()
    } else if (p.character.pp + ppDelta < 0) {
      throw ProviderErrors.RollNotEnoughPp()
    } else if (p.character.arcanes + arcaneDelta < 0) {
      throw ProviderErrors.RollNotEnoughArcane()
    } else if (p.character.ether + etherDelta < 0) {
      throw ProviderErrors.RollNotEnoughEther()
    } else if (p.character.arcanePrimes + arcanePrimeDelta < 0) {
      throw ProviderErrors.RollNotEnoughArcanePrime()
    } else if (p.character.dailyUse.get(skill.name) === 0) {
      throw ProviderErrors.RollNotEnoughDailyUse()
    }
    console.log(skill.name)
    if (skill.successCalculation === SuccessCalculation.CUSTOM) {
      console.log('custom')
      if (skill.name === 'KO') {
        // eslint-disable-next-line no-magic-numbers
        if (result[0] == 1) {
          data += ' et échoue dangereusement'
          // eslint-disable-next-line no-magic-numbers
        } else if (result[0] == 20) {
          data += ' et se relève'
          // eslint-disable-next-line no-magic-numbers
        } else if (result[0] < 10) {
          data += ' et échoue'
        } else {
          data += ' et réussi'
        }
      } else if (skill.name === 'Sacrifice Spectral') {
        const listSorciere = [
          'Eleanor Corvin',
          'Lilith Lumina',
          'Clarissa Venenum',
          'Isabella Nocturna',
          'Seraphina Rattus',
          'Aradia Knéa',
          'Celestine Chapya'
        ]
        const result = new Map(
          [...p.character.dailyUse.entries()].filter(([key, value]) => listSorciere.includes(key) && value === 1)
        )
        const keysArray = [...result.keys()]
        const randomKey = keysArray[Math.floor(Math.random() * keysArray.length)]
        p.character.dailyUse.set(randomKey, 0)
        data += ' et sacrifie ' + randomKey
        if (keysArray.length === 0) {
          throw ProviderErrors.RollNotEnoughDailyUse()
        }
      } else if (skill.name === 'Coeur Artificiel') {
        console.log('coeur')
        data += ' et subit les dettes de '

        const rois = [
          'Nautilus',
          'Ifrit',
          'Alastor',
          'Béhémot',
          'Méphisto',
          'Bélial',
          'Gabriel',
          'Gabriel',
          'Lucifer',
          'Jack'
        ]
        const randomRois = rois[Math.floor(Math.random() * rois.length)]
        data += randomRois
        dettesDelta = -5
      } else if (skill.name === 'Reco. naturelle') {
        const natureLevel = await this.characterProvider.getNatureLevel()
        switch (natureLevel) {
          case NatureLevel.LEVEL_0_PAUVRE:
            data += ' et perçoit un niveau de nature pauvre (0)'
            break
          case NatureLevel.LEVEL_1_RARE:
            data += ' et perçoit un niveau de nature rare (1)'
            break
          case NatureLevel.LEVEL_2_PRESENTE:
            data += ' et perçoit un niveau de nature présente (2)'
            break
          case NatureLevel.LEVEL_3_ABONDANTE:
            data += ' et perçoit un niveau de nature abondante (3)'
            break
          case NatureLevel.LEVEL_4_SAUVAGE:
            data += ' et perçoit un niveau de nature sauvage (4)'
            break
          case NatureLevel.LEVEL_5_DOMINANTE:
            data += ' et perçoit un niveau de nature dominante (5)'
            break
          default:
            data += ' et perçoit un niveau de nature inconnu.'
            break
        }
      } else if (skill.name === 'Pokéball') {
        data += ' et fait apparaître'

        const pokemon = await this.pokeProvider.getPokemonById(result[0])
        // eslint-disable-next-line no-magic-numbers
        if (result[0] >= 1 && result[0] <= 150) {
          console.log('result[0] : ' + result[0])
          data += ' *' + pokemon.nameFr + '*'
          console.log('data : ' + data)
        } else {
          data += ' un pokémon inconnu'
        }
        pictureUrl = pokemon.imageUrl
        await this.characterProvider.create(
          Character.invocationToCreateFactory({
            name: pokemon.nameFr,
            chair: 2,
            esprit: 2,
            essence: 2,
            pvMax: 4,
            picture: pokemon.imageUrl,
            summoner: p.character
          }),
          'champion'
        )
      } else if (skill.name === 'Poignard Temporel') {
        if (result[0] === 1) {
          data += ' et subit une transformation négative'
        } else if (result[0] === 2) {
          data += ' et se transforme en Akira'
          pictureUrl =
            'https://media.discordapp.net/attachments/689034158307409933/1067527301039919204/Sun_Wukong_Akira.png'
        } else if (result[0] === 3) {
          data += ' et se transforme en Cortès'
          pictureUrl = 'https://media.discordapp.net/attachments/689034158307409933/1067551979506770011/image.png'
        } else if (result[0] === 4) {
          data += ' et se transforme en Diablo'
          pictureUrl =
            'https://media.discordapp.net/attachments/689034158307409933/1067577204889890846/Diablo_adulte.png'
        } else if (result[0] === 5) {
          data += ' et se transforme en John'
          pictureUrl = 'https://media.discordapp.net/attachments/689034158307409933/1080962345196605581/image.png'
        } else if (result[0] === 6) {
          data += ' et se transforme en Maia'
          pictureUrl = 'https://media.discordapp.net/attachments/689034158307409933/1067535787870126120/image.png'
        } else if (result[0] === 7) {
          data += ' et se transforme en Polem'
          pictureUrl = 'https://media.discordapp.net/attachments/689034158307409933/1067558006520283216/image.png'
        } else if (result[0] === 8) {
          data += ' et se transforme en Rafael'
          pictureUrl = 'https://media.discordapp.net/attachments/689034158307409933/1067546049306177687/image.png'
        } else if (result[0] === 9) {
          data += ' et se transforme en Touami'
          pictureUrl = 'https://media.discordapp.net/attachments/689034158307409933/1095447733239828590/image.png'
        } else {
          data += ' et choisit sa transformation'
        }
      }
    }

    let display = skill.display
    if (skill.stat === SkillStat.EMPIRIQUE) {
      display = display + ' (' + p.empiriqueRoll + ')'
    }

    const rollToCreate = await Roll.rollToCreateFactory({
      rollerName: p.character.name,
      healPoint: skill.isHeal ? success : undefined,
      data: data,
      date: new Date(),
      secret: skill.secret || p.secret,
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
      display: display,
      stat: skill.stat,
      resistance: skill.resistance,
      blessure: skill.blessure,
      help: skill.help,
      precision: skill.precision,
      pictureUrl: pictureUrl
    })
    const createdRoll = await this.rollProvider.add(rollToCreate)
    p.character.pv += pvDelta
    p.character.pf += pfDelta
    p.character.pp += ppDelta
    p.character.arcanes += arcaneDelta
    p.character.ether += etherDelta
    p.character.arcanePrimes += arcanePrimeDelta
    p.character.dettes += dettesDelta
    p.character.dragonDettes += dragonDettesDelta
    if (p.character.dailyUse.get(skill.name) !== undefined) {
      p.character.dailyUse.set(skill.name, p.character.dailyUse.get(skill.name) - 1)
    }
    if (p.affect) await this.characterProvider.update(p.character)
    const rolls = await this.getLast()
    this.rollsChangeSubject.next(rolls)
    if (skill.invocationTemplateName) {
      await this.invocationService.createInvocation(skill.invocationTemplateName, createdRoll)
    }
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
        healPoint: undefined,
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
        stat: SkillStat.EMPIRIQUE,
        resistance: false,
        blessure: false,
        help: false
      })
      await this.rollProvider.add(rollToCreate)
      const rolls = await this.getLast()
      this.rollsChangeSubject.next(rolls)
    }
    p.character.apotheoseState = ApotheoseState.COST_TO_PAY
    await this.characterProvider.update(p.character)
  }

  async updateRoll(roll: Roll): Promise<Roll> {
    const rollUpdated = this.rollProvider.update(roll)
    const rolls = await this.getLast()
    this.rollsChangeSubject.next(rolls)
    return rollUpdated
  }

  async findOneById(id: string): Promise<Roll> {
    return this.rollProvider.findOneById(id)
  }
}
