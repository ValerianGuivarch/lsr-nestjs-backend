import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'jdr_draft' })
export class DBJdrDraft {
  @PrimaryColumn({ type: 'varchar' })
  id: string

  @Column({ type: 'varchar', nullable: false, default: '' })
  name: string

  @Column({ type: 'varchar', nullable: false })
  jdrSlug: string

  @Column({ type: 'varchar', nullable: false })
  groupSlug: string

  @Column({ type: 'varchar', nullable: false })
  traitType: string

  @Column({ type: 'text', nullable: false, default: '[]' })
  selectedTraitSlugsJson: string

  @Column({ type: 'text', nullable: false })
  characterOrderJson: string

  @Column({ type: 'text', nullable: false })
  poolByRoundJson: string

  @Column({ type: 'text', nullable: false, default: '{}' })
  handsByCharacterJson: string

  @Column({ type: 'text', nullable: false })
  picksJson: string

  @Column({ type: 'int', nullable: false, default: 1 })
  totalRounds: number

  @Column({ type: 'int', nullable: false, default: 1 })
  currentRound: number

  @Column({ type: 'varchar', nullable: false, default: 'pending' })
  status: 'pending' | 'active' | 'completed' | 'cancelled'

  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedDate: Date
}
