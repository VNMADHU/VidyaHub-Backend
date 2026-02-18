import { logError } from '../utils/logHelpers.js'

const errorHandler = (error, req, res, _next) => {
  // Log every error centrally
  logError(`[${req.method}] ${req.originalUrl} → ${error.message}`, {
    filename: 'errorHandler.js',
    schoolId: req.body?.schoolId || req.headers['x-school-id'] || 'system',
    stack: error.stack,
  })

  // Zod validation errors
  if (error?.issues) {
    return res.status(400).json({
      message: 'Validation error',
      issues: error.issues.map((issue) => ({
        field: issue.path?.join('.') || 'unknown',
        message: issue.message,
      })),
    })
  }

  // Prisma known errors
  if (error?.code) {
    switch (error.code) {
      case 'P2002':
        return res.status(409).json({
          message: `A record with that ${error.meta?.target?.join(', ') || 'value'} already exists.`,
        })
      case 'P2025':
        return res.status(404).json({
          message: 'Record not found.',
        })
      case 'P2003':
        return res.status(400).json({
          message: 'Cannot perform this action because related records exist.',
        })
      default:
        break
    }
  }

  // SyntaxError (malformed JSON body)
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({
      message: 'Invalid JSON in request body.',
    })
  }

  // Default to 500
  const statusCode = error.statusCode || 500
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Unexpected server error'
      : error.message || 'Unexpected server error'

  return res.status(statusCode).json({ message })
}

export default errorHandler
