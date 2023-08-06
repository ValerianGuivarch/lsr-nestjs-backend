import { PrimaryColumn, Column, Entity } from 'typeorm'

@Entity()
export class DBBloodline {
  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({ type: 'integer', default: 1 })
  detteByMagicAction: number

  @Column({ type: 'integer', default: 1 })
  detteByPp: number

  @Column({ type: 'boolean', default: false })
  healthImproved: boolean

  @Column({ type: 'varchar', default: '' })
  display: string
}