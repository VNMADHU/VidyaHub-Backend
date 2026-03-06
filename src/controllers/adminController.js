import { z } from 'zod'
import bcrypt from 'bcrypt'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'
import { sendEmail } from '../services/emailService.js'
import { sendSMS, buildOtpSms } from '../services/smsService.js'

const SALT_ROUNDS = 12
const VERIFY_EXPIRY_MINUTES = 30

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000))

const ALL_MODULES = [
  'students', 'admissions', 'teachers', 'staff', 'hostel', 'classes',
  'exams', 'attendance', 'fees', 'events', 'announcements', 'achievements',
  'sports', 'library', 'transport', 'expenses', 'holidays', 'leaves',
]

// ── Validation schemas ──────────────────────────────────────

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10, 'Mobile number is required (at least 10 digits)'),
  modulePermissions: z.array(z.string()).nullable().optional(),
  mfaEmail: z.boolean().optional(),
  mfaPhone: z.boolean().optional(),
})

const updateAdminSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(10, 'Mobile number must be at least 10 digits').optional(),
  modulePermissions: z.array(z.string()).nullable().optional(),
  mfaEmail: z.boolean().optional(),
  mfaPhone: z.boolean().optional(),
})

const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const parseModulePermissions = (raw) => {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

// ── Welcome email template ────────────────────────────────────
const welcomeEmailHtml = (name, email, password, emailCode, schoolName) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #1e40af; padding: 16px 24px; border-radius: 8px 8px 0 0;">
      <h2 style="color: white; margin: 0;">🎓 Vidya Hub — Your Account is Ready</h2>
    </div>
    <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 24px;">
      <p style="color: #374151;">Hello <strong>${name}</strong>,</p>
      <p style="color: #374151;">Your admin account for <strong>${schoolName || 'Vidya Hub'}</strong> has been created.</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width:100%; border-collapse:collapse;">
          <tr><td style="color:#64748b; padding: 4px 8px;">Email</td><td style="font-weight:600; padding: 4px 8px;">${email}</td></tr>
          <tr><td style="color:#64748b; padding: 4px 8px;">Password</td><td style="font-weight:600; padding: 4px 8px;">${password}</td></tr>
        </table>
      </div>
      <p style="color: #374151;">Before your first login, verify your email with this code:</p>
      <div style="background: #ecfdf5; border: 2px solid #059669; border-radius: 8px; padding: 20px; text-align: center; margin: 16px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #065f46;">${emailCode}</span>
      </div>
      <p style="color: #374151;">This code is valid for <strong>${VERIFY_EXPIRY_MINUTES} minutes</strong>.</p>
      <p style="color: #ef4444;"><strong>⚠ Do not share these credentials with anyone.</strong></p>
      <p style="color: #374151;">Login at: <a href="${process.env.APP_URL || 'http://localhost:5173'}/login" style="color:#1e40af;">${process.env.APP_URL || 'http://localhost:5173'}/login</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">If you did not expect this email, please contact your administrator.</p>
    </div>
  </div>
`

// ── Helper: format admin response ──────────────────────────
const formatAdmin = (u) => ({
  id: String(u.id),
  email: u.email,
  role: u.role,
  phone: u.phone ?? null,
  schoolId: u.schoolId ? String(u.schoolId) : null,
  school: u.school ?? null,
  accountStatus: u.accountStatus ?? 'active',
  modulePermissions: parseModulePermissions(u.modulePermissions),
  profile: u.profile ?? null,
  isEmailVerified: u.isEmailVerified,
  isPhoneVerified: u.isPhoneVerified,
  mfaEmail: u.mfaEmail ?? true,
  mfaPhone: u.mfaPhone ?? false,
  createdAt: u.createdAt,
})

// ── List all school-admin users ──────────────────────────────

export const listAdmins = async (req, res, next) => {
  try {
    const schoolId = req.user?.schoolId ?? null
    const where = {
      role: 'school-admin',
      ...(schoolId ? { schoolId } : {}),
    }

    const admins = await prisma.user.findMany({
      where,
      include: {
        profile: true,
        school: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(admins.map(formatAdmin))
  } catch (error) {
    logError(`List admins error: ${error.message}`, { filename: 'adminController.js' })
    next(error)
  }
}

// ── Get all modules list ─────────────────────────────────────

export const getModules = (req, res) => {
  res.json(ALL_MODULES)
}

// ── Create a new school-admin (auto-assigned to requester's school) ──

export const createAdmin = async (req, res, next) => {
  try {
    const payload = createAdminSchema.parse(req.body)

    const effectiveSchoolId = req.user.schoolId
    if (!effectiveSchoolId) {
      return res.status(400).json({ message: 'You must belong to a school to create admins.' })
    }

    const emailConflict = await prisma.user.findFirst({
      where: { email: payload.email, schoolId: effectiveSchoolId },
    })
    if (emailConflict) {
      return res.status(409).json({ message: 'An account with this email already exists in this school.' })
    }
    const phoneConflict = await prisma.user.findFirst({
      where: { phone: payload.phone, schoolId: effectiveSchoolId },
    })
    if (phoneConflict) {
      return res.status(409).json({ message: 'An account with this mobile number already exists in this school.' })
    }

    let schoolName = 'Vidya Hub'
    const school = await prisma.school.findUnique({ where: { id: effectiveSchoolId }, select: { name: true } })
    if (school) schoolName = school.name

    const hashedPassword = await bcrypt.hash(payload.password, SALT_ROUNDS)
    const emailVerifyCode = generateOtp()
    const phoneVerifyCode = generateOtp()
    const verifyExpiry = new Date(Date.now() + VERIFY_EXPIRY_MINUTES * 60 * 1000)

    const user = await prisma.user.create({
      data: {
        email: payload.email,
        password: hashedPassword,
        role: 'school-admin',
        phone: payload.phone,
        schoolId: effectiveSchoolId,
        accountStatus: 'active',
        isEmailVerified: false,
        isPhoneVerified: false,
        emailVerifyCode,
        emailVerifyExpiry: verifyExpiry,
        otpCode: phoneVerifyCode,
        otpExpiry: verifyExpiry,
        modulePermissions:
          payload.modulePermissions != null
            ? JSON.stringify(payload.modulePermissions)
            : null,
        mfaEmail: payload.mfaEmail ?? true,
        mfaPhone: payload.mfaPhone ?? false,
        profile: {
          create: {
            firstName: payload.firstName,
            lastName: payload.lastName,
          },
        },
      },
      include: { profile: true, school: { select: { id: true, name: true } } },
    })

    const displayName = `${payload.firstName} ${payload.lastName}`

    try {
      await sendEmail({
        to: payload.email,
        subject: `Your Vidya Hub Admin Account — ${schoolName}`,
        html: welcomeEmailHtml(displayName, payload.email, payload.password, emailVerifyCode, schoolName),
      })
    } catch (emailErr) {
      logError(`Welcome email failed: ${emailErr.message}`, { filename: 'adminController.js' })
    }

    try {
      await sendSMS({ to: payload.phone, message: buildOtpSms(phoneVerifyCode) })
    } catch (smsErr) {
      logError(`Welcome SMS failed: ${smsErr.message}`, { filename: 'adminController.js' })
    }

    logInfo(`Admin created: ${user.email} | school: ${schoolName}`, {
      filename: 'adminController.js',
      schoolId: String(effectiveSchoolId),
    })

    res.status(201).json(formatAdmin(user))
  } catch (error) {
    logError(`Create admin error: ${error.message}`, { filename: 'adminController.js' })
    next(error)
  }
}

// ── Update an existing school-admin ─────────────────────────

export const updateAdmin = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid admin ID' })

    const payload = updateAdminSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user || user.role !== 'school-admin') {
      return res.status(404).json({ message: 'Admin not found' })
    }
    if (user.schoolId !== req.user.schoolId) {
      return res.status(403).json({ message: 'Access denied.' })
    }

    const userUpdateData = {}
    if (payload.email !== undefined) userUpdateData.email = payload.email
    if (payload.phone !== undefined) userUpdateData.phone = payload.phone
    if (typeof payload.mfaEmail === 'boolean') userUpdateData.mfaEmail = payload.mfaEmail
    if (typeof payload.mfaPhone === 'boolean') userUpdateData.mfaPhone = payload.mfaPhone
    if ('modulePermissions' in payload) {
      userUpdateData.modulePermissions =
        payload.modulePermissions != null
          ? JSON.stringify(payload.modulePermissions)
          : null
    }

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({ where: { id }, data: userUpdateData })
    }

    if (payload.firstName !== undefined || payload.lastName !== undefined) {
      await prisma.profile.upsert({
        where: { userId: id },
        update: {
          ...(payload.firstName !== undefined && { firstName: payload.firstName }),
          ...(payload.lastName !== undefined && { lastName: payload.lastName }),
        },
        create: {
          userId: id,
          firstName: payload.firstName || 'Admin',
          lastName: payload.lastName || 'User',
        },
      })
    }

    logInfo(`Admin updated: ${id}`, { filename: 'adminController.js' })
    res.json({ message: 'Admin updated successfully' })
  } catch (error) {
    logError(`Update admin error: ${error.message}`, { filename: 'adminController.js' })
    next(error)
  }
}

// ── Suspend / Activate an admin ──────────────────────────────

export const toggleAdminStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid admin ID' })

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user || user.role !== 'school-admin') {
      return res.status(404).json({ message: 'Admin not found' })
    }
    if (user.schoolId !== req.user.schoolId) {
      return res.status(403).json({ message: 'Access denied.' })
    }

    const newStatus = user.accountStatus === 'active' ? 'suspended' : 'active'

    await prisma.user.update({
      where: { id },
      data: {
        accountStatus: newStatus,
        ...(newStatus === 'suspended' ? { activeSessionId: null } : {}),
      },
    })

    logInfo(`Admin ${id} status → ${newStatus}`, { filename: 'adminController.js' })
    res.json({ message: `Admin ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully.`, accountStatus: newStatus })
  } catch (error) {
    logError(`Toggle admin status error: ${error.message}`, { filename: 'adminController.js' })
    next(error)
  }
}

// ── Update password for an admin ─────────────────────────────

export const updateAdminPassword = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid admin ID' })

    const { password } = updatePasswordSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user || user.role !== 'school-admin') {
      return res.status(404).json({ message: 'Admin not found' })
    }
    if (user.schoolId !== req.user.schoolId) {
      return res.status(403).json({ message: 'Access denied.' })
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword, activeSessionId: null },
    })

    logInfo(`Password updated for admin: ${id}`, { filename: 'adminController.js' })
    res.json({ message: 'Password updated. The user will need to log in again.' })
  } catch (error) {
    logError(`Update password error: ${error.message}`, { filename: 'adminController.js' })
    next(error)
  }
}

// ── Delete a school-admin ─────────────────────────────────────

export const deleteAdmin = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid admin ID' })

    const user = await prisma.user.findUnique({ where: { id }, include: { profile: true } })
    if (!user || user.role !== 'school-admin') {
      return res.status(404).json({ message: 'Admin not found' })
    }
    if (user.schoolId !== req.user.schoolId) {
      return res.status(403).json({ message: 'Access denied.' })
    }

    if (user.profile) {
      await prisma.profile.delete({ where: { userId: id } })
    }
    await prisma.user.delete({ where: { id } })

    logInfo(`Admin deleted: ${id}`, { filename: 'adminController.js' })
    res.json({ message: 'Admin deleted successfully' })
  } catch (error) {
    logError(`Delete admin error: ${error.message}`, { filename: 'adminController.js' })
    next(error)
  }
}
