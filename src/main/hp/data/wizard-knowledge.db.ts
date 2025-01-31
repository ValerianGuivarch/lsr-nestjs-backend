import { DBKnowledge } from './knowledge.db'
import { DBWizard } from './wizard.db'
import { WizardKnowledge } from '../domain/entities/wizard-knowledge.entity'
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
@Index(['wizardName', 'knowledgeName'], { unique: true }) // Garantit l'unicité logique
export class DBWizardKnowledge {
  @PrimaryGeneratedColumn('uuid') // Clé primaire unique pour Directus
  id: string

  @CreateDateColumn()
  createdDate: Date

  @UpdateDateColumn()
  updatedDate: Date

  @Column({ type: 'integer', default: 1 })
  level: number

  @PrimaryColumn({ type: 'varchar' }) // Assure que wizardName reste une clé primaire composite
  wizardName: string

  @ManyToOne(() => DBWizard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wizardName' })
  wizard: DBWizard

  @PrimaryColumn({ type: 'uuid' }) // Assure que knowledgeName reste une clé primaire composite
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

export type DBWizardKnowledgeToCreate = Omit<
  DBWizardKnowledge,
  'id' | 'createdDate' | 'updatedDate' | 'wizard' | 'knowledge'
>
export type DBWizardKnowledgeToUpdate = Pick<DBWizardKnowledge, 'level' | 'updatedDate'>
