import { DBWizardKnowledge } from './wizard-knowledge.db'
import { DBWizardStat } from './wizard-stat.db'
import { Wizard } from '../domain/entities/wizard.entity'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, UpdateDateColumn } from 'typeorm'

@Entity()
export class DBWizard {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @Column({ type: 'varchar', nullable: false })
  name: string

  @Column({ type: 'varchar', nullable: false })
  category: string

  @Column({ type: 'int', nullable: false, default: 0 })
  xp: number

  @OneToMany(() => DBWizardStat, (wizardStat) => wizardStat.wizard, { cascade: true })
  wizardStats: DBWizardStat[]

  @OneToMany(() => DBWizardKnowledge, (wizardKnowledge) => wizardKnowledge.wizard, { cascade: true })
  wizardKnowledges: DBWizardKnowledge[]

  static readonly RELATIONS = {
    wizardKnowledges: {
      knowledge: {
        stat: true
      }
    },
    wizardStats: { stat: true }
  }

  static toWizard(wizard: DBWizard): Wizard {
    return new Wizard({
      id: wizard.id,
      name: wizard.name,
      category: wizard.category,
      stats: wizard.wizardStats.map(DBWizardStat.toWizardStat),
      knowledges: wizard.wizardKnowledges.map(DBWizardKnowledge.toWizardKnowledge),
      xp: wizard.xp
    })
  }
}

export type DBWizardToCreate = Omit<DBWizard, 'id' | 'wizardStats' | 'wizardKnowledges'>

export type DBWizardToUpdate = Omit<DBWizard, 'id' | 'createdDate' | 'wizardStats' | 'wizardKnowledges'>
