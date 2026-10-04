import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { LoginDto } from './login.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(
    @Body() body: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): { authenticated: true } {
    const token = this.auth.authenticate(body.password, this.clientId(request))
    response.setHeader('Set-Cookie', this.auth.createSessionCookie(token))
    return { authenticated: true }
  }

  @Get('session')
  session(@Req() request: Request): { authenticated: boolean } {
    const token = this.auth.sessionFromCookie(request.headers.cookie)
    return { authenticated: this.auth.verifySession(token) }
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: Response): { authenticated: false } {
    response.setHeader('Set-Cookie', this.auth.createClearedSessionCookie())
    return { authenticated: false }
  }

  private clientId(request: Request): string {
    const forwarded = request.headers['x-forwarded-for']
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim()
    }
    return request.ip || request.socket.remoteAddress || 'unknown'
  }
}
