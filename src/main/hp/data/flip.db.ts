import { Difficulty } from '../domain/entities/difficulty.enum'
import { Flip } from '../domain/entities/flip.entity'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class DBFlip {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @Column({ type: 'varchar', nullable: false })
  text: string

  @Column({ type: 'varchar', nullable: false })
  wizardName: string

  @Column({ type: 'varchar', nullable: true })
  wizardDisplayName?: string

  @Column({ type: 'int', nullable: false })
  result: number

  @Column({ type: 'int', nullable: true })
  baseBis?: number

  @Column({ type: 'int', nullable: false, default: 0 })
  base: number

  @Column({ type: 'int', nullable: false, default: 0 })
  modif: number

  @Column({ type: 'varchar', nullable: false, default: 'NORMAL' })
  difficulty: string

  @Column({ type: 'boolean', nullable: false, default: false })
  xpOk: boolean

  @Column({ type: 'varchar', nullable: true })
  spellId?: string

  @Column({ type: 'boolean', nullable: false, default: false })
  success: boolean

  @Column({ type: 'varchar', nullable: true })
  knowledgeId?: string

  @Column({ type: 'varchar', nullable: true })
  statId?: string

  static readonly RELATIONS = {}

  static toFlip(flip: DBFlip): Flip {
    return new Flip({
      id: flip.id,
      text: flip.text,
      wizardName: flip.wizardName,
      wizardDisplayName: flip.wizardDisplayName,
      result: flip.result,
      base: flip.base,
      baseBis: flip.baseBis,
      modif: flip.modif,
      difficulty: Difficulty[flip.difficulty],
      xpOk: flip.xpOk,
      spellId: flip.spellId,
      knowledgeId: flip.knowledgeId,
      statId: flip.statId,
      success: flip.success
    })
  }
}
