import { DBWizardSpell, DBWizardSpellToCreate, DBWizardSpellToUpdate } from './wizard-spell.db'
import { ProviderErrors } from '../../data/errors/ProviderErrors'
import { WizardSpell, WizardSpellToCreate, WizardSpellToUpdate } from '../domain/entities/wizard-spell.entity'
import { IWizardSpellProvider } from '../domain/providers/wizard-spell.provider'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
export class WizardSpellImplementation implements IWizardSpellProvider {
  private readonly logger = new Logger(DBWizardSpell.name)
  constructor(
    @InjectRepository(DBWizardSpell, 'postgres')
    private readonly wizardSpellRepository: Repository<DBWizardSpell>
  ) {
    this.logger.log('Initialised')
  }

  async create(wizardId: string, wizardSpell: WizardSpellToCreate): Promise<WizardSpell> {
    const toCreate: DBWizardSpellToCreate = {
      spellId: wizardSpell.spell.id,
      wizardId: wizardId,
      difficulty: wizardSpell.difficulty,
      xp: 0
    }
    const created = this.wizardSpellRepository.create(toCreate)
    await this.wizardSpellRepository.insert(created)
    return this.findOneByWizardIdAndSpellId({
      wizardId: created.wizardId,
      spellId: created.spellId
    })
  }

  private async findOneByWizardIdAndSpellId(p: { wizardId: string; spellId: string }): Promise<WizardSpell> {
    const dbWizardSpell = await this.wizardSpellRepository.findOne({
      where: {
        wizardId: p.wizardId,
        spellId: p.spellId
      },
      relations: DBWizardSpell.RELATIONS
    })
    if (!dbWizardSpell) {
      throw ProviderErrors.EntityNotFound(WizardSpellImplementation.name)
    }
    return DBWizardSpell.toWizardSpell(dbWizardSpell)
  }

  async update(p: { wizardId: string; spellId: string; wizardSpell: WizardSpellToUpdate }): Promise<WizardSpell> {
    const toUpdate: DBWizardSpellToUpdate = {
      difficulty: p.wizardSpell.difficulty,
      updatedDate: new Date()
    }
    await this.wizardSpellRepository.update(
      {
        wizardId: p.wizardId,
        spellId: p.spellId
      },
      toUpdate
    )
    return this.findOneByWizardIdAndSpellId({
      wizardId: p.wizardId,
      spellId: p.spellId
    })
  }
}
