import { GenericError } from './GenericError'
import { AuthType } from '../models/auth/AuthType'
import { HttpStatus } from '@nestjs/common'

export class DomainErrors {
  static AccountCreationFailed(identifier: string, status: HttpStatus, message: string): GenericError {
    return GenericError.of({
      statusCode: status,
      message: message,
      code: 'ACCOUNT_CREATION_FAILED'
    })
  }

  static AuthenticationAlreadyExisting(identifier: string, authType: AuthType): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: `An authorization already exist with identifier ${identifier} and authType ${authType}`,
      code: 'ALREADY_EXISTING_AUTHENTICATION'
    })
  }

  static FindHomePageFailed(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.NOT_FOUND,
      message: `Find Home Page Failed`,
      code: 'FIND_HOMEPAGE_FAILED'
    })
  }
}
