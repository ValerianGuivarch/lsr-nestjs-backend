import { DBSpell } from './spell.db'
import { DBWizard } from './wizard.db'
import { Difficulty } from '../domain/entities/difficulty.enum'
import { WizardSpell } from '../domain/entities/wizard-spell.entity'
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  Index,
  UpdateDateColumn
} from 'typeorm'

@Entity()
@Index(['wizardName', 'spellName'], { unique: true }) // Garantit l'unicité logique des colonnes wizardName et spellName
export class DBWizardSpell {
  @PrimaryGeneratedColumn('uuid') // Clé primaire unique requise pour Directus
  id: string

  @CreateDateColumn()
  createdDate: Date

  @UpdateDateColumn()
  updatedDate: Date

  @Column({ type: 'varchar', nullable: false, default: 'NORMAL' })
  difficulty: string

  @PrimaryColumn({ type: 'varchar' }) // Assure que wizardName reste une clé primaire composite
  wizardName: string

  @ManyToOne(() => DBWizard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'wizardName' })
  wizard: DBWizard

  @PrimaryColumn({ type: 'varchar' }) // Assure que spellName reste une clé primaire composite
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

export type DBWizardSpellToCreate = Omit<DBWizardSpell, 'id' | 'createdDate' | 'updatedDate' | 'wizard' | 'spell'>
export type DBWizardSpellToUpdate = Pick<DBWizardSpell, 'difficulty' | 'updatedDate'>
