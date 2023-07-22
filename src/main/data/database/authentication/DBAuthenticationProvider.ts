import { DBAuthentication } from './DBAuthentication'
import { AuthType } from '../../../domain/models/auth/AuthType'
import { IAuthenticationProvider } from '../../../domain/providers/authentication/IAuthenticationProvider'
import { IAuthenticationResponse } from '../../../domain/providers/authentication/IAuthenticationResponse'
import { ProviderErrors } from '../../errors/ProviderErrors'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
export class DBAuthenticationProvider implements IAuthenticationProvider {
  constructor(
    @InjectRepository(DBAuthentication, 'postgres')
    private readonly authenticationRepository: Repository<DBAuthentication>
  ) {}
  private static toAuthentication(doc: DBAuthentication): IAuthenticationResponse {
    return {
      id: doc.id.toString(),
      identifier: doc.identifier,
      password: doc.password,
      type: doc.type,
      createdAt: doc.createdDate,
      updatedAt: doc.updatedDate,
      accountId: doc.accountId
    } as IAuthenticationResponse
  }

  async create(
    identifier: string,
    password: string,
    type: AuthType,
    accountId: string
  ): Promise<IAuthenticationResponse> {
    try {
      const dbAuthentication = await this.authenticationRepository.save({
        identifier: identifier,
        password: password,
        type: type,
        accountId: accountId
      })
      return DBAuthenticationProvider.toAuthentication(dbAuthentication)
    } catch (e) {
      throw ProviderErrors.AuthenticationCreationFailed()
    }
  }

  async delete(identifier: string): Promise<boolean> {
    try {
      await this.authenticationRepository.delete({
        identifier: identifier
      })
      return true
    } catch (e) {
      return false
    }
  }

  async exist(identifier: string, authType: AuthType): Promise<boolean> {
    return !!(await this.authenticationRepository.findOneBy({
      identifier: identifier,
      type: authType
    }))
  }

  async findOneByIdentifierAndAuthType(identifier: string, authType: AuthType): Promise<IAuthenticationResponse> {
    try {
      const dbAuthentication = await this.authenticationRepository.findOneBy({
        identifier: identifier,
        type: authType
      })
      return DBAuthenticationProvider.toAuthentication(dbAuthentication)
    } catch (e) {
      throw ProviderErrors.EntityNotFound(identifier)
    }
  }

  async update(identifier: string, password: string, authType: AuthType): Promise<IAuthenticationResponse> {
    try {
      await this.authenticationRepository.update(
        {
          identifier: identifier
        },
        {
          identifier: identifier,
          password: password
        }
      )
      return await this.findOneByIdentifierAndAuthType(identifier, authType)
    } catch (e) {
      throw ProviderErrors.UpdateFailed(identifier)
    }
  }
}
