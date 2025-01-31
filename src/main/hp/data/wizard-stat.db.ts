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

  @PrimaryColumn({ type: 'varchar' })
  wizardName: string

  @ManyToOne(() => DBWizard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wizardName' })
  wizard: DBWizard

  @PrimaryColumn({ type: 'varchar' })
  statName: string

  @ManyToOne(() => DBStat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'statName' })
  stat: DBStat

  @Column({ type: 'integer', nullable: false, default: 0 })
  xp: number

  static readonly RELATIONS = {
    stat: true
  }

  static toWizardStat(dbWizardStat: DBWizardStat): WizardStat {
    return {
      stat: DBStat.toStat(dbWizardStat.stat),
      level: dbWizardStat.level,
      xp: dbWizardStat.xp
    }
  }
}

export type DBWizardStatToCreate = Omit<DBWizardStat, 'createdDate' | 'updatedDate' | 'wizard' | 'stat'>
