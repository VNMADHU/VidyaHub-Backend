import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'


const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/

const indianPhoneOptional = z.string()
  .refine((val) => !val || INDIAN_PHONE_REGEX.test(val), {
    message: 'Must be a valid 10-digit Indian mobile number (starting with 6-9)',
  })
  .optional()

const studentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email('Invalid email address'),
  dateOfBirth: z.string()
    .refine((val) => !val || new Date(val) <= new Date(), {
      message: 'Date of birth cannot be a future date',
    })
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  admissionNumber: z.string().min(1),
  rollNumber: z.string().optional(),
  profilePic: z.string().optional(),
  classId: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().optional(),
  ),
  sectionId: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().optional(),
  ),
  // Indian school specific fields
  aadhaarNumber: z.string().refine((val) => !val || /^\d{12}$/.test(val), {
    message: 'Aadhaar must be a 12-digit number',
  }).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional().or(z.literal('')),
  category: z.enum(['General', 'OBC', 'SC', 'ST', 'EWS']).optional().or(z.literal('')),
  religion: z.string().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  permanentAddress: z.string().optional(),
  transportMode: z.string().optional(),
  busRoute: z.string().optional(),
  previousSchool: z.string().optional(),
  tcNumber: z.string().optional(),
  // Parent/Guardian details
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  guardianName: z.string().optional(),
  fatherContact: indianPhoneOptional,
  motherContact: indianPhoneOptional,
  guardianContact: indianPhoneOptional,
  parentEmail: z.string().email('Invalid parent email address').optional().or(z.literal('')),
})

export const listStudents = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    logInfo('Listing all students', {
      filename: 'studentController.js',
      line: 20,
      schoolId,
    })
    const students = await prisma.student.findMany({
      where: { schoolId: parseInt(schoolId) },
    })
    res.json({ data: students, message: 'List of students' })
  } catch (error) {
    logError(`List students error: ${error.message}`, {
      filename: 'studentController.js',
      line: 30,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const getStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params
    const schoolId = req.schoolId
    logInfo(`Getting student: ${studentId}`, {
      filename: 'studentController.js',
      line: 52,
      schoolId,
    })
    
    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId) },
      include: {
        class: true,
        section: true,
      },
    })
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }
    
    res.json(student)
  } catch (error) {
    logError(`Get student error: ${error.message}`, {
      filename: 'studentController.js',
      line: 68,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const createStudent = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const payload = studentSchema.parse(req.body)
    
    const student = await prisma.student.create({
      data: {
        ...payload,
        schoolId: parseInt(schoolId),
        classId: payload.classId ?? undefined,
        sectionId: payload.sectionId ?? undefined,
        dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : undefined,
      },
    })
    
    logInfo(`Student created: ${payload.firstName} ${payload.lastName}`, {
      filename: 'studentController.js',
      line: 50,
      schoolId,
    })
    res.status(201).json({ message: 'Student created', data: student })
  } catch (error) {
    logError(`Create student error: ${error.message}`, {
      filename: 'studentController.js',
      line: 58,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const updateStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params
    const schoolId = req.schoolId
    const payload = studentSchema.partial().parse(req.body)
    
    const student = await prisma.student.update({
      where: { id: parseInt(studentId) },
      data: {
        ...payload,
        classId: payload.classId ?? undefined,
        sectionId: payload.sectionId ?? undefined,
        dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : undefined,
      },
    })
    
    logInfo(`Student updated: ${studentId}`, {
      filename: 'studentController.js',
      line: 76,
      schoolId,
    })
    res.json({ message: 'Student updated', data: student })
  } catch (error) {
    logError(`Update student error: ${error.message}`, {
      filename: 'studentController.js',
      line: 82,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const deleteStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params
    const schoolId = req.schoolId
    const id = parseInt(studentId)
    
    // Delete related records first to avoid foreign key constraint errors
    await prisma.$transaction([
      // Delete attendance records
      prisma.attendance.deleteMany({
        where: { studentId: id },
      }),
      // Delete marks
      prisma.mark.deleteMany({
        where: { studentId: id },
      }),
      // Delete achievements
      prisma.achievement.deleteMany({
        where: { studentId: id },
      }),
      // Finally delete the student
      prisma.student.delete({
        where: { id },
      }),
    ])
    
    logInfo(`Student deleted: ${studentId}`, {
      filename: 'studentController.js',
      line: 98,
      schoolId,
    })
    res.json({ message: 'Student deleted successfully' })
  } catch (error) {
    logError(`Delete student error: ${error.message}`, {
      filename: 'studentController.js',
      line: 105,
      schoolId: req.schoolId,
    })
    next(error)
  }
}
