import { AdminAccountVM } from './entities/AdminAccountVM'
import { AdminAccountUpdateRequest } from './requests/AdminAccountUpdateRequest'
import { Account } from '../../../../../../domain/models/account/Account'
import { Authority } from '../../../../../../domain/models/auth/Authority'
import { AuthType } from '../../../../../../domain/models/auth/AuthType'
import { AccountService } from '../../../../../../domain/services/account/AccountService'
import { AuthenticationService } from '../../../../../../domain/services/auth/AuthenticationService'
import { CurrentAccountDecorator } from '../../../decorators/CurrentAccountDecorator'
import { Roles } from '../../../decorators/RolesDecorator'
import { RolesGuard } from '../../../guards/RolesGuard'
import { AdminRegisterRequest } from '../auth/requests/AdminRegisterRequest'
import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/admin/account')
@ApiTags('AdminAccount')
@UseGuards(RolesGuard)
@Roles(Authority.SUPER_ADMIN)
export class AdminAccountController {
  constructor(private accountService: AccountService, private authenticationService: AuthenticationService) {}
  @ApiCreatedResponse({
    description: 'The record has been successfully created.'
  })
  @ApiConflictResponse({ description: 'Forbidden.' })
  @ApiCreatedResponse()
  @Post('register')
  async register(
    @CurrentAccountDecorator() currentAccount: Account,
    @Body() req: AdminRegisterRequest
  ): Promise<AdminAccountVM> {
    const result = await this.authenticationService.register({
      identifier: req.email,
      password: req.password,
      authType: AuthType.EMAIL_PASSWORD
    })
    return AdminAccountVM.from(result.account)
  }

  @ApiOkResponse()
  @Put(':id')
  async update(@Param('id') id: string, @Body() req: AdminAccountUpdateRequest): Promise<AdminAccountVM> {
    const accountUpdated = await this.accountService.update(id, req.authority)
    return AdminAccountVM.from(accountUpdated)
  }

  @ApiOkResponse()
  @Get()
  async findAll(): Promise<AdminAccountVM[]> {
    const results = await this.accountService.findAll()
    return results.map((account) => AdminAccountVM.from(account))
  }

  @ApiOkResponse()
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AdminAccountVM> {
    const results = await this.accountService.findOneById(id)
    return AdminAccountVM.from(results)
  }
}
