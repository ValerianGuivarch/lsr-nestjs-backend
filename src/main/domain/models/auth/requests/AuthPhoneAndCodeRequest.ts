import { AuthRequest } from './AuthRequest'
import { AuthType } from '../AuthType'

export class AuthPhoneAndCodeRequest extends AuthRequest {
  phone: string
  code: string

  constructor(phone: string, code: string) {
    super(AuthType.PHONE_CODE)
    this.phone = phone
    this.code = code
  }
}
