export class GenericError extends Error {
  statusCode: number
  code: string

  constructor(p: { message: string; code: string; statusCode: number }) {
    super(p.message)
    this.statusCode = p.statusCode
    this.code = p.code
  }

  static of(p: { message: string; code: string; statusCode: number }): GenericError {
    return new GenericError(p)
  }
}
