import { IAuthenticationResponse } from './IAuthenticationResponse'
import { AuthType } from '../../models/auth/AuthType'

export interface IAuthenticationProvider {
  findOneByIdentifierAndAuthType(identifier: string, authType: AuthType): Promise<IAuthenticationResponse>
  create(identifier: string, password: string, type: AuthType, accountId: string): Promise<IAuthenticationResponse>
  update(identifier: string, password: string, authType: AuthType): Promise<IAuthenticationResponse>
  delete(identifier: string): Promise<boolean>
  exist(identifier: string, authType: AuthType): Promise<boolean>
}
