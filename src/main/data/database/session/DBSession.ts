import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class DBSession {
  @PrimaryGeneratedColumn()
  id: string

  @Column({ type: 'integer', default: 0 })
  relanceMj: number

  @Column({ type: 'integer', default: 0 })
  chaos: number
}
