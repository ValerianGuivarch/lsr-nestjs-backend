import { DBStat } from './stat.db'
import { DBWizard } from './wizard.db'
import { WizardStat } from '../domain/entities/wizard-stat.entity'
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  Index
} from 'typeorm'

@Entity()
@Index(['wizardName', 'statName'], { unique: true }) // Garantit l'unicité logique
export class DBWizardStat {
  @PrimaryGeneratedColumn('uuid') // Clé primaire unique pour Directus
  id: string

  @CreateDateColumn()
  createdDate: Date

  @UpdateDateColumn()
  updatedDate: Date

  @Column({ type: 'integer', default: 1 })
  level: number

  @PrimaryColumn({ type: 'varchar' }) // Assure que wizardName reste une clé primaire
  wizardName: string

  @ManyToOne(() => DBWizard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wizardName' })
  wizard: DBWizard

  @PrimaryColumn({ type: 'varchar' }) // Assure que statName reste une clé primaire
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

export type DBWizardStatToCreate = Omit<DBWizardStat, 'id' | 'createdDate' | 'updatedDate' | 'wizard' | 'stat'>
export type DBWizardStatToUpdate = Pick<DBWizardStat, 'level' | 'updatedDate'>
