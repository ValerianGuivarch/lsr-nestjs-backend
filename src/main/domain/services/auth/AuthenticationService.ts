import { ProviderErrors } from '../../../data/errors/ProviderErrors'
import { DomainErrors } from '../../errors/DomainErrors'
import { comparePasswordPromise, hashPromise } from '../../helpers/bcrypt/BcryptHelpers'
import { Account } from '../../models/account/Account'
import { Profile } from '../../models/account/Profile'
import { Authority } from '../../models/auth/Authority'
import { AuthType } from '../../models/auth/AuthType'
import { JWTToken } from '../../models/auth/JWTToken'
import { IAuthenticationProvider } from '../../providers/authentication/IAuthenticationProvider'
import { IAccountProvider } from '../../providers/IAccountProvider'
import { IProfileProvider } from '../../providers/IProfileProvider'
import { ITokenProvider } from '../../providers/ITokenProvider'
import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name)
  constructor(
    @Inject('IProfileProvider')
    private profileProvider: IProfileProvider,
    @Inject('IAccountProvider')
    private accountProvider: IAccountProvider,
    @Inject('ITokenProvider')
    private tokenProvider: ITokenProvider,
    @Inject('IAuthenticationProvider')
    private authenticationProvider: IAuthenticationProvider
  ) {
    console.log('AuthenticationService')
  }

  generateFourNumbersCode(): string {
    return (
      // eslint-disable-next-line no-magic-numbers
      Math.floor(Math.random() * 10000)
        .toString()
        // eslint-disable-next-line no-magic-numbers
        .padStart(4, '0')
    )
  }

  async register(p: {
    identifier: string
    password: string
    authority?: Authority
    authType: AuthType
  }): Promise<{ account: Account; profile: Profile }> {
    if (await this.authenticationProvider.exist(p.identifier, p.authType)) {
      throw DomainErrors.AuthenticationAlreadyExisting(p.identifier, p.authType)
    }
    try {
      const account = await this.accountProvider.create(
        await Account.accountToCreateFactory({
          authority: p.authority || Authority.USER
        })
      )
      const profile = await this.profileProvider.create(new Profile({ accountId: account.id }))
      await this.authenticationProvider.create(
        p.identifier,
        // eslint-disable-next-line no-magic-numbers
        await hashPromise(p.password ?? '', 10),
        p.authType,
        account.id
      )
      this.logger.log(`register > Account[${account.id}] > Profile[${profile.id}]`)
      return { account: account, profile: profile }
    } catch (e) {
      throw DomainErrors.AccountCreationFailed(p.identifier, e.statusCode, e.message)
    }
  }

  async signInWithEmailAndPassword(p: { email: string; password: string }): Promise<JWTToken> {
    const authentication = await this.authenticationProvider.findOneByIdentifierAndAuthType(
      p.email,
      AuthType.EMAIL_PASSWORD
    )
    if (!authentication?.password || !(await comparePasswordPromise(p.password, authentication.password))) {
      throw new UnauthorizedException()
    } else {
      const account = await this.accountProvider.findById(authentication.accountId)
      return this.tokenProvider.generateTokens({
        accountId: account.id,
        secret: account.secret,
        authority: account.authority
      })
    }
  }

  async refreshToken(refreshToken: string): Promise<JWTToken> {
    const auth = await this.tokenProvider.unpackToken(refreshToken)
    if (!auth.isRefreshToken) {
      throw ProviderErrors.WrongToken()
    }
    const account = await this.accountProvider.findById(auth.subject)
    await this.tokenProvider.verifyToken(refreshToken, account.secret)
    return this.tokenProvider.generateTokens({
      accountId: account.id,
      secret: account.secret,
      authority: account.authority
    })
  }

  async getConnectedAccount(accessToken: string): Promise<Account> {
    const auth = await this.tokenProvider.unpackToken(accessToken)
    if (auth.isRefreshToken) {
      throw ProviderErrors.WrongToken()
    }
    const account = await this.accountProvider.findById(auth.subject)
    await this.tokenProvider.verifyToken(accessToken, account.secret)
    return account
  }
}
