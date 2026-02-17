import { z } from 'zod'
import { logInfo, logError } from '../utils/logHelpers.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().min(2),
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  schoolName: z.string().min(2),
})

const otpSchema = z.object({
  email: z.string().email(),
})

export const login = (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || 'system'
    const payload = loginSchema.parse(req.body)
    logInfo(`Login attempt for email: ${payload.email}`, {
      filename: 'authController.js',
      line: 24,
      schoolId,
    })
    res.json({ message: 'Login request received', payload })
  } catch (error) {
    logError(`Login error: ${error.message}`, {
      filename: 'authController.js',
      line: 30,
      schoolId: req.body?.schoolId || 'system',
      stack: error.stack,
    })
    next(error)
  }
}

export const register = (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || 'system'
    const payload = registerSchema.parse(req.body)
    logInfo(`Registration attempt for school: ${payload.schoolName}`, {
      filename: 'authController.js',
      line: 41,
      schoolId,
    })
    res.status(201).json({ message: 'Registration request received', payload })
  } catch (error) {
    logError(`Registration error: ${error.message}`, {
      filename: 'authController.js',
      line: 47,
      schoolId: req.body?.schoolId || 'system',
      stack: error.stack,
    })
    next(error)
  }
}

export const requestOtp = (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || 'system'
    const payload = otpSchema.parse(req.body)
    logInfo(`OTP requested for email: ${payload.email}`, {
      filename: 'authController.js',
      line: 58,
      schoolId,
    })
    res.json({ message: 'OTP requested', payload })
  } catch (error) {
    logError(`OTP request error: ${error.message}`, {
      filename: 'authController.js',
      line: 64,
      schoolId: req.body?.schoolId || 'system',
      stack: error.stack,
    })
    next(error)
  }
}
