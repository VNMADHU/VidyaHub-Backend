import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/

const staffSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  staffId: z.string().optional().nullable(),
  designation: z.string().min(1),
  department: z.string().optional().nullable(),
  phoneNumber: z.string()
    .refine((val) => !val || INDIAN_PHONE_REGEX.test(val), {
      message: 'Must be a valid 10-digit Indian mobile number (starting with 6-9)',
    })
    .optional()
    .nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  address: z.string().optional().nullable(),
  aadhaarNumber: z.string()
    .refine((val) => !val || /^\d{12}$/.test(val), { message: 'Aadhaar must be 12 digits' })
    .optional()
    .nullable(),
  joiningDate: z.string().optional().nullable(),
  salary: z.number().positive().optional().nullable(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  profilePic: z.string().optional().nullable(),
  status: z.enum(['active', 'on-leave', 'inactive', 'terminated']).optional(),
})

export const listStaff = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const { designation, status } = req.query
    logInfo('Listing staff', { filename: 'staffController.js', schoolId })
    const staff = await prisma.staff.findMany({
      where: {
        schoolId: parseInt(schoolId),
        ...(designation ? { designation } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { firstName: 'asc' },
    })
    res.json({ data: staff, message: 'List of staff' })
  } catch (error) {
    logError(`List staff error: ${error.message}`, { filename: 'staffController.js' })
    next(error)
  }
}

export const createStaff = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const validated = staffSchema.parse(req.body)
    logInfo('Creating staff member', { filename: 'staffController.js', schoolId })
    const staff = await prisma.staff.create({
      data: {
        ...validated,
        email: validated.email || null,
        dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null,
        joiningDate: validated.joiningDate ? new Date(validated.joiningDate) : null,
        schoolId: parseInt(schoolId),
      },
    })
    res.status(201).json({ data: staff, message: 'Staff member created' })
  } catch (error) {
    logError(`Create staff error: ${error.message}`, { filename: 'staffController.js' })
    next(error)
  }
}

export const updateStaff = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const { staffId } = req.params
    const validated = staffSchema.partial().parse(req.body)
    logInfo('Updating staff member', { filename: 'staffController.js', schoolId })
    const staff = await prisma.staff.update({
      where: { id: parseInt(staffId), schoolId: parseInt(schoolId) },
      data: {
        ...validated,
        email: validated.email || null,
        dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : undefined,
        joiningDate: validated.joiningDate ? new Date(validated.joiningDate) : undefined,
      },
    })
    res.json({ data: staff, message: 'Staff member updated' })
  } catch (error) {
    logError(`Update staff error: ${error.message}`, { filename: 'staffController.js' })
    next(error)
  }
}

export const deleteStaff = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const { staffId } = req.params
    logInfo('Deleting staff member', { filename: 'staffController.js', schoolId })
    await prisma.staff.delete({
      where: { id: parseInt(staffId), schoolId: parseInt(schoolId) },
    })
    res.json({ message: 'Staff member deleted' })
  } catch (error) {
    logError(`Delete staff error: ${error.message}`, { filename: 'staffController.js' })
    next(error)
  }
}
