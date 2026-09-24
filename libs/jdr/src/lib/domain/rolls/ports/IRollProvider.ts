import { DiceRoll } from '../DiceRoll'

export interface IRollProvider {
  rollDice(
    jdrSlug: string,
    characterSlug: string,
    statSlug: string,
    rollState?: DiceRoll['rollState'],
    text?: string | null
  ): Promise<DiceRoll>
  rollArbitrary(jdrSlug: string, characterSlug: string, formula: string): Promise<DiceRoll>
  getLastRolls(jdrSlug: string, size: number): Promise<DiceRoll[]>
  deleteRoll(jdrSlug: string, rollId: string): Promise<void>
}
