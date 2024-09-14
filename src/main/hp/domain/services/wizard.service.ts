import { Wizard, WizardName, WizardToCreate, WizardToUpdate } from '../entities/wizard.entity'
import { IWizardProvider } from '../providers/wizard.provider'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class WizardService {
  constructor(@Inject('IWizardProvider') private wizardProvider: IWizardProvider) {}

  async createWizard(wizardToCreate: WizardToCreate): Promise<Wizard> {
    return await this.wizardProvider.create(wizardToCreate)
  }

  async getWizardByName(name: string): Promise<Wizard> {
    return await this.wizardProvider.findOneByName(name)
  }

  async getAllWizardNames(): Promise<WizardName[]> {
    return await this.wizardProvider.findAllNames()
  }

  async updateWizard(p: { wizardName: string; wizard: WizardToUpdate }): Promise<Wizard> {
    return await this.wizardProvider.update({ wizardName: p.wizardName, wizard: p.wizard })
  }

  async levelUpStat(wizardName: string, statId: string): Promise<void> {
    return await this.wizardProvider.levelUpStat(wizardName, statId)
  }

  async levelUpKnowledge(wizardName: string, knowledgeId: string): Promise<void> {
    return await this.wizardProvider.levelUpKnowledge(wizardName, knowledgeId)
  }

  async levelUpSpell(wizardName: string, spellId: string): Promise<void> {
    return await this.wizardProvider.levelUpSpell(wizardName, spellId)
  }
}
