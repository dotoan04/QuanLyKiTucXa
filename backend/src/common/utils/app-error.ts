export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: unknown

  constructor(code: string, message: string, statusCode: number, details?: unknown) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.name = 'AppError'

    Error.captureStackTrace(this, this.constructor)
  }

  static notFound(resource: string = 'Resource') {
    return new AppError('NOT_FOUND', `${resource} not found`, 404)
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError('BAD_REQUEST', message, 400, details)
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new AppError('UNAUTHORIZED', message, 401)
  }

  static forbidden(message: string = 'Forbidden') {
    return new AppError('FORBIDDEN', message, 403)
  }

  static conflict(message: string) {
    return new AppError('CONFLICT', message, 409)
  }

  static internal(message: string = 'Internal server error') {
    return new AppError('INTERNAL_ERROR', message, 500)
  }
}
