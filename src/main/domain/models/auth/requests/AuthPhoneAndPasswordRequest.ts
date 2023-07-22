import { AuthRequest } from './AuthRequest'
import { AuthType } from '../AuthType'

export class AuthPhoneAndPasswordRequest extends AuthRequest {
  phone: string
  password: string

  constructor(phone: string, password: string) {
    super(AuthType.PHONE_PASSWORD)
    this.phone = phone
    this.password = password
  }
}
