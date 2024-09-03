import { DBWizardKnowledge, DBWizardKnowledgeToCreate, DBWizardKnowledgeToUpdate } from './wizard-knowledge.db'
import { ProviderErrors } from '../../data/errors/ProviderErrors'
import {
  WizardKnowledge,
  WizardKnowledgeToCreate,
  WizardKnowledgeToUpdate
} from '../domain/entities/wizard-knowledge.entity'
import { IWizardKnowledgeProvider } from '../domain/providers/wizard-knowledge.provider'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
export class WizardKnowledgeImplementation implements IWizardKnowledgeProvider {
  private readonly logger = new Logger(DBWizardKnowledge.name)
  constructor(
    @InjectRepository(DBWizardKnowledge, 'postgres')
    private readonly wizardKnowledgeRepository: Repository<DBWizardKnowledge>
  ) {
    this.logger.log('Initialised')
  }

  async create(wizardId: string, wizardKnowledge: WizardKnowledgeToCreate): Promise<WizardKnowledge> {
    const toCreate: DBWizardKnowledgeToCreate = {
      knowledgeId: wizardKnowledge.knowledge.id,
      wizardId: wizardId,
      level: wizardKnowledge.level,
      xp: 0
    }
    const created = this.wizardKnowledgeRepository.create(toCreate)
    await this.wizardKnowledgeRepository.insert(created)
    return this.findOneByWizardIdAndKnowledgeId({
      wizardId: created.wizardId,
      knowledgeId: created.knowledgeId
    })
  }

  private async findOneByWizardIdAndKnowledgeId(p: {
    wizardId: string
    knowledgeId: string
  }): Promise<WizardKnowledge> {
    const dbWizardKnowledge = await this.wizardKnowledgeRepository.findOne({
      where: {
        wizardId: p.wizardId,
        knowledgeId: p.knowledgeId
      },
      relations: DBWizardKnowledge.RELATIONS
    })
    if (!dbWizardKnowledge) {
      throw ProviderErrors.EntityNotFound(WizardKnowledgeImplementation.name)
    }
    return DBWizardKnowledge.toWizardKnowledge(dbWizardKnowledge)
  }

  async update(p: {
    wizardId: string
    knowledgeId: string
    wizardKnowledge: WizardKnowledgeToUpdate
  }): Promise<WizardKnowledge> {
    const toUpdate: DBWizardKnowledgeToUpdate = {
      level: p.wizardKnowledge.level,
      updatedDate: new Date()
    }
    await this.wizardKnowledgeRepository.update(
      {
        wizardId: p.wizardId,
        knowledgeId: p.knowledgeId
      },
      toUpdate
    )
    return this.findOneByWizardIdAndKnowledgeId({
      wizardId: p.wizardId,
      knowledgeId: p.knowledgeId
    })
  }
}
