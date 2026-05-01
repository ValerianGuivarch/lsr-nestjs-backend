import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity('Event')
export class DBEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  description: string
}
