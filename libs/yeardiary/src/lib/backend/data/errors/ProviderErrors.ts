import { GenericError } from '../../domain/errors/GenericError'
import { HttpStatus } from '@nestjs/common'

export class ProviderErrors {
  static ExpiredToken(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'The token has expired. Please refresh token',
      code: 'EXPIRED_TOKEN'
    })
  }

  static WrongToken(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'This token is wrong. Please login',
      code: 'WRONG_TOKEN'
    })
  }

  static WrongCredentials(msg?: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: `The credentials are not correct ${msg ? '(' + msg + ')' : ''}`,
      code: 'WRONG_CREDENTIALS'
    })
  }

  static Unauthorized(message: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: message,
      code: 'UNAUTHORIZED'
    })
  }

  static Forbidden(message: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.FORBIDDEN,
      message: message,
      code: 'FORBIDDEN'
    })
  }

  static IdentifierAlreadyUsed(identifier: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.CONFLICT,
      message: `Identifier already used: ${identifier}`,
      code: 'IDENTIFIER_ALREADY_USED'
    })
  }

  static NameAlreadyUsed(name: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.CONFLICT,
      message: `Name already used: ${name}`,
      code: 'NAME_ALREADY_USED'
    })
  }

  static EntityNotFound(entityName: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.NOT_FOUND,
      message: `This entity ${entityName} does not exist`,
      code: 'ENTITY_NOT_FOUND'
    })
  }

  static AccountAlreadyCreated(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'This email is already used by a created account',
      code: 'ACCOUNT_ALREADY_CREATED'
    })
  }

  static AuthenticationCreationFailed(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Authentication creation failed',
      code: 'ENTITY_CREATION_FAILED'
    })
  }

  static UpdateFailed(entity: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: `Authentication update failed ${entity}`,
      code: 'ENTITY_UPDATE_FAILED'
    })
  }

  static UploadImageToCloudinaryFailed(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Image Upload to cloudinary failed',
      code: 'UPLOAD_FAILED'
    })
  }

  static wrongEnumType(type: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: `An unknown enum type has been encountered : ${type}`,
      code: 'WRONG_ENUM_TYPE'
    })
  }

  static accountNotCreated(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: `The creation has failed`,
      code: 'ACCOUNT_CREATION_FAILED'
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
