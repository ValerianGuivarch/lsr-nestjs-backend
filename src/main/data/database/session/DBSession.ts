import { DBEntity } from '../DBEntity'
import { Entity, Column } from "typeorm"

@Entity()
export class DBSession extends DBEntity {
  @Column({ type: 'integer', default: 0 })
  relanceMj: number

  @Column({ type: 'integer', default: 0 })
  chaos: number
}
