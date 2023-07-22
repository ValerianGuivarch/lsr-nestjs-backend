import { AuthType } from '../../../domain/models/auth/AuthType'
import { DBAccount } from '../account/DBAccount'
import { DBEntity } from '../DBEntity'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'

@Entity()
export class DBAuthentication extends DBEntity {
  @Column({ unique: true })
  identifier: string

  @Column()
  password: string

  @Column('varchar', { nullable: false })
  type: AuthType

  @Column()
  accountId: string

  @ManyToOne(() => DBAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: DBAccount
}
