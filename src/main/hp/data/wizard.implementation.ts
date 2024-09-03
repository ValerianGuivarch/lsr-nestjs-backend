import { DBWizardKnowledge, DBWizardKnowledgeToCreate } from './wizard-knowledge.db'
import { DBWizardStat, DBWizardStatToCreate } from './wizard-stat.db'
import { DBWizard, DBWizardToCreate, DBWizardToUpdate } from './wizard.db'
import { ProviderErrors } from '../../data/errors/ProviderErrors'
import { WizardToCreate, Wizard, WizardName, WizardToUpdate } from '../domain/entities/wizard.entity'
import { IWizardProvider } from '../domain/providers/wizard.provider'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
export class WizardImplementation implements IWizardProvider {
  constructor(
    @InjectRepository(DBWizard, 'postgres')
    private readonly wizardRepository: Repository<DBWizard>,
    @InjectRepository(DBWizardStat, 'postgres')
    private readonly wizardStatRepository: Repository<DBWizardStat>,
    @InjectRepository(DBWizardKnowledge, 'postgres')
    private readonly wizardKnowledgeRepository: Repository<DBWizardKnowledge>
  ) {}

  async create(wizard: WizardToCreate): Promise<Wizard> {
    const toCreate: DBWizardToCreate = {
      name: wizard.name,
      category: wizard.category,
      xp: 0,
      createdDate: new Date(),
      updatedDate: new Date()
    }

    const createdWizard = this.wizardRepository.create(toCreate)
    const savedWizard = await this.wizardRepository.save(createdWizard)
    for (const stat of wizard.stats) {
      const statToCreate: DBWizardStatToCreate = {
        level: stat.level,
        wizardId: savedWizard.id,
        statId: stat.stat.id,
        xp: 0
      }
      const createdStatWizard = this.wizardStatRepository.create(statToCreate)
      await this.wizardStatRepository.save(createdStatWizard)
    }
    for (const knowledge of wizard.knowledges) {
      const knowledgeToCreate: DBWizardKnowledgeToCreate = {
        level: knowledge.level,
        wizardId: savedWizard.id,
        knowledgeId: knowledge.knowledge.id,
        xp: 0
      }
      const createdKnowledgeWizard = this.wizardKnowledgeRepository.create(knowledgeToCreate)
      createdKnowledgeWizard.wizard = savedWizard
      await this.wizardKnowledgeRepository.insert(createdKnowledgeWizard)
    }
    return this.findOneById(savedWizard.id)
  }

  async findOneById(id: string): Promise<Wizard> {
    const wizard = await this.wizardRepository.findOne({
      where: {
        id: id
      },
      relations: DBWizard.RELATIONS
    })
    if (!wizard) {
      throw ProviderErrors.EntityNotFound(DBWizard.name)
    }
    return DBWizard.toWizard(wizard)
  }

  async findOneByName(name: string): Promise<Wizard> {
    const wizard = await this.wizardRepository.findOne({
      where: {
        name: name
      },
      relations: DBWizard.RELATIONS
    })
    if (!wizard) {
      throw ProviderErrors.EntityNotFound(DBWizard.name)
    }
    return DBWizard.toWizard(wizard)
  }

  async findAllNames(): Promise<WizardName[]> {
    const wizards = this.wizardRepository.find()
    return wizards.then((wizards) => wizards.map((wizard) => ({ id: wizard.id, name: wizard.name })))
  }

  async update(p: { wizardId: string; wizard: Partial<WizardToUpdate> }): Promise<Wizard> {
    const toUpdate: Partial<DBWizardToUpdate> = {
      updatedDate: new Date(),
      category: p.wizard.category
    }
    await this.wizardRepository.update(
      {
        id: p.wizardId
      },
      toUpdate
    )
    return await this.findOneById(p.wizardId)
  }
}
