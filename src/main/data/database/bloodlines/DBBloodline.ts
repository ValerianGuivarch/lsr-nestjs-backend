import { DBSkill } from '../skills/DBSkill'
import { PrimaryColumn, Column, Entity, ManyToMany, JoinTable } from 'typeorm'

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

  @ManyToMany(() => DBSkill)
  @JoinTable({ name: 'DBBloodlineSkill' })
  skills: DBSkill[]
}
