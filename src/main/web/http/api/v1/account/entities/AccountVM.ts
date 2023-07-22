import { ProfileVM } from './ProfileVM'
import { Account } from '../../../../../../domain/models/account/Account'
import { Profile } from '../../../../../../domain/models/account/Profile'
import { ApiProperty } from '@nestjs/swagger'

export class AccountVM {
  @ApiProperty()
  id: string
  @ApiProperty()
  profile: ProfileVM
  @ApiProperty()
  createdDate: Date
  @ApiProperty()
  updatedDate: Date

  constructor(p: AccountVM) {
    this.id = p.id
    this.profile = p.profile
    this.createdDate = p.createdDate
    this.updatedDate = p.updatedDate
  }

  static of(p: { account: Account; profile: Profile }): AccountVM {
    return new AccountVM({
      id: p.account.id.toString(),
      profile: ProfileVM.from(p.profile),
      createdDate: p.account.createdDate,
      updatedDate: new Date()
    })
  }
}
