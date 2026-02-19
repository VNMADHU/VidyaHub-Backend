import rateLimit from 'express-rate-limit'

const AUTH_WINDOW = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000
const AUTH_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX) || 10
const API_WINDOW = Number(process.env.API_RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000
const API_MAX = Number(process.env.API_RATE_LIMIT_MAX) || 200

/**
 * Strict rate limiter for auth endpoints (login, register, otp)
 */
export const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW,
  max: AUTH_MAX,
  message: {
    message: `Too many login attempts. Please try again after ${Math.round(AUTH_WINDOW / 60000)} minutes.`,
  },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
})

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: API_WINDOW,
  max: API_MAX,
  message: {
    message: 'Too many requests. Please slow down and try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
