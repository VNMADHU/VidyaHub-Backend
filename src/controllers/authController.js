import { z } from 'zod'
import bcrypt from 'bcrypt'
import prisma from '../utils/prisma.js'
import { signToken } from '../utils/jwt.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const SALT_ROUNDS = 12

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().min(2),
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  schoolName: z.string().min(2),
})

const otpSchema = z.object({
  email: z.string().email(),
})

export const login = async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body)
    logInfo(`Login attempt for email: ${payload.email}`, {
      filename: 'authController.js',
      line: 28,
      schoolId: 'system',
    })

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: payload.email },
    })

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Compare hashed password
    const passwordMatch = await bcrypt.compare(payload.password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Check role matches
    if (user.role !== payload.role) {
      return res.status(401).json({
        message: `This account is not registered as "${payload.role}". Please select the correct role.`,
      })
    }

    // Sign JWT
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    })

    logInfo(`Login successful for email: ${payload.email}`, {
      filename: 'authController.js',
      line: 58,
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
      line: 74,
      schoolId: req.body?.schoolId || 'system',
      stack: error.stack,
    })
    next(error)
  }
}

export const register = async (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || 'system'
    const payload = registerSchema.parse(req.body)
    logInfo(`Registration attempt for school: ${payload.schoolName}`, {
      filename: 'authController.js',
      line: 88,
      schoolId,
    })

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: payload.email },
    })
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(payload.password, SALT_ROUNDS)

    // Create school + user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name: payload.schoolName,
          address: 'Not provided',
          contact: 'Not provided',
          principal: 'Not provided',
          boardType: 'CBSE',
          status: 'pending',
        },
      })

      const user = await tx.user.create({
        data: {
          email: payload.email,
          password: hashedPassword,
          role: 'school-admin',
          schoolId: school.id,
          profile: {
            create: {
              firstName: 'Admin',
              lastName: 'User',
            },
          },
        },
      })

      return { school, user }
    })

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        schoolId: result.school.id,
      },
    })
  } catch (error) {
    logError(`Registration error: ${error.message}`, {
      filename: 'authController.js',
      line: 135,
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
