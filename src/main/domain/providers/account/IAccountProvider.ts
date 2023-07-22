import { Account, AccountToCreate } from '../../models/account/Account'

export interface IAccountProvider {
  create(account: AccountToCreate): Promise<Account>
  update(account: Account): Promise<Account>
  findById(id: string): Promise<Account | undefined>
  findOneById(id: string): Promise<Account>
  findAllByIdIn(ids: string[]): Promise<Account[]>
  countAll(): Promise<number>
  findAll(): Promise<Account[]>
}
