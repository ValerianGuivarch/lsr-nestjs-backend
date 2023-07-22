import { AuthRequest } from './AuthRequest'
import { AuthType } from '../AuthType'

export class AuthEmailAndPasswordRequest extends AuthRequest {
  email: string
  password: string

  constructor(email: string, password: string) {
    super(AuthType.EMAIL_PASSWORD)
    this.email = email
    this.password = password
  }
}
