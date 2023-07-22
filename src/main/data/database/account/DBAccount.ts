import { Authority } from '../../../domain/models/auth/Authority'
import { DBEntity } from '../DBEntity'
import { Column, Entity } from 'typeorm'

@Entity()
export class DBAccount extends DBEntity {
  @Column()
  authority: Authority

  @Column()
  secret: string
}
