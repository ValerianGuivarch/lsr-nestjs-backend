import { HttpStatus } from '@nestjs/common'

export class JdrError extends Error {
  statusCode: number
  code: string

  constructor(p: { message: string; code: string; statusCode: number }) {
    super(p.message)
    this.statusCode = p.statusCode
    this.code = p.code
  }

  static notFound(entityName: string): JdrError {
    return new JdrError({
      statusCode: HttpStatus.NOT_FOUND,
      message: `${entityName} not found`,
      code: 'NOT_FOUND'
    })
  }

  static conflict(message: string): JdrError {
    return new JdrError({
      statusCode: HttpStatus.CONFLICT,
      message,
      code: 'CONFLICT'
    })
  }
}
