import 'dotenv/config' // Side-effect import — loads env vars before all other modules

import app from './app.js'
import { logInfo, logError } from './utils/logHelpers.js'

// ── Environment validation ──────────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET']
const missing = REQUIRED_ENV.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error(`❌ Missing required env vars: ${missing.join(', ')}`)
  process.exit(1)
}

// ── Start server ────────────────────────────────────────────
const port = process.env.PORT || 5001
const server = app.listen(port, () => {
  logInfo(`Vidya Hub API running on port ${port} [${process.env.NODE_ENV || 'development'}]`, {
    filename: 'index.js',
    line: 55,
    schoolId: 'system',
  })
})

// ── Graceful shutdown ───────────────────────────────────────
const shutdown = (signal) => {
  logInfo(`${signal} received — shutting down gracefully`, {
    filename: 'index.js',
    line: 63,
    schoolId: 'system',
  })
  server.close(() => {
    logInfo('HTTP server closed', { filename: 'index.js', line: 68, schoolId: 'system' })
    process.exit(0)
  })
  // Force exit after 10s if connections won't close
  setTimeout(() => process.exit(1), 10000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection: ${reason}`, {
    filename: 'index.js',
    line: 78,
    schoolId: 'system',
    stack: reason?.stack,
  })
})

process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`, {
    filename: 'index.js',
    line: 86,
    schoolId: 'system',
    stack: error.stack,
  })
  process.exit(1)
})
