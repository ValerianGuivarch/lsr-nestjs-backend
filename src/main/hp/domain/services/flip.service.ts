import { Difficulty } from '../entities/difficulty.enum'
import { Flip } from '../entities/flip.entity'
import { IFlipProvider } from '../providers/flip.provider'
import { Inject, Injectable } from '@nestjs/common'
import { Observable, Subject } from 'rxjs'

@Injectable()
export class FlipService {
  private flipsChangeSubject = new Subject<Flip[]>()

  constructor(@Inject('IFlipProvider') private flipProvider: IFlipProvider) {
    this.getFlipsChangeObservable().subscribe((flips) => {
      //console.log('Observable received:', flips.length)
    })
  }

  async createFlip(flip: {
    spellId?: string
    knowledgeId?: string
    statId?: string
    flipText: string
    flipModif: number
    wizardName: string
    wizardDisplayName: string
    difficulty: Difficulty
    seuil: number
  }): Promise<void> {
    const flipRolling = this.flipRolling(flip.flipModif)
    //console.log('flipRollingSuccess' + flipRolling.result + 'seuil' + flip.seuil + 'result' + (flipRolling.result >= flip.seuil)   )
    if (flip.difficulty === Difficulty.NORMAL) {
      await this.flipProvider.create(
        Flip.toFlipToCreate({
          text: flip.flipText,
          result: flipRolling.result,
          difficulty: flip.difficulty,
          baseBis: undefined,
          base: flipRolling.rolling,
          modif: flip.flipModif,
          wizardName: flip.wizardName,
          wizardDisplayName: flip.wizardDisplayName,
          success: flipRolling.result >= flip.seuil,
          statId: flip.statId,
          knowledgeId: flip.knowledgeId,
          spellId: flip.spellId
        })
      )
    } else {
      const flipRollingBis = this.flipRolling(flip.flipModif)
      const result =
        flip.difficulty === Difficulty.DESAVANTAGE
          ? Math.min(flipRolling.result, flipRollingBis.result)
          : Math.max(flipRolling.result, flipRollingBis.result)
      await this.flipProvider.create(
        Flip.toFlipToCreate({
          text: flip.flipText,
          result: result,
          difficulty: flip.difficulty,
          baseBis: flipRollingBis.rolling,
          base: flipRolling.rolling,
          modif: flip.flipModif,
          wizardName: flip.wizardName,
          wizardDisplayName: flip.wizardDisplayName,
          success: result >= flip.seuil,
          statId: flip.statId,
          knowledgeId: flip.knowledgeId,
          spellId: flip.spellId
        })
      )
    }
    const flips = await this.getAllFlips()
    this.flipsChangeSubject.next(flips)
    //console.log('Data pushed to flipsChangeSubject:', flips)
    //console.log('Subject observers count:', this.flipsChangeSubject.observers.length)
  }

  async getAllFlips(): Promise<Flip[]> {
    return await this.flipProvider.findAll()
  }

  getFlipsChangeObservable(): Observable<Flip[]> {
    //console.log('getFlipsChangeObservable called. Observers count:', this.flipsChangeSubject.observers.length)
    return this.flipsChangeSubject.asObservable()
    //      .pipe(tap((flips) => console.log('Observable emitting:', flips.length, flips)))
  }

  private flipRolling(flipModif: number): {
    rolling: number
    result: number
  } {
    // eslint-disable-next-line no-magic-numbers
    const rolling = Math.floor(Math.random() * 20 + 1)
    return {
      rolling,
      // eslint-disable-next-line no-magic-numbers
      result: rolling === 1 ? 1 : rolling === 20 ? 20 : rolling + flipModif
    }
  }

  async getFlipById(flipId: string): Promise<Flip> {
    return await this.flipProvider.findById(flipId)
  }

  async levelUpFlipDone(flip: Flip): Promise<void> {
    await this.flipProvider.update(flip.id, {
      ...flip,
      xpOk: true
    })
  }
}
