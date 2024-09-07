import { DBKnowledge } from './knowledge.db'
import { DBWizard } from './wizard.db'
import { WizardKnowledge } from '../domain/entities/wizard-knowledge.entity'
import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm'

@Entity()
export class DBWizardKnowledge {
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

  @PrimaryColumn({ type: 'uuid' })
  knowledgeName: string

  @ManyToOne(() => DBKnowledge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'knowledgeName' })
  knowledge: DBKnowledge

  @Column({ type: 'integer', nullable: false, default: 0 })
  xp: number

  static readonly RELATIONS = {}

  static toWizardKnowledge(dbWizardKnowledge: DBWizardKnowledge): WizardKnowledge {
    return {
      knowledge: DBKnowledge.toKnowledge(dbWizardKnowledge.knowledge),
      level: dbWizardKnowledge.level,
      xp: dbWizardKnowledge.xp
    }
  }
}

export type DBWizardKnowledgeToCreate = Omit<DBWizardKnowledge, 'createdDate' | 'updatedDate' | 'wizard' | 'knowledge'>
export type DBWizardKnowledgeToUpdate = Pick<DBWizardKnowledge, 'level' | 'updatedDate'>
