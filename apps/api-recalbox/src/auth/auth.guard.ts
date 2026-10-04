import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import { AuthService } from './auth.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.auth.sessionFromCookie(request.headers.cookie)

    if (!this.auth.verifySession(token)) {
      throw new UnauthorizedException('Connexion requise')
    }

    return true
  }
}
