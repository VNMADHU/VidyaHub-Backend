import winston from 'winston'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    ({ timestamp, level, message, filename, line, schoolId, stack }) => {
      const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        filename: filename || 'unknown',
        line: line || 0,
        schoolId: schoolId || 'system',
        message,
      }
      if (stack) {
        logEntry.stack = stack
      }
      return JSON.stringify(logEntry)
    },
  ),
)

const logger = winston.createLogger({
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, filename, line, schoolId }) =>
            `[${timestamp}] ${level} [${filename}:${line}] [${schoolId}] ${message}`,
        ),
      ),
    }),
  ],
})

export default logger
