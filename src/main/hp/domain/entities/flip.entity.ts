import { Difficulty } from './difficulty.enum'

export class Flip {
  id: string
  wizardName: string
  wizardDisplayName: string
  xpOk: boolean
  spellId?: string
  knowledgeId?: string
  success: boolean
  statId?: string
  text: string
  result: number
  difficulty: Difficulty
  base: number
  baseBis: number
  modif: number

  constructor(flip: {
    id: string
    text: string
    wizardName: string
    wizardDisplayName: string
    success: boolean
    result: number
    base: number
    modif: number
    difficulty: Difficulty
    baseBis?: number
    xpOk: boolean
    spellId?: string
    knowledgeId?: string
    statId?: string
  }) {
    this.id = flip.id
    this.wizardName = flip.wizardName
    this.wizardDisplayName = flip.wizardDisplayName
    this.text = flip.text
    this.result = flip.result
    this.base = flip.base
    this.success = flip.success
    this.modif = flip.modif
    this.difficulty = flip.difficulty
    this.baseBis = flip.baseBis
    this.xpOk = flip.xpOk
    this.spellId = flip.spellId
    this.knowledgeId = flip.knowledgeId
    this.statId = flip.statId
  }

  static toFlipToCreate(p: {
    wizardName: string
    wizardDisplayName: string
    text: string
    result: number
    base: number
    modif: number
    success: boolean
    difficulty: Difficulty
    baseBis?: number
    spellId?: string
    knowledgeId?: string
    statId?: string
  }): FlipToCreate {
    return {
      wizardName: p.wizardName,
      wizardDisplayName: p.wizardDisplayName && p.wizardDisplayName !== 'null' ? p.wizardDisplayName : p.wizardName,
      text: p.text,
      result: p.result,
      success: p.success,
      base: p.base,
      modif: p.modif,
      difficulty: p.difficulty,
      baseBis: p.baseBis,
      xpOk: false,
      spellId: p.spellId,
      knowledgeId: p.knowledgeId,
      statId: p.statId
    }
  }
}

export type FlipToCreate = Omit<Flip, 'id'>
