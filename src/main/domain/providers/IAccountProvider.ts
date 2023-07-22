import { Account, AccountToCreate } from '../models/account/Account'

export interface IAccountProvider {
  create(account: AccountToCreate): Promise<Account>
  update(account: Account): Promise<Account>
  findByName(username: string): Promise<Account>
  findByPhone(phone: string): Promise<Account>
  findById(id: string): Promise<Account | undefined>
  findOneByEmail(email: string): Promise<Account>
  findByEmail(email: string): Promise<Account | undefined>
  findAllByIdIn(ids: string[]): Promise<Account[]>
  countAll(): Promise<number>
  findAll(): Promise<Account[]>
}
