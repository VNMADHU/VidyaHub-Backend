import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import apiRouter from './routes/index.js'
import errorHandler from './middlewares/errorHandler.js'
import notFound from './middlewares/notFound.js'
import requestResponseLogger from './middlewares/requestResponseLogger.js'
import { logInfo, logError } from './utils/logHelpers.js'

dotenv.config()

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(requestResponseLogger)
app.use(morgan('dev'))

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'vidya-hub-backend' })
})

app.use('/api', apiRouter)

app.use(notFound)
app.use(errorHandler)

const port = process.env.PORT || 5000
app.listen(port, () => {
  logInfo(`Vidya Hub API running on port ${port}`, {
    filename: 'index.js',
    line: 34,
    schoolId: 'system',
  })
})

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at ${promise}: ${reason}`, {
    filename: 'index.js',
    line: 40,
    schoolId: 'system',
    stack: reason?.stack,
  })
})
