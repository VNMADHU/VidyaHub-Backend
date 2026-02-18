import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import apiRouter from './routes/index.js'
import errorHandler from './middlewares/errorHandler.js'
import notFound from './middlewares/notFound.js'
import requestResponseLogger from './middlewares/requestResponseLogger.js'
import { setupSwagger } from './swagger.js'

const app = express()

// ── Security ────────────────────────────────────────────────
app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-School-Id'],
  }),
)
app.use(express.json({ limit: '1mb' }))

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

// ── 404 & Error handling ────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

export default app
