import { FlipService } from './flip.service'
import { WizardService } from './wizard.service'
import { Flip } from '../entities/flip.entity'
import { BadRequestException, Inject, Injectable } from '@nestjs/common'

@Injectable()
export class FlipWorkflowService {
  constructor(
    @Inject('FlipService') private flipService: FlipService,
    @Inject('WizardService') private wizardService: WizardService
  ) {}

  async createFlip(flip: { knowledgeId?: string; statId?: string; wizardId: string }): Promise<Flip> {
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
          ' ] et obtient : '
      })
    } else if (flip.statId) {
      const wizardStat = wizard.stats.find((wizardStat) => wizardStat.stat.id === flip.statId)
      if (!wizardStat) {
        throw new BadRequestException(wizard.name + ' does not have stat with id ' + flip.statId)
      }
      return this.flipService.createFlip({
        wizardName: wizard.name,
        flipModif: wizardStat.level,
        flipText:
          wizard.name +
          ' ' +
          wizardStat.stat.flipText +
          wizardStat.stat.name +
          ' [ ' +
          wizardStat.level +
          ' ] et obtient : '
      })
    } else {
      throw new BadRequestException('Invalid flip')
    }
  }
}
