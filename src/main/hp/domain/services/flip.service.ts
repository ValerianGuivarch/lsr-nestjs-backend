import { Flip } from '../entities/flip.entity'
import { IFlipProvider } from '../providers/flip.provider'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class FlipService {
  constructor(@Inject('IFlipProvider') private flipProvider: IFlipProvider) {}

  async createFlip(flip: { flipText: string; flipModif: number; wizardName: string }): Promise<Flip> {
    const flipRolling = this.flipRolling()
    return await this.flipProvider.create(
      Flip.toFlipToCreate({
        text: flip.flipText,
        // eslint-disable-next-line no-magic-numbers
        result: flipRolling === 1 ? 1 : flipRolling === 20 ? 20 : flipRolling + flip.flipModif,
        base: flipRolling,
        modif: flip.flipModif,
        wizardName: flip.wizardName
      })
    )
  }

  async getAllFlips(): Promise<Flip[]> {
    return await this.flipProvider.findAll()
  }

  private flipRolling(): number {
    // eslint-disable-next-line no-magic-numbers
    return Math.floor(Math.random() * 20 + 1)
  }
}
