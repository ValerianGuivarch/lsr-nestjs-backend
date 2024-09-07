import { DBKnowledge } from './knowledge.db'
import { DBStat } from './stat.db'
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

  @ManyToOne(() => DBStat)
  @JoinColumn({ name: 'statId' })
  stat: DBStat

  @ManyToOne(() => DBKnowledge)
  @JoinColumn({ name: 'knowledgeId' })
  knowledge: DBKnowledge

  static readonly RELATIONS = {
    stat: true,
    knowledge: true
  }

  static toSpell(spell: DBSpell): Spell {
    return new Spell({
      name: spell.name,
      knowledge: spell.knowledge,
      stat: spell.stat,
      rank: spell.rank
    })
  }
}
