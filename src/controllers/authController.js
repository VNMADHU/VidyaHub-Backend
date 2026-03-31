import { z } from 'zod'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import prisma from '../utils/prisma.js'
import { signToken } from '../utils/jwt.js'
import { logInfo, logError } from '../utils/logHelpers.js'
import { sendSMS, buildOtpSms } from '../services/smsService.js'

const SALT_ROUNDS = 12
const OTP_EXPIRY_MINUTES = 10
const VERIFY_EXPIRY_MINUTES = 30
const RESET_EXPIRY_MINUTES = 15
const MAX_OTP_ATTEMPTS = 3   // wrong OTP entries before 1-hour account lock
const MAX_OTP_RESENDS = 3    // resend requests before 1-hour account lock
const LOCK_DURATION_HOURS = 1

// ── Helpers ─────────────────────────────────────────────────

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000))

const maskEmail = (email) => {
  const [local, domain] = email.split('@')
  const visible = local.slice(0, 2)
  const masked = '*'.repeat(Math.max(2, local.length - 2))
  return `${visible}${masked}@${domain}`
}

const maskPhone = (phone) => {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  return `XXXXX${digits.slice(-4)}`
}

const getClientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.socket?.remoteAddress ||
  'unknown'

const parseModulePermissions = (raw) => {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

// Returns a human-readable remaining lock message, or null if not locked
const getLockMessage = (lockedUntil) => {
  if (!lockedUntil) return null
  const remaining = lockedUntil - Date.now()
  if (remaining <= 0) return null
  const mins = Math.ceil(remaining / 60000)
  return `Account is temporarily locked. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`
}

const buildUserResponse = (user) => ({
  id: String(user.id),
  email: user.email,
  role: user.role,
  schoolId: user.schoolId ? String(user.schoolId) : null,
  phone: user.phone ?? null,
  modulePermissions: parseModulePermissions(user.modulePermissions),
  feeCanEdit: user.feeCanEdit ?? false,
  feeCanDelete: user.feeCanDelete ?? false,
  profile: user.profile ?? null,
  isEmailVerified: user.isEmailVerified,
  isPhoneVerified: user.isPhoneVerified,
})

// ── Validation schemas ───────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  schoolName: z.string().min(2),
  address: z.string().min(4).optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  isFreeTrail: z.boolean().optional().default(true),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
})

// ── Step 1: Verify credentials → generate and send OTP ───────
// (Email templates removed — SMS-only mode)

// ── Step 1: Verify credentials → generate and send OTP ───────

export const login = async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body)
    const clientIp = getClientIp(req)

    logInfo(`Login attempt: ${payload.email}`, { filename: 'authController.js', schoolId: 'system' })

    const user = await prisma.user.findFirst({
      where: { email: payload.email },
      include: { profile: true },
    })

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (!['super-admin', 'school-admin', 'owner'].includes(user.role)) {
      return res.status(403).json({
        message: 'This login is for administrators only. Please use the portal login.',
      })
    }

    // ── Account lockout check ─────────────────────────────────
    const lockMsg = getLockMessage(user.accountLockedUntil)
    if (lockMsg) {
      return res.status(423).json({ message: lockMsg, accountLocked: true, lockedUntil: user.accountLockedUntil })
    }

    // ── Check password FIRST (before verification checks) ────
    const passwordMatch = await bcrypt.compare(payload.password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // ── Block suspended accounts ──────────────────────────────
    if (user.accountStatus === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact your school administrator.' })
    }

    const displayName = user.profile?.firstName || 'Admin'

    // ── Phone not verified → send fresh OTP and prompt ───────
    if (user.phone && !user.isPhoneVerified) {
      const phoneOtp = generateOtp()
      const otpExpiry = new Date(Date.now() + VERIFY_EXPIRY_MINUTES * 60 * 1000)
      await prisma.user.update({
        where: { id: user.id },
        data: { otpCode: phoneOtp, otpExpiry },
      })
      try {
        await sendSMS({ to: user.phone, message: buildOtpSms(phoneOtp) })
      } catch (smsErr) {
        logError(`Phone verify SMS failed: ${smsErr.message}`, { filename: 'authController.js' })
      }
      return res.status(403).json({
        message: 'Please verify your mobile number before logging in. A new OTP has been sent.',
        needsPhoneVerification: true,
        email: user.email,
        maskedPhone: maskPhone(user.phone),
      })
    }

    // ── Single-session enforcement ────────────────────────────
    if (user.activeSessionId) {
      return res.status(200).json({
        sessionConflict: true,
        message: 'You are already logged in on another device.',
        maskedEmail: maskEmail(user.email),
        maskedPhone: maskPhone(user.phone),
      })
    }

    // ── MFA disabled → issue token immediately ────────────────
    if (!user.mfaPhone) {
      const sessionId = randomUUID()
      await prisma.user.update({
        where: { id: user.id },
        data: { activeSessionId: sessionId, lastLoginIp: clientIp, lastLoginAt: new Date() },
      })
      const token = signToken({ id: user.id, role: user.role, schoolId: user.schoolId, sessionId })
      logInfo(`Direct login (MFA disabled): ${payload.email}`, { filename: 'authController.js', schoolId: String(user.schoolId || 'system') })
      return res.json({ token, user: buildUserResponse({ ...user, activeSessionId: sessionId }) })
    }

    // ── Generate OTP ──────────────────────────────────────────
    const otp = generateOtp()
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpiry, otpAttempts: 0, otpResendCount: 0, accountLockedUntil: null, lastLoginIp: clientIp, lastLoginAt: new Date() },
    })

    if (user.mfaPhone && user.phone) {
      try {
        await sendSMS({
          to: user.phone,
          message: buildOtpSms(otp),
        })
      } catch (smsErr) {
        logError(`OTP SMS failed: ${smsErr.message}`, { filename: 'authController.js' })
      }
    }

    logInfo(`OTP sent: ${payload.email} | IP: ${clientIp}`, {
      filename: 'authController.js',
      schoolId: String(user.schoolId || 'system'),
    })

    res.json({
      message: 'OTP sent to your registered phone',
      otpSent: true,
      maskedPhone: user.mfaPhone ? maskPhone(user.phone) : null,
    })
  } catch (error) {
    logError(`Login error: ${error.message}`, { filename: 'authController.js', stack: error.stack })
    next(error)
  }
}

// ── Force Login: override existing session ────────────────────

export const forceLogin = async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body)
    const clientIp = getClientIp(req)

    const user = await prisma.user.findFirst({
      where: { email: payload.email },
      include: { profile: true },
    })

    if (!user || !['super-admin', 'school-admin', 'owner'].includes(user.role)) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // ── Account lockout check ─────────────────────────────────
    const lockMsg = getLockMessage(user.accountLockedUntil)
    if (lockMsg) {
      return res.status(423).json({ message: lockMsg, accountLocked: true, lockedUntil: user.accountLockedUntil })
    }

    const passwordMatch = await bcrypt.compare(payload.password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const displayName = user.profile?.firstName || 'Admin'

    // ── MFA disabled → terminate old session and issue token immediately ──
    if (!user.mfaPhone) {
      const sessionId = randomUUID()
      await prisma.user.update({
        where: { id: user.id },
        data: { activeSessionId: sessionId, lastLoginIp: clientIp, lastLoginAt: new Date() },
      })
      const token = signToken({ id: user.id, role: user.role, schoolId: user.schoolId, sessionId })
      logInfo(`Force-login direct (MFA disabled): ${payload.email}`, { filename: 'authController.js' })
      return res.json({ token, user: buildUserResponse({ ...user, activeSessionId: sessionId }) })
    }

    const otp = generateOtp()
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { activeSessionId: null, otpCode: otp, otpExpiry, otpAttempts: 0, otpResendCount: 0, accountLockedUntil: null, lastLoginIp: clientIp, lastLoginAt: new Date() },
    })

    if (user.mfaPhone && user.phone) {
      try {
        await sendSMS({
          to: user.phone,
          message: buildOtpSms(otp),
        })
      } catch { /* ignore */ }
    }

    logInfo(`Force-login OTP sent: ${payload.email} | IP: ${clientIp}`, { filename: 'authController.js' })

    res.json({
      message: 'Previous session terminated. OTP sent to your phone.',
      otpSent: true,
      maskedPhone: user.mfaPhone && user.phone ? maskPhone(user.phone) : null,
    })
  } catch (error) {
    logError(`Force login error: ${error.message}`, { filename: 'authController.js' })
    next(error)
  }
}

// ── Step 2: Verify OTP → issue JWT with sessionId ────────────

export const verifyOtp = async (req, res, next) => {
  try {
    const payload = verifyOtpSchema.parse(req.body)

    const user = await prisma.user.findFirst({
      where: { email: payload.email },
      include: { profile: true },
    })

    if (!user) {
      return res.status(401).json({ message: 'Invalid OTP or email' })
    }

    if (!user.otpCode || !user.otpExpiry) {
      return res.status(400).json({
        message: 'No pending OTP found. Please go back and sign in again.',
      })
    }

    // ── Account lockout check ─────────────────────────────────
    const lockMsg = getLockMessage(user.accountLockedUntil)
    if (lockMsg) {
      return res.status(423).json({ message: lockMsg, accountLocked: true, lockedUntil: user.accountLockedUntil })
    }

    if (new Date() > user.otpExpiry) {
      await prisma.user.update({ where: { id: user.id }, data: { otpCode: null, otpExpiry: null, otpAttempts: 0, otpResendCount: 0 } })
      return res.status(400).json({
        message: 'OTP has expired. Please go back and sign in again to get a new OTP.',
      })
    }

    if (user.otpCode !== payload.otp) {
      const newAttempts = (user.otpAttempts ?? 0) + 1

      if (newAttempts >= MAX_OTP_ATTEMPTS) {
        // Lock account for 1 hour
        const lockedUntil = new Date(Date.now() + LOCK_DURATION_HOURS * 60 * 60 * 1000)
        await prisma.user.update({
          where: { id: user.id },
          data: {
            otpCode: null,
            otpExpiry: null,
            otpAttempts: 0,
            otpResendCount: 0,
            accountLockedUntil: lockedUntil,
          },
        })
        logError(`Account locked (wrong OTP x3): ${payload.email}`, { filename: 'authController.js' })
        return res.status(423).json({
          message: `Too many incorrect OTP attempts. Your account has been locked for ${LOCK_DURATION_HOURS} hour. Try again after ${lockedUntil.toLocaleTimeString()}.`,
          accountLocked: true,
          lockedUntil,
        })
      }

      await prisma.user.update({ where: { id: user.id }, data: { otpAttempts: newAttempts } })
      const attemptsLeft = MAX_OTP_ATTEMPTS - newAttempts
      return res.status(401).json({
        message: `Incorrect OTP. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before account is locked.`,
        attemptsLeft,
      })
    }

    const sessionId = randomUUID()

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiry: null, otpAttempts: 0, otpResendCount: 0, accountLockedUntil: null, activeSessionId: sessionId },
    })

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      modulePermissions: user.modulePermissions,
      sessionId,
    })

    logInfo(`Login successful: ${payload.email} | session: ${sessionId}`, {
      filename: 'authController.js',
      schoolId: String(user.schoolId || 'system'),
    })

    res.json({
      message: 'Login successful',
      user: buildUserResponse(user),
      token,
    })
  } catch (error) {
    logError(`Verify OTP error: ${error.message}`, { filename: 'authController.js', stack: error.stack })
    next(error)
  }
}

// ── Resend OTP ───────────────────────────────────────────────

export const resendOtp = async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body)

    const user = await prisma.user.findFirst({ where: { email }, include: { profile: true } })

    if (!user || !['super-admin', 'school-admin', 'owner'].includes(user.role)) {
      return res.json({ message: 'If this email exists, a new OTP has been sent.', otpSent: true })
    }

    // ── Account lockout check ─────────────────────────────────
    const lockMsg = getLockMessage(user.accountLockedUntil)
    if (lockMsg) {
      return res.status(423).json({ message: lockMsg, accountLocked: true, lockedUntil: user.accountLockedUntil })
    }

    // ── Resend-abuse lock: max 3 resends per OTP session ──────
    const currentResends = user.otpResendCount ?? 0
    if (currentResends >= MAX_OTP_RESENDS) {
      const lockedUntil = new Date(Date.now() + LOCK_DURATION_HOURS * 60 * 60 * 1000)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode: null,
          otpExpiry: null,
          otpAttempts: 0,
          otpResendCount: 0,
          accountLockedUntil: lockedUntil,
        },
      })
      logError(`Account locked (resend limit x3): ${email}`, { filename: 'authController.js' })
      return res.status(423).json({
        message: `Too many OTP requests. Your account has been locked for ${LOCK_DURATION_HOURS} hour. Try again after ${lockedUntil.toLocaleTimeString()}.`,
        accountLocked: true,
        lockedUntil,
      })
    }

    const otp = generateOtp()
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiry, otpAttempts: 0, otpResendCount: currentResends + 1 } })

    if (user.phone) {
      try {
        await sendSMS({
          to: user.phone,
          message: buildOtpSms(otp),
        })
      } catch { /* ignore */ }
    }

    logInfo(`OTP resent for: ${email}`, { filename: 'authController.js' })
    res.json({ message: 'New OTP sent to your registered phone.', otpSent: true })
  } catch (error) {
    logError(`Resend OTP error: ${error.message}`, { filename: 'authController.js' })
    next(error)
  }
}

// ── Logout ────────────────────────────────────────────

export const logout = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { activeSessionId: null },
    })
    logInfo(`Logout: ${req.user.email}`, { filename: 'authController.js' })
    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    logError(`Logout error: ${error.message}`, { filename: 'authController.js' })
    next(error)
  }
}

// ── Session Check (polls every 30s from frontend) ───────────

export const sessionCheck = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { activeSessionId: true },
    })
    if (!user) return res.status(401).json({ message: 'User not found' })
    if (user.activeSessionId !== req.user.sessionId) {
      return res.status(401).json({
        message: 'Your session was terminated because you logged in from another device.',
        sessionInvalidated: true,
      })
    }
    res.json({ valid: true })
  } catch (error) {
    logError(`Session check error: ${error.message}`, { filename: 'authController.js' })
    next(error)
  }
}

// ── Get logged-in user profile ────────────────────────────────

export const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        profile: true,
        school: { select: { id: true, name: true, logo: true } },
      },
    })

    if (!user) return res.status(404).json({ message: 'User not found' })

    res.json({ ...buildUserResponse(user), school: user.school ?? null })
  } catch (error) {
    logError(`Get profile error: ${error.message}`, { filename: 'authController.js' })
    next(error)
  }
}

// ── Update logged-in user profile ────────────────────────────

export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = updateProfileSchema.parse(req.body)

    if (phone !== undefined) {
      await prisma.user.update({ where: { id: req.user.id }, data: { phone } })
    }

    if (firstName !== undefined || lastName !== undefined) {
      await prisma.profile.upsert({
        where: { userId: req.user.id },
        update: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
        },
        create: {
          userId: req.user.id,
          firstName: firstName || 'Admin',
          lastName: lastName || 'User',
        },
      })
    }

    logInfo('Profile updated', { filename: 'authController.js', userId: req.user.id })
    res.json({ message: 'Profile updated successfully' })
  } catch (error) {
    logError(`Update profile error: ${error.message}`, { filename: 'authController.js' })
    next(error)
  }
}

// ── Register new school → creates school-admin ──────────────────

export const register = async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body)

    logInfo(`Registration attempt for school: ${payload.schoolName}`, {
      filename: 'authController.js',
      schoolId: 'system',
    })

    const existing = await prisma.user.findFirst({ where: { email: payload.email } })
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    const hashedPassword = await bcrypt.hash(payload.password, SALT_ROUNDS)

    const phoneVerifyCode = generateOtp()
    const verifyExpiry = new Date(Date.now() + VERIFY_EXPIRY_MINUTES * 60 * 1000)

    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name: payload.schoolName,
          address: payload.address || 'Not provided',
          contact: payload.phone,
          principal: 'Not provided',
          boardType: 'CBSE',
          status: 'pending',
          isFreeTrail: payload.isFreeTrail !== false,
        },
      })

      const user = await tx.user.create({
        data: {
          email: payload.email,
          password: hashedPassword,
          role: 'school-admin',
          phone: payload.phone,
          schoolId: school.id,
          isEmailVerified: true,
          isPhoneVerified: false,
          otpCode: phoneVerifyCode,
          otpExpiry: verifyExpiry,
          profile: { create: { firstName: 'Admin', lastName: 'User' } },
        },
      })

      return { school, user }
    })

    try {
      await sendSMS({
        to: payload.phone,
        message: buildOtpSms(phoneVerifyCode),
      })
    } catch (smsErr) {
      logError(`Verify phone SMS failed: ${smsErr.message}`, { filename: 'authController.js' })
    }

    logInfo(`School registered: ${payload.schoolName} (${payload.email})`, { filename: 'authController.js' })

    res.status(201).json({
      message: 'Registration successful. Please verify your mobile number.',
      email: payload.email,
      maskedPhone: maskPhone(payload.phone),
      needsVerification: true,
    })
  } catch (error) {
    logError(`Registration error: ${error.message}`, { filename: 'authController.js', stack: error.stack })
    next(error)
  }
}

// ── Verify Email ──────────────────────────────────────────

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = z.object({
      email: z.string().email(),
      code: z.string().length(6),
    }).parse(req.body)

    const user = await prisma.user.findFirst({ where: { email } })
    if (!user) return res.status(400).json({ message: 'Invalid request.' })
    if (user.isEmailVerified) return res.json({ message: 'Email already verified.', emailVerified: true })

    if (!user.emailVerifyCode || !user.emailVerifyExpiry) {
      return res.status(400).json({ message: 'No pending email verification.' })
    }
    if (new Date() > user.emailVerifyExpiry) {
      return res.status(400).json({ message: 'Verification code expired. Please request a new one.' })
    }
    if (user.emailVerifyCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code.' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyCode: null, emailVerifyExpiry: null },
    })

    logInfo(`Email verified: ${email}`, { filename: 'authController.js' })
    res.json({ message: 'Email verified successfully!', emailVerified: true })
  } catch (error) {
    logError(`Verify email error: ${error.message}`, { filename: 'authController.js' })
    next(error)
  }
}

// ── Verify Phone ──────────────────────────────────────────

export const verifyPhone = async (req, res, next) => {
  try {
    const { email, otp } = z.object({
      email: z.string().email(),
      otp: z.string().length(6),
    }).parse(req.body)

    const user = await prisma.user.findFirst({ where: { email } })
    if (!user) return res.status(400).json({ message: 'Invalid request.' })
    if (user.isPhoneVerified) return res.json({ message: 'Phone already verified.', phoneVerified: true })

    if (!user.otpCode || !user.otpExpiry) {
      return res.status(400).json({ message: 'No pending phone verification.' })
    }
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'Verification OTP expired. Please request a new one.' })
    }
    if (user.otpCode !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isPhoneVerified: true, otpCode: null, otpExpiry: null },
    })

    // Activate school when phone is verified (email auto-verified)
    if (user.schoolId) {
      await prisma.school.update({ where: { id: user.schoolId }, data: { status: 'active' } })
    }

    logInfo(`Phone verified: ${email}`, { filename: 'authController.js' })
    res.json({ message: 'Phone number verified successfully!', phoneVerified: true })
  } catch (error) {
    logError(`Verify phone error: ${error.message}`, { filename: 'authController.js' })
    next(error)
  }
}

// ── Resend Verification Code ──────────────────────────────

export const resendVerification = async (req, res, next) => {
  try {
    const { email, type } = z.object({
      email: z.string().email(),
      type: z.enum(['phone']),
    }).parse(req.body)

    const user = await prisma.user.findFirst({ where: { email }, include: { profile: true } })
    if (!user) return res.json({ message: 'If this account exists, verification has been resent.' })

    if (!user.phone) return res.status(400).json({ message: 'No phone number on file.' })

    const code = generateOtp()
    const expiry = new Date(Date.now() + VERIFY_EXPIRY_MINUTES * 60 * 1000)

    await prisma.user.update({ where: { id: user.id }, data: { otpCode: code, otpExpiry: expiry } })
    try {
      await sendSMS({ to: user.phone, message: buildOtpSms(code) })
    } catch { /* ignore */ }

    res.json({ message: 'Verification SMS resent.' })
  } catch (error) {
    logError(`Resend verification error: ${error.message}`, { filename: 'authController.js' })
    next(error)
  }
}

// ── Change password ───────────────────────────────────────────

export const changePassword = async (req, res, next) => {
  try {
    const payload = changePasswordSchema.parse(req.body)
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'Not authenticated' })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const match = await bcrypt.compare(payload.currentPassword, user.password)
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' })

    const hashed = await bcrypt.hash(payload.newPassword, SALT_ROUNDS)
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } })

    logInfo('Password changed', { filename: 'authController.js', userId })
    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    logError(`Change password error: ${error.message}`, { filename: 'authController.js' })
    next(error)
  }
}

// ── Forgot Password ───────────────────────────────────────

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body)

    const user = await prisma.user.findFirst({ where: { email }, include: { profile: true } })

    const safeResponse = {
      message: 'If this account is registered, a reset code has been sent to your phone.',
      maskedPhone: null,
    }

    if (!user) return res.json(safeResponse)

    const resetCode = generateOtp()
    const resetExpiry = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetCode: resetCode, passwordResetExpiry: resetExpiry },
    })

    if (user.phone) {
      try {
        await sendSMS({
          to: user.phone,
          message: buildOtpSms(resetCode),
        })
      } catch { /* ignore */ }
    }

    logInfo(`Password reset code sent: ${email}`, { filename: 'authController.js' })
    res.json({ ...safeResponse, maskedPhone: maskPhone(user.phone) })
  } catch (error) {
    logError(`Forgot password error: ${error.message}`, { filename: 'authController.js' })
    next(error)
  }
}

// ── Reset Password ─────────────────────────────────────────

export const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = z.object({
      email: z.string().email(),
      code: z.string().length(6),
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    }).parse(req.body)

    const user = await prisma.user.findFirst({ where: { email } })
    if (!user) return res.status(400).json({ message: 'Invalid request.' })

    if (!user.passwordResetCode || !user.passwordResetExpiry) {
      return res.status(400).json({ message: 'No pending password reset. Please request a new code.' })
    }
    if (new Date() > user.passwordResetExpiry) {
      await prisma.user.update({ where: { id: user.id }, data: { passwordResetCode: null, passwordResetExpiry: null } })
      return res.status(400).json({ message: 'Reset code expired. Please request a new one.' })
    }
    if (user.passwordResetCode !== code) {
      return res.status(400).json({ message: 'Invalid reset code.' })
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        passwordResetCode: null,
        passwordResetExpiry: null,
        activeSessionId: null, // invalidate all sessions on password reset
      },
    })

    logInfo(`Password reset successful: ${email}`, { filename: 'authController.js' })
    res.json({ message: 'Password reset successfully. You can now log in with your new password.' })
  } catch (error) {
    logError(`Reset password error: ${error.message}`, { filename: 'authController.js' })
    next(error)
  }
}

// ── Get MFA settings for current user ────────────────────────

export const getMfaSettings = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { mfaEmail: true, mfaPhone: true, phone: true, email: true },
    })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ mfaEmail: user.mfaEmail, mfaPhone: user.mfaPhone, phone: user.phone, email: user.email })
  } catch (error) {
    logError(`getMfaSettings error: ${error.message}`, { filename: 'authController.js' })
    next(error)
  }
}

// ── Update MFA settings for current user ─────────────────────

export const updateMfaSettings = async (req, res, next) => {
  try {
    const { mfaEmail, mfaPhone } = req.body
    if (typeof mfaEmail !== 'boolean' && typeof mfaPhone !== 'boolean') {
      return res.status(400).json({ message: 'Provide at least mfaEmail or mfaPhone (boolean)' })
    }
    const data = {}
    if (typeof mfaEmail === 'boolean') data.mfaEmail = mfaEmail
    if (typeof mfaPhone === 'boolean') data.mfaPhone = mfaPhone

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { mfaEmail: true, mfaPhone: true },
    })
    logInfo(`MFA settings updated for user ${req.user.id}: email=${updated.mfaEmail} phone=${updated.mfaPhone}`, { filename: 'authController.js' })
    res.json({ message: 'MFA settings updated', ...updated })
  } catch (error) {
    logError(`updateMfaSettings error: ${error.message}`, { filename: 'authController.js' })
    next(error)
  }
}