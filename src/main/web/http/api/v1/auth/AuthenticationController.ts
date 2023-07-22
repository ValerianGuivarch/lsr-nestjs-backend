import { JWTTokenVM } from './entities/JWTTokenVM'
import { RefreshTokenRequest } from './requests/RefreshTokenRequest'
import { RegisterRequest } from './requests/RegisterRequest'
import { SignInByEmailAndPasswordRequest } from './requests/SignInByEmailAndPasswordRequest'
import { Authority } from '../../../../../domain/models/auth/Authority'
import { AuthType } from '../../../../../domain/models/auth/AuthType'
import { AuthenticationService } from '../../../../../domain/services/auth/AuthenticationService'
import { Public } from '../../decorators/PublicDecorator'
import { Body, Controller, Post } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/auth')
@ApiTags('Authentication')
export class AuthenticationController {
  constructor(private authService: AuthenticationService) {}

  @ApiOkResponse()
  @Public()
  @Post('register')
  async register(@Body() request: RegisterRequest): Promise<JWTTokenVM> {
    await this.authService.register({
      identifier: request.email,
      password: request.password,
      authority: Authority.USER,
      authType: AuthType.EMAIL_PASSWORD
    })
    return JWTTokenVM.of(
      await this.authService.signInWithEmailAndPassword({ email: request.email, password: request.password })
    )
  }

  @ApiOkResponse()
  @Post('refresh')
  async refreshToken(@Body() req: RefreshTokenRequest): Promise<JWTTokenVM> {
    const token = await this.authService.refreshToken(req.refreshToken)
    return new JWTTokenVM(token)
  }

  @ApiOkResponse()
  @Post()
  async login(@Body() request: SignInByEmailAndPasswordRequest): Promise<JWTTokenVM> {
    return JWTTokenVM.of(
      await this.authService.signInWithEmailAndPassword({ email: request.email, password: request.password })
    )
  }
}
