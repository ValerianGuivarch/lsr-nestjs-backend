import { DBStat } from './stat.db'
import { DBWizard } from './wizard.db'
import { WizardStat } from '../domain/entities/wizard-stat.entity'
import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm'

@Entity()
export class DBWizardStat {
  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @Column({ type: 'integer', default: 1 })
  level: number

  @PrimaryColumn({ type: 'uuid' })
  wizardId: string

  @ManyToOne(() => DBWizard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wizardId' })
  wizard: DBWizard

  @PrimaryColumn({ type: 'uuid' })
  statId: string

  @ManyToOne(() => DBStat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'statId' })
  stat: DBStat

  static readonly RELATIONS = {
    stat: true
  }

  static toWizardStat(dbWizardStat: DBWizardStat): WizardStat {
    return {
      stat: DBStat.toStat(dbWizardStat.stat),
      level: dbWizardStat.level
    }
  }
}

export type DBWizardStatToCreate = Omit<DBWizardStat, 'createdDate' | 'updatedDate' | 'wizard' | 'stat'>
export type DBWizardStatToUpdate = Pick<DBWizardStat, 'level' | 'updatedDate'>
