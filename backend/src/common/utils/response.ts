import { Response } from 'express'

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface ErrorApiResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  }
  return res.status(statusCode).json(response)
}

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  extraMeta?: Record<string, unknown>
) => {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      ...(extraMeta || {})
    }
  }
  return res.status(200).json(response)
}

export const sendError = (
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: unknown
) => {
  const errorPayload: ErrorApiResponse['error'] = {
    code,
    message
  }

  if (details !== undefined) {
    errorPayload.details = details
  }

  const response: ErrorApiResponse = {
    success: false,
    error: errorPayload
  }
  return res.status(statusCode).json(response)
}

export const sendCreated = <T>(res: Response, data: T, message?: string) => {
  return sendSuccess(res, data, message, 201)
}

export const sendNoContent = (res: Response) => {
  return res.status(204).send()
}
