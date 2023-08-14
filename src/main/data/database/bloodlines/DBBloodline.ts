import { PrimaryColumn, Column, Entity } from 'typeorm'

@Entity()
export class DBBloodline {
  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({ type: 'varchar', default: '' })
  display: string
}
