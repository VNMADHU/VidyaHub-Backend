import { z } from 'zod'
import bcrypt from 'bcrypt'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'
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
  feeCanEdit: z.boolean().optional(),
  feeCanDelete: z.boolean().optional(),
  expenseCanEdit: z.boolean().optional(),
  expenseCanDelete: z.boolean().optional(),
  incomeCanEdit: z.boolean().optional(),
  incomeCanDelete: z.boolean().optional(),
})

const updateAdminSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(10, 'Mobile number must be at least 10 digits').optional(),
  role: z.enum(['school-admin', 'super-admin']).optional(),
  isPhoneVerified: z.boolean().optional(),
  modulePermissions: z.array(z.string()).nullable().optional(),
  mfaEmail: z.boolean().optional(),
  mfaPhone: z.boolean().optional(),
  feeCanEdit: z.boolean().optional(),
  feeCanDelete: z.boolean().optional(),
  expenseCanEdit: z.boolean().optional(),
  expenseCanDelete: z.boolean().optional(),
  incomeCanEdit: z.boolean().optional(),
  incomeCanDelete: z.boolean().optional(),
})

const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const parseModulePermissions = (raw) => {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

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
  feeCanEdit: u.feeCanEdit ?? false,
  feeCanDelete: u.feeCanDelete ?? false,
  expenseCanEdit: u.expenseCanEdit ?? false,
  expenseCanDelete: u.expenseCanDelete ?? false,
  incomeCanEdit: u.incomeCanEdit ?? false,
  incomeCanDelete: u.incomeCanDelete ?? false,
  createdAt: u.createdAt,
})

// ── List all school-admin users ──────────────────────────────

export const listAdmins = async (req, res, next) => {
  try {
    const isOwner = req.user?.role === 'owner'
    const schoolId = isOwner ? null : (req.user?.schoolId ?? null)
    const where = {
      role: { in: ['school-admin', 'super-admin'] },
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

    const isOwner = req.user?.role === 'owner'
    const effectiveSchoolId = isOwner
      ? (req.body.schoolId ? parseInt(req.body.schoolId) : null)
      : req.user.schoolId
    if (!effectiveSchoolId) {
      return res.status(400).json({ message: 'A schoolId is required to create an admin.' })
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
        isEmailVerified: true,
        isPhoneVerified: false,
        otpCode: phoneVerifyCode,
        otpExpiry: verifyExpiry,
        modulePermissions:
          payload.modulePermissions != null
            ? JSON.stringify(payload.modulePermissions)
            : null,
        mfaEmail: false,
        mfaPhone: payload.mfaPhone ?? false,
        feeCanEdit: payload.feeCanEdit ?? false,
        feeCanDelete: payload.feeCanDelete ?? false,
        expenseCanEdit: payload.expenseCanEdit ?? false,
        expenseCanDelete: payload.expenseCanDelete ?? false,
        incomeCanEdit: payload.incomeCanEdit ?? false,
        incomeCanDelete: payload.incomeCanDelete ?? false,
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
    if (!user || !['school-admin', 'super-admin'].includes(user.role)) {
      return res.status(404).json({ message: 'Admin not found' })
    }
    const isOwnerReq = req.user?.role === 'owner'
    if (!isOwnerReq && user.schoolId !== req.user.schoolId) {
      return res.status(403).json({ message: 'Access denied.' })
    }
    // Only owner can change a user's role or phone verification
    if (payload.role && !isOwnerReq) {
      return res.status(403).json({ message: 'Only the owner can change user roles.' })
    }
    if (typeof payload.isPhoneVerified === 'boolean' && !isOwnerReq) {
      return res.status(403).json({ message: 'Only the owner can update phone verification status.' })
    }

    const userUpdateData = {}
    if (payload.email !== undefined) {
      const emailConflict = await prisma.user.findFirst({
        where: { email: payload.email, schoolId: user.schoolId, NOT: { id } },
      })
      if (emailConflict) return res.status(409).json({ message: 'An account with this email already exists in this school.' })
      userUpdateData.email = payload.email
    }
    if (payload.phone !== undefined) {
      const phoneConflict = await prisma.user.findFirst({
        where: { phone: payload.phone, schoolId: user.schoolId, NOT: { id } },
      })
      if (phoneConflict) return res.status(409).json({ message: 'An account with this mobile number already exists in this school.' })
      userUpdateData.phone = payload.phone
    }
    if (payload.role) userUpdateData.role = payload.role
    if (typeof payload.isPhoneVerified === 'boolean') userUpdateData.isPhoneVerified = payload.isPhoneVerified
    if (typeof payload.mfaEmail === 'boolean') userUpdateData.mfaEmail = payload.mfaEmail
    if (typeof payload.mfaPhone === 'boolean') userUpdateData.mfaPhone = payload.mfaPhone
    if (typeof payload.feeCanEdit === 'boolean') userUpdateData.feeCanEdit = payload.feeCanEdit
    if (typeof payload.feeCanDelete === 'boolean') userUpdateData.feeCanDelete = payload.feeCanDelete
    if (typeof payload.expenseCanEdit === 'boolean') userUpdateData.expenseCanEdit = payload.expenseCanEdit
    if (typeof payload.expenseCanDelete === 'boolean') userUpdateData.expenseCanDelete = payload.expenseCanDelete
    if (typeof payload.incomeCanEdit === 'boolean') userUpdateData.incomeCanEdit = payload.incomeCanEdit
    if (typeof payload.incomeCanDelete === 'boolean') userUpdateData.incomeCanDelete = payload.incomeCanDelete
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

    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: { profile: true, school: { select: { id: true, name: true } } },
    })
    res.json(formatAdmin(updatedUser))
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
    if (!user || !['school-admin', 'super-admin'].includes(user.role)) {
      return res.status(404).json({ message: 'Admin not found' })
    }
    const isOwnerT = req.user?.role === 'owner'
    if (!isOwnerT && user.schoolId !== req.user.schoolId) {
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
    if (!user || !['school-admin', 'super-admin'].includes(user.role)) {
      return res.status(404).json({ message: 'Admin not found' })
    }
    const isOwnerP = req.user?.role === 'owner'
    if (!isOwnerP && user.schoolId !== req.user.schoolId) {
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
    if (!user || !['school-admin', 'super-admin'].includes(user.role)) {
      return res.status(404).json({ message: 'Admin not found' })
    }
    const isOwnerD = req.user?.role === 'owner'
    if (!isOwnerD && user.schoolId !== req.user.schoolId) {
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
