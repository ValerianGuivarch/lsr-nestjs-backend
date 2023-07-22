import { Authority } from '../auth/Authority'
import { v4 as randomUuid } from 'uuid'

export class Account {
  id: string
  createdDate: Date
  updatedDate: Date
  secret: string
  authority: Authority

  constructor(p: Account) {
    this.id = p.id
    this.createdDate = p.createdDate
    this.updatedDate = p.updatedDate
    this.secret = p.secret
    this.authority = p.authority
  }

  static async accountToCreateFactory(p: { authority: Authority }): Promise<AccountToCreate> {
    return {
      createdDate: new Date(),
      updatedDate: new Date(),
      secret: randomUuid(),
      authority: p.authority
    }
  }
}
export type AccountToCreate = Omit<Account, 'id'>
