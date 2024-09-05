import { Knowledge } from '../domain/entities/knowledge.entity'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

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

  @Column({ type: 'varchar', nullable: false, default: '' })
  flipText: string

  static readonly RELATIONS = {}

  static toKnowledge(knowledge: DBKnowledge): Knowledge {
    return new Knowledge({
      id: knowledge.id,
      name: knowledge.name,
      flipText: knowledge.flipText
    })
  }
}
