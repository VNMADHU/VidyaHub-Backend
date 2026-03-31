import { z } from 'zod'
import bcrypt from 'bcrypt'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const SALT_ROUNDS = 10
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/

// Schema for update (all fields optional)
const schoolSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  contact: z.string().regex(INDIAN_PHONE_REGEX, 'Must be a valid 10-digit Indian mobile number (starting with 6-9)').optional(),
  principal: z.string().min(2).optional(),
  boardType: z.string().min(2).optional(),
  isFreeTrail: z.boolean().optional(),
  status: z.string().optional(),
})

// Schema for atomic school creation (school + super-admin + config)
const createSchoolSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  contact: z.string().regex(INDIAN_PHONE_REGEX, 'Must be a valid 10-digit Indian mobile number (starting with 6-9)'),
  principal: z.string().min(2),
  boardType: z.string().min(2),
  isFreeTrail: z.boolean().optional().default(true),
  status: z.string().optional().default('active'),
  admin: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    phone: z.string().regex(INDIAN_PHONE_REGEX, 'Must be a valid 10-digit Indian mobile number (starting with 6-9)'),
    mfaPhone: z.boolean().optional().default(false),
  }),
  config: z.object({
    smsLimit: z.number().int().nonnegative().optional().default(1000),
    freeTrialLimit: z.number().int().nonnegative().optional().default(0),
    geminiApiKey: z.string().optional().nullable(),
  }).optional(),
})

export const listSchools = async (req, res, next) => {
  try {
    // Super-admins and owner see all schools; school-admins see only their own school
    const isSuperAdmin = req.user?.role === 'super-admin' || req.user?.role === 'owner'
    const where = isSuperAdmin ? {} : { id: parseInt(req.user?.schoolId) }

    logInfo(`Listing schools (role=${req.user?.role})`, {
      filename: 'schoolController.js',
      line: 16,
    })
    const schools = await prisma.school.findMany({ where })
    res.json({ data: schools, message: 'List of schools' })
  } catch (error) {
    logError(`List schools error: ${error.message}`, {
      filename: 'schoolController.js',
      line: 23,
    })
    next(error)
  }
}

export const createSchool = async (req, res, next) => {
  try {
    const payload = createSchoolSchema.parse(req.body)
    const { admin, config, ...schoolData } = payload

    // Hash password before transaction to keep transaction fast
    const hashedPassword = await bcrypt.hash(admin.password, SALT_ROUNDS)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the school
      const school = await tx.school.create({ data: schoolData })

      // 2. Create the super-admin user for this school
      const user = await tx.user.create({
        data: {
          email: admin.email,
          password: hashedPassword,
          role: 'super-admin',
          phone: admin.phone,
          schoolId: school.id,
          accountStatus: 'active',
          isEmailVerified: true,
          mfaEmail: false,
          mfaPhone: admin.mfaPhone ?? false,
          profile: { create: { firstName: admin.firstName, lastName: admin.lastName } },
        },
        include: { profile: true },
      })

      // 3. Create the SchoolConfig
      const schoolConfig = await tx.schoolConfig.create({
        data: {
          schoolId: school.id,
          smsLimit: config?.smsLimit ?? 1000,
          freeTrialLimit: config?.freeTrialLimit ?? 0,
          ...(config?.geminiApiKey ? { geminiApiKey: config.geminiApiKey } : {}),
        },
      })

      return { school, user, schoolConfig }
    })

    logInfo(`School created atomically: ${payload.name}`, { filename: 'schoolController.js' })
    res.status(201).json({
      message: 'School created with admin account and configuration',
      data: {
        school: result.school,
        admin: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.profile?.firstName,
          lastName: result.user.profile?.lastName,
        },
        config: result.schoolConfig,
      },
    })
  } catch (error) {
    logError(`Create school error: ${error.message}`, { filename: 'schoolController.js' })
    next(error)
  }
}

export const updateSchool = async (req, res, next) => {
  try {
    const { schoolId } = req.params
    const payload = schoolSchema.parse(req.body)
    
    const school = await prisma.school.update({
      where: { id: parseInt(schoolId) },
      data: payload,
    })
    
    logInfo(`School updated: ${schoolId}`, {
      filename: 'schoolController.js',
      line: 59,
    })
    res.json({ message: 'School updated', data: school })
  } catch (error) {
    logError(`Update school error: ${error.message}`, {
      filename: 'schoolController.js',
      line: 66,
    })
    next(error)
  }
}

export const deleteSchool = async (req, res, next) => {
  try {
    const { schoolId } = req.params
    
    await prisma.school.delete({
      where: { id: parseInt(schoolId) },
    })
    
    logInfo(`School deleted: ${schoolId}`, {
      filename: 'schoolController.js',
      line: 80,
    })
    res.json({ message: 'School deleted successfully' })
  } catch (error) {
    logError(`Delete school error: ${error.message}`, {
      filename: 'schoolController.js',
      line: 87,
    })
    next(error)
  }
}

export const getSmsSettings = async (req, res, next) => {
  try {
    const schoolId = parseInt(req.params.schoolId)
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        smsEnabled: true,
        smsOnAbsent: true,
        smsOnFeeAssigned: true,
        smsOnLeaveApproved: true,
        smsOnAnnouncement: true,
      },
    })
    if (!school) return res.status(404).json({ message: 'School not found' })
    res.json({ data: school })
  } catch (error) {
    logError(`Get SMS settings error: ${error.message}`, { filename: 'schoolController.js' })
    next(error)
  }
}

export const updateSmsSettings = async (req, res, next) => {
  try {
    const schoolId = parseInt(req.params.schoolId)
    const { smsEnabled, smsOnAbsent, smsOnFeeAssigned, smsOnLeaveApproved, smsOnAnnouncement } = req.body
    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        ...(smsEnabled !== undefined && { smsEnabled }),
        ...(smsOnAbsent !== undefined && { smsOnAbsent }),
        ...(smsOnFeeAssigned !== undefined && { smsOnFeeAssigned }),
        ...(smsOnLeaveApproved !== undefined && { smsOnLeaveApproved }),
        ...(smsOnAnnouncement !== undefined && { smsOnAnnouncement }),
      },
    })
    logInfo(`SMS settings updated for school ${schoolId}`, { filename: 'schoolController.js' })
    res.json({ data: school, message: 'SMS settings updated' })
  } catch (error) {
    logError(`Update SMS settings error: ${error.message}`, { filename: 'schoolController.js' })
    next(error)
  }
}

export const getSchoolConfig = async (req, res, next) => {
  try {
    const schoolId = parseInt(req.params.schoolId)
    const config = await prisma.schoolConfig.upsert({
      where: { schoolId },
      update: {},
      create: { schoolId },
    })
    logInfo(`School config fetched for school ${schoolId}`, { filename: 'schoolController.js' })
    res.json({ data: config })
  } catch (error) {
    logError(`Get school config error: ${error.message}`, { filename: 'schoolController.js' })
    next(error)
  }
}

export const updateSchoolConfig = async (req, res, next) => {
  try {
    const schoolId = parseInt(req.params.schoolId)
    const { geminiApiKey, smsLimit, freeTrialLimit } = req.body
    const config = await prisma.schoolConfig.upsert({
      where: { schoolId },
      update: {
        ...(geminiApiKey !== undefined && { geminiApiKey: geminiApiKey || null }),
        ...(smsLimit !== undefined && { smsLimit: parseInt(smsLimit) }),
        ...(freeTrialLimit !== undefined && { freeTrialLimit: parseInt(freeTrialLimit) }),
      },
      create: {
        schoolId,
        ...(geminiApiKey && { geminiApiKey }),
        ...(smsLimit !== undefined && { smsLimit: parseInt(smsLimit) }),
        ...(freeTrialLimit !== undefined && { freeTrialLimit: parseInt(freeTrialLimit) }),
      },
    })
    logInfo(`School config updated for school ${schoolId}`, { filename: 'schoolController.js' })
    res.json({ data: config, message: 'Configuration saved' })
  } catch (error) {
    logError(`Update school config error: ${error.message}`, { filename: 'schoolController.js' })
    next(error)
  }
}
