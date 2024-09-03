import { Flip } from '../domain/entities/flip.entity'
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class DBFlip {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @CreateDateColumn({ default: () => 'NOW()' })
  createdDate: Date

  @UpdateDateColumn({ default: () => 'NOW()' })
  updatedDate: Date

  @Column({ type: 'varchar', nullable: false })
  text: string

  @Column({ type: 'varchar', nullable: false })
  wizardName: string

  @Column({ type: 'int', nullable: false })
  result: number

  @Column({ type: 'int', nullable: false, default: 0 })
  base: number

  @Column({ type: 'int', nullable: false, default: 0 })
  modif: number

  static readonly RELATIONS = {}

  static toFlip(flip: DBFlip): Flip {
    return new Flip({
      id: flip.id,
      text: flip.text,
      wizardName: flip.wizardName,
      result: flip.result,
      base: flip.base,
      modif: flip.modif
    })
  }
}
