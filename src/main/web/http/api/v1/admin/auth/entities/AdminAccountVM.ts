import { Account } from '../../../../../../../domain/models/account/Account'
import { ApiProperty } from '@nestjs/swagger'

export class AdminAccountVM {
  @ApiProperty()
  id: string
  @ApiProperty()
  createdDate: Date
  @ApiProperty()
  updatedDate: Date

  static of(account: Account): AdminAccountVM {
    return {
      id: account.id,
      createdDate: account.createdDate,
      updatedDate: new Date()
    }
  }
}
