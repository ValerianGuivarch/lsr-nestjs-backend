import { DBAccount } from '../account/DBAccount'
import { DBEntity } from '../DBEntity'
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm'

@Entity()
export class DBProfile extends DBEntity {
  @Column()
  accountId: string

  @OneToOne(() => DBAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: DBAccount

  @Column()
  name: string
}
