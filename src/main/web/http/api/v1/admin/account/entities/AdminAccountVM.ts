import { Account } from '../../../../../../../domain/models/account/Account'
import { Authority } from '../../../../../../../domain/models/auth/Authority'
import { ApiProperty } from '@nestjs/swagger'

export class AdminAccountVM {
  @ApiProperty()
  id: string
  // eslint-disable-next-line @darraghor/nestjs-typed/api-property-returning-array-should-set-array
  @ApiProperty({ isArray: true, enum: Authority, enumName: 'Authority', example: Object.values(Authority) })
  authority: Authority
  @ApiProperty()
  createdDate: Date
  @ApiProperty()
  updatedDate: Date

  constructor(p: AdminAccountVM) {
    this.id = p.id
    this.authority = p.authority
    this.createdDate = p.createdDate
    this.updatedDate = p.updatedDate
  }

  static from(account: Account): AdminAccountVM {
    return new AdminAccountVM({
      id: account.id,
      authority: account.authority,
      createdDate: account.createdDate,
      updatedDate: account.updatedDate
    })
  }
}
