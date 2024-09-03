import { WizardKnowledge } from '../entities/wizard-knowledge.entity'
import { WizardStat } from '../entities/wizard-stat.entity'
import { Wizard, WizardName, WizardToCreate, WizardToUpdate } from '../entities/wizard.entity'
import { IWizardKnowledgeProvider } from '../providers/wizard-knowledge.provider'
import { IWizardStatProvider } from '../providers/wizard-stat.provider'
import { IWizardProvider } from '../providers/wizard.provider'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class WizardService {
  constructor(
    @Inject('IWizardProvider') private wizardProvider: IWizardProvider,
    @Inject('IWizardStatProvider') private wizardStatProvider: IWizardStatProvider,
    @Inject('IWizardKnowledgeProvider') private wizardKnowledgeProvider: IWizardKnowledgeProvider
  ) {}

  async createWizard(wizardToCreate: WizardToCreate): Promise<Wizard> {
    return await this.wizardProvider.create(wizardToCreate)
  }

  async getWizardById(id: string): Promise<Wizard> {
    return await this.wizardProvider.findOneById(id)
  }

  async getWizardByName(name: string): Promise<Wizard> {
    return await this.wizardProvider.findOneByName(name)
  }

  async getAllWizardNames(): Promise<WizardName[]> {
    return await this.wizardProvider.findAllNames()
  }

  async updateWizard(p: { wizardId: string; wizard: Partial<WizardToUpdate> }): Promise<Wizard> {
    return await this.wizardProvider.update({ wizardId: p.wizardId, wizard: p.wizard })
  }

  async createWizardStat(p: { level: number; wizardId: string; statId: string }): Promise<WizardStat> {
    const wizardStatToCreate = {
      level: p.level,
      stat: {
        id: p.statId
      }
    }
    return await this.wizardStatProvider.create(p.wizardId, wizardStatToCreate)
  }

  async updateWizardStat(p: { level: number; wizardId: string; statId: string }): Promise<WizardStat> {
    return await this.wizardStatProvider.update({
      wizardId: p.wizardId,
      statId: p.statId,
      wizardStat: {
        level: p.level
      }
    })
  }

  async createWizardKnowledge(p: { level: number; wizardId: string; knowledgeId: string }): Promise<WizardKnowledge> {
    const wizardKnowledgeToCreate = {
      level: p.level,
      knowledge: {
        id: p.knowledgeId
      }
    }
    return await this.wizardKnowledgeProvider.create(p.wizardId, wizardKnowledgeToCreate)
  }

  async updateWizardKnowledge(p: { wizardId: string; knowledgeId: string }): Promise<WizardKnowledge> {
    return await this.wizardKnowledgeProvider.update({
      wizardId: p.wizardId,
      knowledgeId: p.knowledgeId,
      wizardKnowledge: {
        level: 2
      }
    })
  }
}
