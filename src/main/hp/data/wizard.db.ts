import { DBWizardKnowledge } from './wizard-knowledge.db'
import { DBWizardSpell } from './wizard-spell.db'
import { DBWizardStat } from './wizard-stat.db'
import { Wizard } from '../domain/entities/wizard.entity'
import { Entity, Column, CreateDateColumn, OneToMany, UpdateDateColumn, PrimaryColumn } from 'typeorm'

@Entity()
export class DBWizard {
  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({ type: 'varchar', nullable: false })
  category: string

  @Column({ type: 'int', nullable: false, default: 0 })
  xp: number

  @OneToMany(() => DBWizardStat, (wizardStat) => wizardStat.wizard, { cascade: true })
  wizardStats: DBWizardStat[]

  @OneToMany(() => DBWizardKnowledge, (wizardKnowledge) => wizardKnowledge.wizard, { cascade: true })
  wizardKnowledges: DBWizardKnowledge[]

  @OneToMany(() => DBWizardSpell, (wizardSpell) => wizardSpell.wizard, { cascade: true })
  wizardSpells: DBWizardSpell[]

  static readonly RELATIONS = {
    wizardKnowledges: {
      knowledge: true
    },
    wizardStats: { stat: true },
    wizardSpells: {
      spell: {
        knowledge: true,
        stat: true
      }
    }
  }

  static toWizard(wizard: DBWizard): Wizard {
    return new Wizard({
      name: wizard.name,
      category: wizard.category,
      stats: wizard.wizardStats.map(DBWizardStat.toWizardStat),
      knowledges: wizard.wizardKnowledges.map(DBWizardKnowledge.toWizardKnowledge),
      spells: wizard.wizardSpells.map(DBWizardSpell.toWizardSpell),
      xp: wizard.xp
    })
  }
}

export type DBWizardToCreate = Omit<DBWizard, 'id' | 'wizardStats' | 'wizardKnowledges' | 'wizardSpells'>

export type DBWizardToUpdate = Omit<DBWizard, 'id' | 'createdDate' | 'wizardStats' | 'wizardKnowledges'>
