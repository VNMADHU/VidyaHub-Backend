import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { logInfo, logError } from '../utils/logHelpers.js'

const prisma = new PrismaClient()

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

// Generate a simple token (for production, use JWT)
const generateToken = () => crypto.randomBytes(32).toString('hex')

export const login = async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body)
    logInfo(`Login attempt for email: ${payload.email}`, {
      filename: 'authController.js',
      line: 30,
      schoolId: 'system',
    })

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    })

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Check password (plaintext comparison — use bcrypt in production)
    if (user.password !== payload.password) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Check role matches
    if (user.role !== payload.role) {
      return res.status(401).json({
        message: `This account is not registered as "${payload.role}". Please select the correct role.`,
      })
    }

    const token = generateToken()

    logInfo(`Login successful for email: ${payload.email}`, {
      filename: 'authController.js',
      line: 52,
      schoolId: user.schoolId || 'system',
    })

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      },
      token,
    })
  } catch (error) {
    logError(`Login error: ${error.message}`, {
      filename: 'authController.js',
      line: 68,
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
