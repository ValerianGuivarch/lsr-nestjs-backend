import { DBStat } from './stat.db'
import { Knowledge } from '../domain/entities/knowledge.entity'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm'

@Entity()
export class DBKnowledge {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @Column({ type: 'varchar', nullable: false })
  name: string

  @ManyToOne(() => DBStat)
  @JoinColumn({ name: 'statId' })
  stat: DBStat

  static readonly RELATIONS = {
    stat: true
  }

  static toKnowledge(knowledge: DBKnowledge): Knowledge {
    return new Knowledge({
      id: knowledge.id,
      name: knowledge.name,
      stat: DBStat.toStat(knowledge.stat)
    })
  }
}
