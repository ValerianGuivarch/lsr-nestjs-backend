import { Entity, PrimaryColumn, Column } from 'typeorm'

@Entity()
export class DBEntry {
  @PrimaryColumn()
  day: number

  @PrimaryColumn()
  month: number

  @PrimaryColumn()
  year: number

  @Column({ type: 'text' })
  text: string
}
