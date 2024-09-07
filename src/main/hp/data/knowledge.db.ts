import { Knowledge } from '../domain/entities/knowledge.entity'
import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm'

@Entity()
export class DBKnowledge {
  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({ type: 'varchar', nullable: false, default: '' })
  flipText: string

  static readonly RELATIONS = {}

  static toKnowledge(knowledge: DBKnowledge): Knowledge {
    return new Knowledge({
      name: knowledge.name,
      flipText: knowledge.flipText
    })
  }
}
