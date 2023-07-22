import { mergeNonNull } from '../../helpers/EntityUtils'
import { Account } from '../../models/account/Account'
import { Profile } from '../../models/account/Profile'
import { Authority } from '../../models/auth/Authority'
import { IAccountProvider } from '../../providers/account/IAccountProvider'
import { IProfileProvider } from '../../providers/profile/IProfileProvider'
import { Inject, Injectable, Logger } from '@nestjs/common'

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name)
  constructor(
    @Inject('IAccountProvider')
    private accountProvider: IAccountProvider,
    @Inject('IProfileProvider')
    private profileProvider: IProfileProvider
  ) {
    console.log('AccountService')
  }

  async findOneAccountById(id: string): Promise<Account> {
    return this.accountProvider.findById(id)
  }

  async updateAccount(p: { account: Account; accountUpdate: Partial<Account> }): Promise<Account> {
    const account = await this.accountProvider.findById(p.account.id)
    this.logger.log(`updateAccount > Account[${account.id}] > update`)
    return this.accountProvider.update(mergeNonNull(account, p.accountUpdate))
  }

  async findOneProfileByAccountId(accountId: string): Promise<Profile> {
    return this.profileProvider.findOneByAccountId(accountId)
  }

  async updateProfile(p: { profile: Profile; profileUpdate: Partial<Profile> }): Promise<Profile> {
    const profile = await this.profileProvider.findOneByAccountId(p.profile.accountId)
    this.logger.log(`updateProfile > Profile[${profile.id}] > update`)
    return this.profileProvider.update(mergeNonNull(profile, p.profileUpdate))
  }

  async update(id: string, authority: Authority): Promise<Account> {
    const account = await this.accountProvider.findById(id)
    account.authority = authority
    const res = await this.accountProvider.update(account)
    this.logger.log(`update > Account[${res.id}]`)
    return res
  }

  async findOneById(id: string): Promise<Account> {
    return this.accountProvider.findById(id)
  }

  async findAll(): Promise<Account[]> {
    return this.accountProvider.findAll()
  }
}
