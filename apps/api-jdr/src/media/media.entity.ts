import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export type MediaType = 'portrait' | 'image'

@Entity({ name: 'media' })
@Index(['type', 'slug'])
export class MediaEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  name!: string

  @Column()
  slug!: string

  @Column({ type: 'varchar' })
  type!: MediaType

  /** Relative to MEDIA_ROOT, never an arbitrary filesystem path. */
  @Column()
  filename!: string

  @Column()
  mimeType!: string

  @Column({ type: 'integer', nullable: true })
  width!: number | null

  @Column({ type: 'integer', nullable: true })
  height!: number | null

  @Column({ type: 'integer', nullable: true })
  bytes!: number | null

  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date
}
