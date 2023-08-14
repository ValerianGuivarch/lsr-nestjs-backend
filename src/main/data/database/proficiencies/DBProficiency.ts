import { DBProficiencyAttrs } from './DBProficiencyAttrs'
import { DisplayCategory } from '../../../domain/models/characters/DisplayCategory'
import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class DBProficiency extends DBProficiencyAttrs {
  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({ type: 'varchar' })
  shortName: string

  @Column({
    type: 'enum',
    enum: DisplayCategory
  })
  displayCategory: string

  @Column({ default: '' })
  description: string
}
