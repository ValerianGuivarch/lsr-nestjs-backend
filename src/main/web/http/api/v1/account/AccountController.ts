import { AccountVM } from './entities/AccountVM'
import { ProfileUpdateRequest } from './requests/ProfileUpdateRequest'
import { Account } from '../../../../../domain/models/account/Account'
import { Profile } from '../../../../../domain/models/account/Profile'
import { Authority } from '../../../../../domain/models/auth/Authority'
import { AccountService } from '../../../../../domain/services/account/AccountService'
import { CurrentAccountDecorator } from '../../decorators/CurrentAccountDecorator'
import { Public } from '../../decorators/PublicDecorator'
import { Roles } from '../../decorators/RolesDecorator'
import { RolesGuard } from '../../guards/RolesGuard'
import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/account')
@ApiTags('Account')
@UseGuards(RolesGuard)
export class AccountController {
  constructor(private accountService: AccountService) {}

  @ApiOkResponse()
  @Public()
  @Get('me')
  async getAccount(@CurrentAccountDecorator() currentAccount: Account): Promise<AccountVM> {
    const profile = await this.accountService.findOneProfileByAccountId(currentAccount.id)

    return AccountVM.of({
      account: currentAccount,
      profile: profile
    })
  }

  @ApiOkResponse()
  @Roles(Authority.SUPER_ADMIN, Authority.ADMIN)
  @Put(':id')
  async updateAccount(@Param('id') id: string, @Body() profileUpdateRequest: ProfileUpdateRequest): Promise<AccountVM> {
    const account = await this.accountService.findOneAccountById(id)
    const profile = await this.accountService.findOneProfileByAccountId(account.id)
    const profileToUpdate = { name: profileUpdateRequest.name } as Profile

    const profileUpdated = await this.accountService.updateProfile({
      profile: profile,
      profileUpdate: profileToUpdate
    })

    return AccountVM.of({
      account: account,
      profile: profileUpdated
    })
  }
}
