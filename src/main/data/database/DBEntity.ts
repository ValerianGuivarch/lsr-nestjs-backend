import { Column, PrimaryGeneratedColumn } from 'typeorm'

export class DBEntity {
  @PrimaryGeneratedColumn()
  id: string

  @Column({ default: () => 'NOW()' })
  createdDate: Date

  @Column({ default: () => 'NOW()' })
  updatedDate: Date
}
