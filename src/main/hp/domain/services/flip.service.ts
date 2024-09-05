import { Difficulty } from '../entities/difficulty.enum'
import { Flip } from '../entities/flip.entity'
import { IFlipProvider } from '../providers/flip.provider'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class FlipService {
  constructor(@Inject('IFlipProvider') private flipProvider: IFlipProvider) {}

  async createFlip(flip: {
    flipText: string
    flipModif: number
    wizardName: string
    difficulty: Difficulty
  }): Promise<Flip> {
    const flipRolling = this.flipRolling(flip.flipModif)
    if (flip.difficulty === Difficulty.NORMAL) {
      return await this.flipProvider.create(
        Flip.toFlipToCreate({
          text: flip.flipText,
          result: flipRolling.result,
          difficulty: flip.difficulty,
          resultBis: undefined,
          base: flipRolling.rolling,
          modif: flip.flipModif,
          wizardName: flip.wizardName
        })
      )
    } else {
      const flipRollingBis = this.flipRolling(flip.flipModif)
      return await this.flipProvider.create(
        Flip.toFlipToCreate({
          text: flip.flipText,
          result: flipRolling.result,
          difficulty: flip.difficulty,
          resultBis: flipRollingBis.result,
          base: flipRolling.rolling,
          modif: flip.flipModif,
          wizardName: flip.wizardName
        })
      )
    }
  }

  async getAllFlips(): Promise<Flip[]> {
    return await this.flipProvider.findAll()
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
