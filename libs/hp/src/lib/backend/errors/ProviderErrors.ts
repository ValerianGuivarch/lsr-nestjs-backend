import { GenericError } from '../domain/errors/GenericError'
import { HttpStatus } from '@nestjs/common'

export class ProviderErrors {
  static EntityNotFound(entityName: string): GenericError {
    return GenericError.of({
      statusCode: HttpStatus.NOT_FOUND,
      message: `This entity ${entityName} does not exist`,
      code: 'ENTITY_NOT_FOUND'
    })
  }
}
