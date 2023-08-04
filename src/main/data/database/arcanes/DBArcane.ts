import { ArcaneType } from '../../../domain/models/arcanes/ArcaneType'
import { PrimaryColumn, Column, Entity } from 'typeorm'

@Entity()
export class DBArcane {
  @PrimaryColumn({ type: 'varchar' })
  name: string

  @Column({
    type: 'enum',
    enum: ArcaneType,
    default: ArcaneType.ESSENCE
  })
  type: string
}
