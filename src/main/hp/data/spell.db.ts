import { DBKnowledge } from './knowledge.db'
import { Spell } from '../domain/entities/spell.entity'
import { Entity, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm'

@Entity()
export class DBSpell {
  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({ type: 'int', nullable: false, default: 0 })
  rank: number

  @Column({ type: 'varchar', nullable: true })
  knowledgeId?: string

  @ManyToOne(() => DBKnowledge, { nullable: true })
  @JoinColumn({ name: 'knowledgeId' })
  knowledge?: DBKnowledge

  static readonly RELATIONS = {
    knowledge: true
  }

  @Column({ type: 'varchar', nullable: true })
  formule: string

  static toSpell(spell: DBSpell): Spell {
    return new Spell({
      name: spell.name,
      knowledge: spell.knowledge,
      rank: spell.rank,
      formule: spell.formule
    })
  }
}

export type DBSpellToCreate = Omit<DBSpell, 'id' | 'knowledge'>
