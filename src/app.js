import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import apiRouter from './routes/index.js'
import errorHandler from './middlewares/errorHandler.js'
import notFound from './middlewares/notFound.js'
import requestResponseLogger from './middlewares/requestResponseLogger.js'
import schoolIdMiddleware from './middlewares/schoolId.js'
import { setupSwagger } from './swagger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

// ── Security ────────────────────────────────────────────────
app.use(helmet())

// CORS — only the origins listed in CORS_ORIGIN (comma-separated) are allowed.
// Never fall back to wildcard '*' in production; use localhost for dev only.
const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000,http://localhost:5002'
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Electron, curl in dev)
      if (!origin) return callback(null, true)
      // Wildcard — allow all (used by Electron desktop build)
      if (allowedOrigins.includes('*')) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      return callback(new Error(`CORS: origin '${origin}' is not allowed`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-School-Id'],
  }),
)
app.use(express.json({ limit: '1mb' }))

// ── School ID extraction ────────────────────────────────────
app.use(schoolIdMiddleware)

// Disable X-Powered-By for security
app.disable('x-powered-by')

// ── Logging ─────────────────────────────────────────────────
app.use(requestResponseLogger)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

// ── Health check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'vidya-hub-backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// ── API routes ──────────────────────────────────────────────
app.use('/api', apiRouter)

// ── Swagger docs ────────────────────────────────────────────
setupSwagger(app)

// ── Serve built React frontend (desktop/offline mode) ────────
// DIST_PATH env var is set by Electron; fall back to the conventional path
const distPath = process.env.DIST_PATH || path.resolve(__dirname, '../../dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  // All non-API routes → serve React app (handles React Router)
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// ── 404 & Error handling ────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

export default app
