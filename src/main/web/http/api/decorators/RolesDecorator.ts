import { Authority } from '../../../../domain/models/auth/Authority'
import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: Authority[]) => SetMetadata(ROLES_KEY, roles)
