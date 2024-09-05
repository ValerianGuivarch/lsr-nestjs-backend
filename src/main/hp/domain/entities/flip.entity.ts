import { Difficulty } from './difficulty.enum'

export class Flip {
  id: string
  wizardName: string
  text: string
  result: number
  difficulty: Difficulty
  resultBis?: number
  base: number
  modif: number

  constructor(flip: {
    id: string
    text: string
    wizardName: string
    result: number
    base: number
    modif: number
    difficulty: Difficulty
    resultBis?: number
  }) {
    this.id = flip.id
    this.wizardName = flip.wizardName
    this.text = flip.text
    this.result = flip.result
    this.base = flip.base
    this.modif = flip.modif
    this.difficulty = flip.difficulty
    this.resultBis = flip.resultBis
  }

  static toFlipToCreate(p: {
    wizardName: string
    text: string
    result: number
    base: number
    modif: number
    difficulty: Difficulty
    resultBis?: number
  }): FlipToCreate {
    return {
      wizardName: p.wizardName,
      text: p.text,
      result: p.result,
      base: p.base,
      modif: p.modif,
      difficulty: p.difficulty,
      resultBis: p.resultBis
    }
  }
}

export type FlipToCreate = Omit<Flip, 'id'>
