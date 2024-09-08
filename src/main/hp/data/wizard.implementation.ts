import { DBWizardKnowledge, DBWizardKnowledgeToCreate } from './wizard-knowledge.db'
import { DBWizardSpell, DBWizardSpellToCreate } from './wizard-spell.db'
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
    private readonly wizardKnowledgeRepository: Repository<DBWizardKnowledge>,
    @InjectRepository(DBWizardSpell, 'postgres')
    private readonly wizardSpellRepository: Repository<DBWizardSpell>
  ) {}

  async create(wizard: WizardToCreate): Promise<Wizard> {
    const toCreate: DBWizardToCreate = {
      name: wizard.name,
      familyName: wizard.familyName,
      category: wizard.category,
      xp: 0,
      houseName: wizard.houseName,
      baguette: '',
      coupDePouce: '',
      crochePatte: '',
      text: '',
      createdDate: new Date(),
      updatedDate: new Date()
    }

    const createdWizard = this.wizardRepository.create(toCreate)
    const savedWizard = await this.wizardRepository.save(createdWizard)
    for (const stat of wizard.stats) {
      const statToCreate: DBWizardStatToCreate = {
        level: stat.level,
        wizardName: savedWizard.name,
        statName: stat.stat.name,
        xp: 0
      }
      const createdStatWizard = this.wizardStatRepository.create(statToCreate)
      await this.wizardStatRepository.save(createdStatWizard)
    }
    for (const knowledge of wizard.knowledges) {
      const knowledgeToCreate: DBWizardKnowledgeToCreate = {
        level: knowledge.level,
        wizardName: savedWizard.name,
        knowledgeName: knowledge.knowledge.name,
        xp: 0
      }
      const createdKnowledgeWizard = this.wizardKnowledgeRepository.create(knowledgeToCreate)
      await this.wizardKnowledgeRepository.save(createdKnowledgeWizard)
    }
    for (const spell of wizard.spells) {
      const spellToCreate: DBWizardSpellToCreate = {
        difficulty: spell.difficulty,
        wizardName: savedWizard.name,
        spellName: spell.spell.name,
        xp: 0
      }
      const createdSpellWizard = this.wizardSpellRepository.create(spellToCreate)
      createdSpellWizard.wizard = savedWizard
      await this.wizardSpellRepository.insert(createdSpellWizard)
    }
    return this.findOneByName(savedWizard.name)
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
    return wizards.then((wizards) => wizards.map((wizard) => ({ name: wizard.name })))
  }

  async update(p: { wizardName: string; wizard: Partial<WizardToUpdate> }): Promise<Wizard> {
    const toUpdate: Partial<DBWizardToUpdate> = {
      updatedDate: new Date(),
      category: p.wizard.category
    }
    await this.wizardRepository.update(
      {
        name: p.wizardName
      },
      toUpdate
    )
    const savedWizard = await this.findOneByName(p.wizardName)

    for (const stat of p.wizard.statsToUpdate) {
      const statToCreate: DBWizardStatToCreate = {
        level: stat.level,
        wizardName: savedWizard.name,
        statName: stat.statName,
        xp: 0
      }
      const createdStatWizard = this.wizardStatRepository.create(statToCreate)
      await this.wizardStatRepository.save(createdStatWizard)
    }
    for (const knowledge of p.wizard.knowledgesToUpdate) {
      const knowledgeToCreate: DBWizardKnowledgeToCreate = {
        level: knowledge.level,
        wizardName: savedWizard.name,
        knowledgeName: knowledge.knowledgeName,
        xp: 0
      }
      const createdKnowledgeWizard = this.wizardKnowledgeRepository.create(knowledgeToCreate)
      await this.wizardKnowledgeRepository.save(createdKnowledgeWizard)
    }
    for (const spell of p.wizard.spellsToUpdate) {
      const spellToCreate: DBWizardSpellToCreate = {
        difficulty: spell.difficulty,
        wizardName: savedWizard.name,
        spellName: spell.spell.name,
        xp: 0
      }
      const createdSpellWizard = this.wizardSpellRepository.create(spellToCreate)
      await this.wizardSpellRepository.save(createdSpellWizard)
    }
    return await this.findOneByName(p.wizardName)
  }
}
