import { DBSpell } from './spell.db'
import { DBWizard } from './wizard.db'
import { Difficulty } from '../domain/entities/difficulty.enum'
import { WizardSpell } from '../domain/entities/wizard-spell.entity'
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class DBWizardSpell {
  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @Column({ type: String, nullable: false, default: 'NORMAL' })
  difficulty: string

  @PrimaryColumn({ type: 'varchar' })
  wizardName: string

  @ManyToOne(() => DBWizard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wizardName' })
  wizard: DBWizard

  @PrimaryColumn({ type: 'varchar' })
  spellName: string

  @ManyToOne(() => DBSpell, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'spellName' })
  spell: DBSpell

  @Column({ type: 'integer', nullable: false, default: 0 })
  xp: number

  static readonly RELATIONS = {
    spell: true
  }

  static toWizardSpell(dbWizardSpell: DBWizardSpell): WizardSpell {
    return {
      spell: DBSpell.toSpell(dbWizardSpell.spell),
      difficulty: Difficulty[dbWizardSpell.difficulty],
      xp: dbWizardSpell.xp
    }
  }
}

export type DBWizardSpellToCreate = Omit<DBWizardSpell, 'createdDate' | 'updatedDate' | 'wizard' | 'spell'>
export type DBWizardSpellToUpdate = Pick<DBWizardSpell, 'difficulty' | 'updatedDate'>
