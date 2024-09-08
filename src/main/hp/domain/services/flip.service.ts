import { Difficulty } from '../entities/difficulty.enum'
import { Flip } from '../entities/flip.entity'
import { IFlipProvider } from '../providers/flip.provider'
import { Inject, Injectable } from '@nestjs/common'
import { Observable, Subject } from 'rxjs'

@Injectable()
export class FlipService {
  private flipsChangeSubject = new Subject<Flip[]>()

  constructor(@Inject('IFlipProvider') private flipProvider: IFlipProvider) {}

  async createFlip(flip: {
    flipText: string
    flipModif: number
    wizardName: string
    difficulty: Difficulty
    seuil: number
  }): Promise<void> {
    const flipRolling = this.flipRolling(flip.flipModif)
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
          success: flipRolling.result >= flip.seuil
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
          success: result >= flip.seuil
        })
      )
    }
    const flips = await this.getAllFlips()
    console.log('flipsChangeSubject.next' + flips)
    this.flipsChangeSubject.next(flips)
    console.log('flipsChangeSubject.next')
  }

  async getAllFlips(): Promise<Flip[]> {
    return await this.flipProvider.findAll()
  }

  getFlipsChangeObservable(): Observable<Flip[]> {
    console.log('getFlipsChangeObservable')
    return this.flipsChangeSubject.asObservable()
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
}
