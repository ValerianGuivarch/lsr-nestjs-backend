import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'

@Injectable()
export class WeddingPhotosGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest()
    const token =
      req.query?.t ||
      req.headers['x-wedding-token'] ||
      // eslint-disable-next-line no-magic-numbers
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : undefined)

    return true
  }
}
