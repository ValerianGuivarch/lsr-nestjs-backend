import { FlipService } from './flip.service'
import { WizardService } from './wizard.service'
import { Difficulty } from '../entities/difficulty.enum'
import { Flip } from '../entities/flip.entity'
import { BadRequestException, Inject, Injectable } from '@nestjs/common'

@Injectable()
export class FlipWorkflowService {
  constructor(
    @Inject('FlipService') private flipService: FlipService,
    @Inject('WizardService') private wizardService: WizardService
  ) {}

  async createFlip(flip: {
    knowledgeId?: string
    statId?: string
    spellId?: string
    wizardId: string
    difficulty?: Difficulty
  }): Promise<Flip> {
    const wizard = await this.wizardService.getWizardById(flip.wizardId)
    if (flip.knowledgeId) {
      const wizardKnowledge = wizard.knowledges.find(
        (wizardKnowledge) => wizardKnowledge.knowledge.id === flip.knowledgeId
      )
      if (!wizardKnowledge) {
        throw new BadRequestException(wizard.name + ' does not have knowledge with id ' + flip.knowledgeId)
      }
      return this.flipService.createFlip({
        wizardName: wizard.name,
        flipModif: wizardKnowledge.level,
        flipText:
          wizard.name +
          ' ' +
          wizardKnowledge.knowledge.flipText +
          wizardKnowledge.knowledge.name +
          ' [ ' +
          wizardKnowledge.level +
          ' ] et obtient : ',
        difficulty: flip.difficulty ?? Difficulty.NORMAL
      })
    } else if (flip.statId) {
      const wizardStat = wizard.stats.find((wizardStat) => wizardStat.stat.id === flip.statId)
      if (!wizardStat) {
        throw new BadRequestException(wizard.name + ' does not have stat with id ' + flip.statId)
      }
      return this.flipService.createFlip({
        wizardName: wizard.name,
        flipModif: wizardStat.level,
        flipText: wizard.name + ' ' + wizardStat.stat.flipText + ' [ ' + wizardStat.level + ' ] et obtient : ',
        difficulty: flip.difficulty ?? Difficulty.NORMAL
      })
    } else if (flip.spellId) {
      const wizardSpell = wizard.spells.find((wizardSpell) => wizardSpell.spell.id === flip.spellId)
      if (!wizardSpell) {
        throw new BadRequestException(wizard.name + ' does not have spell with id ' + flip.spellId)
      }
      return this.flipService.createFlip({
        wizardName: wizard.name,
        flipModif:
          wizardSpell.spell.rank +
          (wizard.stats.find((stat) => stat.stat.id === wizardSpell.spell.stat.id)?.level ?? 0),
        flipText:
          wizard.name +
          ' lance le sort ' +
          wizardSpell.spell.name +
          ' [ ' +
          wizardSpell.spell.rank +
          ' ] et obtient : ',
        difficulty: this.adjustDifficulty(wizardSpell.difficulty, flip.difficulty)
      })
    } else {
      throw new BadRequestException('Invalid flip')
    }
  }

  private adjustDifficulty(difficulty: Difficulty, difficultyAdjustment: Difficulty) {
    if (difficulty === difficultyAdjustment) {
      return difficulty
    } else if (difficulty === Difficulty.NORMAL || difficultyAdjustment === Difficulty.NORMAL) {
      return difficultyAdjustment
    } else {
      return Difficulty.NORMAL
    }
  }
}
