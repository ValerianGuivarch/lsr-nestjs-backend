import { HttpException, HttpStatus } from '@nestjs/common'

export class JdrError extends HttpException {
  statusCode: number
  code: string

  constructor(p: { message: string; code: string; statusCode: number }) {
    super({ message: p.message, code: p.code }, p.statusCode)
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
