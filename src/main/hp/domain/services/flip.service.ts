import { Flip } from '../entities/flip.entity'
import { IFlipProvider } from '../providers/flip.provider'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class FlipService {
  constructor(@Inject('IFlipProvider') private flipProvider: IFlipProvider) {}

  async createFlip(flip: { flipModif: string; wizardName: string }): Promise<Flip> {
    return await this.flipProvider.create(
      Flip.toFlipToCreate({
        text: this.flipRolling(flip.flipModif),
        wizardName: flip.wizardName
      })
    )
  }

  async getAllFlips(): Promise<Flip[]> {
    return await this.flipProvider.findAll()
  }

  private flipRolling(flipModif: string): string {
    return Math.floor(Math.random() * 20 + 1) + flipModif
  }
}
