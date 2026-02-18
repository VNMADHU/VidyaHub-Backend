import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { logInfo, logError } from '../utils/logHelpers.js'

const prisma = new PrismaClient()

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/

const teacherSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string()
    .refine((val) => !val || INDIAN_PHONE_REGEX.test(val), {
      message: 'Must be a valid 10-digit Indian mobile number (starting with 6-9)',
    })
    .optional(),
  subject: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.string().optional(),
  teacherId: z.string().optional(),
  profilePic: z.string().optional(),
})

export const listTeachers = async (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || '1'
    logInfo('Listing all teachers', {
      filename: 'teacherController.js',
      line: 20,
      schoolId,
    })
    const teachers = await prisma.teacher.findMany({
      where: { schoolId: parseInt(schoolId) },
    })
    res.json({ data: teachers, message: 'List of teachers' })
  } catch (error) {
    logError(`List teachers error: ${error.message}`, {
      filename: 'teacherController.js',
      line: 30,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const getTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.params
    const schoolId = req.body?.schoolId || '1'
    logInfo(`Getting teacher: ${teacherId}`, {
      filename: 'teacherController.js',
      line: 37,
      schoolId,
    })
    
    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(teacherId) },
    })
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' })
    }
    
    res.json(teacher)
  } catch (error) {
    logError(`Get teacher error: ${error.message}`, {
      filename: 'teacherController.js',
      line: 53,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const createTeacher = async (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || '1'
    const payload = teacherSchema.parse(req.body)
    
    const teacher = await prisma.teacher.create({
      data: {
        ...payload,
        schoolId: parseInt(schoolId),
      },
    })
    
    logInfo(`Teacher created: ${payload.firstName} ${payload.lastName}`, {
      filename: 'teacherController.js',
      line: 50,
      schoolId,
    })
    res.status(201).json({ message: 'Teacher created', data: teacher })
  } catch (error) {
    logError(`Create teacher error: ${error.message}`, {
      filename: 'teacherController.js',
      line: 58,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const updateTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.params
    const schoolId = req.body?.schoolId || '1'
    const payload = teacherSchema.partial().parse(req.body)
    
    const teacher = await prisma.teacher.update({
      where: { id: parseInt(teacherId) },
      data: payload,
    })
    
    logInfo(`Teacher updated: ${teacherId}`, {
      filename: 'teacherController.js',
      line: 76,
      schoolId,
    })
    res.json({ message: 'Teacher updated', data: teacher })
  } catch (error) {
    logError(`Update teacher error: ${error.message}`, {
      filename: 'teacherController.js',
      line: 82,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const deleteTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.params
    const schoolId = req.body?.schoolId || '1'
    
    await prisma.teacher.delete({
      where: { id: parseInt(teacherId) },
    })
    
    logInfo(`Teacher deleted: ${teacherId}`, {
      filename: 'teacherController.js',
      line: 98,
      schoolId,
    })
    res.json({ message: 'Teacher deleted successfully' })
  } catch (error) {
    logError(`Delete teacher error: ${error.message}`, {
      filename: 'teacherController.js',
      line: 105,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}
