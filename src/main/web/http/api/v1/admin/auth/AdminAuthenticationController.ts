import { AdminJWTTokenVM } from './entities/AdminJWTTokenVM'
import { AdminLoginRequest } from './requests/AdminLoginRequest'
import { AdminRefreshTokenRequest } from './requests/AdminRefreshTokenRequest'
import { AuthenticationService } from '../../../../../../domain/services/auth/AuthenticationService'
import { Body, Controller, Post } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('v1/admin/auth')
@ApiTags('AdminAuthentication')
export class AdminAuthenticationController {
  constructor(private authService: AuthenticationService) {}

  @ApiOkResponse()
  @Post('login')
  async login(@Body() req: AdminLoginRequest): Promise<AdminJWTTokenVM> {
    return AdminJWTTokenVM.of(
      await this.authService.signInWithEmailAndPassword({
        email: req.email,
        password: req.password,
      })
    )
  }

  @ApiOkResponse()
  @Post('refresh')
  async refreshToken(
    @Body() req: AdminRefreshTokenRequest
  ): Promise<AdminJWTTokenVM> {
    const token = await this.authService.refreshToken(req.refreshToken)
    return AdminJWTTokenVM.of(token)
  }
}
