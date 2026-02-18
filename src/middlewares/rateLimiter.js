import rateLimit from 'express-rate-limit'

/**
 * Strict rate limiter for auth endpoints (login, register, otp)
 * 10 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,
})

/**
 * General API rate limiter
 * 200 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    message: 'Too many requests. Please slow down and try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})
