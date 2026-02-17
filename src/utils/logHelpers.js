import logger from './logger.js'

export const logInfo = (message, context = {}) => {
  logger.info(message, {
    filename: context.filename || 'unknown',
    line: context.line || 0,
    schoolId: context.schoolId || 'system',
  })
}

export const logWarning = (message, context = {}) => {
  logger.warn(message, {
    filename: context.filename || 'unknown',
    line: context.line || 0,
    schoolId: context.schoolId || 'system',
  })
}

export const logError = (message, context = {}) => {
  logger.error(message, {
    filename: context.filename || 'unknown',
    line: context.line || 0,
    schoolId: context.schoolId || 'system',
    stack: context.stack,
  })
}

export const logCritical = (message, context = {}) => {
  logger.error(message, {
    filename: context.filename || 'unknown',
    line: context.line || 0,
    schoolId: context.schoolId || 'system',
    stack: context.stack,
  })
}
