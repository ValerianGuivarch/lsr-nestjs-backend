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

  static CharacterAlreadyCreated(name: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'The character' + name + ' already exists',
      code: 'CHARACTER_ALREADY_CREATED'
    })
  }

  static RollNotEnoughPf(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.PRECONDITION_REQUIRED,
      message: 'Pas assez de Pf !',
      code: 'ROLL_NOT_ENOUGH_PF'
    })
  }

  static RollNotEnoughPv(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.PRECONDITION_REQUIRED,
      message: 'Pas assez de pv !',
      code: 'ROLL_NOT_ENOUGH_PV'
    })
  }

  static RollNotEnoughRelance(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.PRECONDITION_REQUIRED,
      message: 'Pas assez de relance !',
      code: 'ROLL_NOT_ENOUGH_RELANCE'
    })
  }

  static RollWrongEmpiricalRequest(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.PRECONDITION_REQUIRED,
      message: 'Erreur dans la requête empirique',
      code: 'ROLL_WRONG_EMPIRICAL_REQUEST'
    })
  }

  static RollNoPreviousRoll(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.PRECONDITION_REQUIRED,
      message: 'Pas de lancer de dé à relancer',
      code: 'ROLL_NO_PREVIOUS_ROLL'
    })
  }

  static RollNotEnoughPp(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.PRECONDITION_REQUIRED,
      message: 'Pas assez de Pp !',
      code: 'ROLL_NOT_ENOUGH_PP'
    })
  }

  static RollNotEnoughArcane(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.PRECONDITION_REQUIRED,
      message: "Pas assez d'arcane !",
      code: 'ROLL_NOT_ENOUGH_ARCANE'
    })
  }

  static RollNotEnoughDailyUse(): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.PRECONDITION_REQUIRED,
      message: 'utilisation journalières atteintes !',
      code: 'ROLL_NOT_ENOUGH_DAILY_USE'
    })
  }

  static EntityAlreadyExists(name: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.CONFLICT,
      message: 'Le personnage existe déjà !',
      code: 'CHARACTER_ALREADY_EXISTS'
    })
  }
}
