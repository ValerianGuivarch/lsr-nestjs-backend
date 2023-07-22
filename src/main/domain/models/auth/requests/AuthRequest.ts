import { AuthType } from '../AuthType'

export class AuthRequest {
  type: AuthType

  constructor(type: AuthType) {
    this.type = type
  }
}
