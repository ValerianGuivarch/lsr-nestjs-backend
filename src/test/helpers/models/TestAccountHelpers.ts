import { Account, AccountToCreate } from '../../../main/domain/models/account/Account'
import { UserState } from '../../../main/domain/models/account/UserState'
import { Authority } from '../../../main/domain/models/auth/Authority'
import { Chance } from 'chance'

export class TestAccountHelpers {
  static chance: Chance.Chance = new Chance()
  static generateCompanyToCreate(): AccountToCreate {
    return {
      email: this.chance.email(),
      phone: this.chance.phone(),
      name: this.chance.name(),
      password: this.chance.string(),
      companyId: this.chance.guid(),
      createdDate: this.chance.date(),
      updatedDate: this.chance.date(),
      secret: this.chance.string(),
      authority: this.chance.pickone([Authority.FOREMAN, Authority.TRANSPORTER]),
      state: this.chance.pickone([UserState.CREATED, UserState.COMPLETE])
    }
  }

  static generateAccount(): Account {
    return {
      id: this.chance.guid(),
      email: this.chance.email(),
      phone: this.chance.phone(),
      name: this.chance.name(),
      password: this.chance.string(),
      companyId: this.chance.guid(),
      createdDate: this.chance.date(),
      updatedDate: this.chance.date(),
      secret: this.chance.string(),
      authority: this.chance.pickone([Authority.FOREMAN, Authority.TRANSPORTER]),
      state: this.chance.pickone([UserState.CREATED, UserState.COMPLETE])
    }
  }

  static updateAccount(account: Account): Account {
    return {
      ...account,
      email: account.email,
      phone: account.phone,
      name: account.name,
      password: account.password,
      companyId: account.companyId,
      createdDate: account.createdDate,
      updatedDate: account.updatedDate,
      secret: account.secret,
      authority: account.authority,
      state: account.state
    }
  }
}
