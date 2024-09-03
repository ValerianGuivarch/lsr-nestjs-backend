import { DBWizardStat, DBWizardStatToCreate, DBWizardStatToUpdate } from './wizard-stat.db'
import { ProviderErrors } from '../../data/errors/ProviderErrors'
import { WizardStat, WizardStatToCreate, WizardStatToUpdate } from '../domain/entities/wizard-stat.entity'
import { IWizardStatProvider } from '../domain/providers/wizard-stat.provider'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
export class WizardStatImplementation implements IWizardStatProvider {
  private readonly logger = new Logger(DBWizardStat.name)
  constructor(
    @InjectRepository(DBWizardStat, 'postgres')
    private readonly wizardStatRepository: Repository<DBWizardStat>
  ) {
    this.logger.log('Initialised')
  }

  async create(wizardId: string, wizardStat: WizardStatToCreate): Promise<WizardStat> {
    const toCreate: DBWizardStatToCreate = {
      statId: wizardStat.stat.id,
      wizardId: wizardId,
      level: wizardStat.level
    }
    const created = this.wizardStatRepository.create(toCreate)
    await this.wizardStatRepository.insert(created)
    return this.findOneByWizardIdAndStatId({
      wizardId: created.wizardId,
      statId: created.statId
    })
  }

  private async findOneByWizardIdAndStatId(p: { wizardId: string; statId: string }): Promise<WizardStat> {
    const dbWizardStat = await this.wizardStatRepository.findOne({
      where: {
        wizardId: p.wizardId,
        statId: p.statId
      },
      relations: DBWizardStat.RELATIONS
    })
    if (!dbWizardStat) {
      throw ProviderErrors.EntityNotFound(WizardStatImplementation.name)
    }
    return DBWizardStat.toWizardStat(dbWizardStat)
  }

  async update(p: { wizardId: string; statId: string; wizardStat: WizardStatToUpdate }): Promise<WizardStat> {
    const toUpdate: DBWizardStatToUpdate = {
      level: p.wizardStat.level,
      updatedDate: new Date()
    }
    await this.wizardStatRepository.update(
      {
        wizardId: p.wizardId,
        statId: p.statId
      },
      toUpdate
    )
    return this.findOneByWizardIdAndStatId({
      wizardId: p.wizardId,
      statId: p.statId
    })
  }
}
