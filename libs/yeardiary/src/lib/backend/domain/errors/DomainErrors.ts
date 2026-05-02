import { GenericError } from './GenericError'
import { HttpStatus } from '@nestjs/common'

export class DomainErrors {
  static AccountCreationFailed(identifier: string, status: HttpStatus, message: string): GenericError {
    return GenericError.of({
      statusCode: status,
      message: message,
      code: 'ACCOUNT_CREATION_FAILED'
    })
  }

  static FindHomePageFailed(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.NOT_FOUND,
      message: `Find Home Page Failed`,
      code: 'FIND_HOMEPAGE_FAILED'
    })
  }

  static ConnexionFailedAccountNotFound(identifier: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: `Account not found for identifier: ${identifier}`,
      code: 'CONNEXION_FAILED_ACCOUNT_NOT_FOUND'
    })
  }

  static UploadCharacterPictureFailed(message: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: `Impossible to upload the character picture because ${message}`,
      code: 'UPLOAD_IMPOSSIBLE'
    })
  }

  static characterHasAlreadyActed(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.FORBIDDEN,
      message: `Impossible to act, the character already acted this turn`,
      code: 'CHARACTER_ALREADY_ACTED'
    })
  }

  static actingCharacterNotInBattle(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.FORBIDDEN,
      message: `Impossible to act, the character is not in the battle`,
      code: 'CHARACTER_NOT_IN_BATTLE'
    })
  }

  static targetCharacterNotInBattle(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.FORBIDDEN,
      message: `Impossible to act, the character is not in the battle`,
      code: 'CHARACTER_NOT_IN_BATTLE'
    })
  }

  static GoogleRefreshTokenNotFound(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: `Google refresh token not found`,
      code: 'GOOGLE_REFRESH_TOKEN_NOT_FOUND'
    })
  }

  static emailAlreadyExistsInSalesforce(email: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.CONFLICT,
      message: `Email ${email} already exists in Salesforce`,
      code: 'EMAIL_ALREADY_EXISTS_IN_SALESFORCE'
    })
  }

  static validateInitPasswordFailed(message: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.NOT_FOUND,
      message: `THe validation has failed because of ${message}`,
      code: 'VALIDATE_INIT_PASSWORD_FAILED'
    })
  }

  static noAccountWithEmail(email: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.NOT_FOUND,
      message: `Account not found for email: ${email}`,
      code: 'NO_ACCOUNT_WITH_EMAIL'
    })
  }

  static ConnexionFailedAccountNotActive(email: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: `Account not active for identifier: ${email}`,
      code: 'CONNEXION_FAILED_ACCOUNT_NOT_ACTIVE'
    })
  }

  static validateAccountEmailCreationFailed(message: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.NOT_FOUND,
      message: `THe validation has failed because of ${message}`,
      code: 'VALIDATE_ACCOUNT_EMAIL_FAILED'
    })
  }

  static ConnexionFailedAccountNotAuthenticationByEmail(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: `This account doesn ot have an authentication method by email`,
      code: 'CONNEXION_FAILED_ACCOUNT_NOT_AUTHENTICATION_BY_EMAIL'
    })
  }

  static wrongCredentials(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: `Wrong credentials`,
      code: 'WRONG_CREDENTIALS'
    })
  }

  static WrongToken(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'This token is wrong. Please login',
      code: 'WRONG_TOKEN'
    })
  }

  static ExpiredToken(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'The token has expired. Please refresh token',
      code: 'EXPIRED_TOKEN'
    })
  }

  static ExpiredTokenEmail(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'The token has expired. Please contact us to have a new one',
      code: 'EXPIRED_TOKEN_EMAIL'
    })
  }
}
