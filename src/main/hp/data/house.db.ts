import { House } from '../domain/entities/house.entity'
import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm'

@Entity()
export class DBHouse {
  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({ type: 'int', nullable: false, default: 0 })
  points: number

  static readonly RELATIONS = {}

  static toHouse(house: DBHouse): House {
    return new House({
      name: house.name,
      points: house.points
    })
  }
}
