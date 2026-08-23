import { Inject, Injectable } from '@nestjs/common'
import { DiceRoll } from './DiceRoll'
import { IRollProvider } from './ports/IRollProvider'

@Injectable()
export class RollService {
  constructor(@Inject('IRollProvider') private readonly rollProvider: IRollProvider) {}

  rollDice(
    jdrSlug: string,
    characterSlug: string,
    statSlug: string,
    rollState?: DiceRoll['rollState'],
    text?: string | null
  ): Promise<DiceRoll> {
    return this.rollProvider.rollDice(jdrSlug, characterSlug, statSlug, rollState, text)
  }

  rollArbitrary(jdrSlug: string, characterSlug: string, formula: string): Promise<DiceRoll> {
    return this.rollProvider.rollArbitrary(jdrSlug, characterSlug, formula)
  }

  getLastRolls(jdrSlug: string, size: number): Promise<DiceRoll[]> {
    return this.rollProvider.getLastRolls(jdrSlug, size)
  }

  deleteRoll(jdrSlug: string, rollId: string): Promise<void> {
    return this.rollProvider.deleteRoll(jdrSlug, rollId)
  }
}
