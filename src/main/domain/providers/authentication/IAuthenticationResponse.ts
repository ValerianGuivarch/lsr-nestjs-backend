import { AuthType } from '../../models/auth/AuthType'

export type IAuthenticationResponse = {
  id: string
  identifier: string
  password: string
  type: AuthType
  createdAt: Date
  updatedAt: Date
  accountId: string
}
