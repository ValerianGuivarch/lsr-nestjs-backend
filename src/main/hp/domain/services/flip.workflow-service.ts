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
    knowledgeName?: string
    statName?: string
    spellName?: string
    wizardName: string
    difficulty?: Difficulty
  }): Promise<Flip> {
    const wizard = await this.wizardService.getWizardByName(flip.wizardName)
    if (flip.knowledgeName) {
      const wizardKnowledge = wizard.knowledges.find(
        (wizardKnowledge) => wizardKnowledge.knowledge.name === flip.knowledgeName
      )
      if (!wizardKnowledge) {
        throw new BadRequestException(wizard.name + ' does not have knowledge with name ' + flip.knowledgeName)
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
    } else if (flip.statName) {
      const wizardStat = wizard.stats.find((wizardStat) => wizardStat.stat.name === flip.statName)
      if (!wizardStat) {
        throw new BadRequestException(wizard.name + ' does not have stat with name ' + flip.statName)
      }
      return this.flipService.createFlip({
        wizardName: wizard.name,
        flipModif: wizardStat.level,
        flipText: wizard.name + ' ' + wizardStat.stat.flipText + ' [ ' + wizardStat.level + ' ] et obtient : ',
        difficulty: flip.difficulty ?? Difficulty.NORMAL
      })
    } else if (flip.spellName) {
      const wizardSpell = wizard.spells.find((wizardSpell) => wizardSpell.spell.name === flip.spellName)
      if (!wizardSpell) {
        throw new BadRequestException(wizard.name + ' does not have spell with name ' + flip.spellName)
      }
      return this.flipService.createFlip({
        wizardName: wizard.name,
        flipModif:
          wizardSpell.spell.rank +
          (wizard.stats.find((stat) => stat.stat.name === wizardSpell.spell.stat.name)?.level ?? 0),
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
