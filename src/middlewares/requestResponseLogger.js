import { logInfo, logError } from '../utils/logHelpers.js'

export const requestResponseLogger = (req, res, next) => {
  const startTime = Date.now()
  const schoolId = req.header('X-School-Id') || req.body?.schoolId || 'system'

  const stack = new Error().stack
  const stackLines = stack.split('\n')
  const callerLine = stackLines[3]?.match(/:(\d+):\d+/)?.[1] || 0

  logInfo(`[REQUEST] ${req.method} ${req.path}`, {
    filename: req.path,
    line: parseInt(callerLine),
    schoolId,
  })

  const originalJson = res.json

  res.json = function (data) {
    const duration = Date.now() - startTime
    const statusCode = res.statusCode

    logInfo(`[RESPONSE] ${req.method} ${req.path} - ${statusCode} (${duration}ms)`, {
      filename: req.path,
      line: parseInt(callerLine),
      schoolId,
    })

    return originalJson.call(this, data)
  }

  res.on('error', (error) => {
    logError(`[ERROR] ${req.method} ${req.path} - ${error.message}`, {
      filename: req.path,
      line: parseInt(callerLine),
      schoolId,
      stack: error.stack,
    })
  })

  next()
}

export default requestResponseLogger
