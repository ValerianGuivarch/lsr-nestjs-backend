import { DBHouse } from './house.db'
import { DBWizardKnowledge } from './wizard-knowledge.db'
import { DBWizardSpell } from './wizard-spell.db'
import { DBWizardStat } from './wizard-stat.db'
import { Wizard } from '../domain/entities/wizard.entity'
import {
  Entity,
  Column,
  CreateDateColumn,
  OneToMany,
  UpdateDateColumn,
  PrimaryColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm'

@Entity()
export class DBWizard {
  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({ type: 'varchar', nullable: false, default: '' })
  familyName: string

  @Column({ type: 'varchar', nullable: false })
  category: string

  @Column({ type: 'int', nullable: false, default: 0 })
  xp: number

  @Column({ type: 'varchar', nullable: true })
  houseName?: string

  @ManyToOne(() => DBHouse, { nullable: true })
  @JoinColumn({ name: 'houseName' })
  house?: DBHouse

  @Column({ type: 'varchar', nullable: false, default: '' })
  baguette: string

  @Column({ type: 'varchar', nullable: false, default: '' })
  coupDePouce: string

  @Column({ type: 'varchar', nullable: false, default: '' })
  crochePatte: string

  @Column({ type: 'varchar', nullable: false, default: '' })
  text: string

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
    house: true,
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
      familyName: wizard.familyName,
      category: wizard.category,
      stats: wizard.wizardStats.map(DBWizardStat.toWizardStat),
      knowledges: wizard.wizardKnowledges.map(DBWizardKnowledge.toWizardKnowledge),
      spells: wizard.wizardSpells.map(DBWizardSpell.toWizardSpell),
      xp: wizard.xp,
      house: wizard.house ? DBHouse.toHouse(wizard.house) : undefined,
      baguette: wizard.baguette,
      coupDePouce: wizard.coupDePouce,
      crochePatte: wizard.crochePatte,
      text: wizard.text
    })
  }
}

export type DBWizardToCreate = Omit<DBWizard, 'id' | 'wizardStats' | 'wizardKnowledges' | 'wizardSpells' | 'house'>

export type DBWizardToUpdate = Omit<DBWizard, 'id' | 'createdDate' | 'wizardStats' | 'wizardKnowledges' | 'house'>
