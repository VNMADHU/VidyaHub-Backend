import prisma from '../utils/prisma.js'
import { signToken } from '../utils/jwt.js'
import { logInfo, logError } from '../utils/logHelpers.js'

// Student login by Roll Number + Date of Birth — issues a JWT token
export const studentLogin = async (req, res, next) => {
  try {
    const { rollNumber, dateOfBirth } = req.body

    if (!rollNumber || !rollNumber.trim()) {
      return res.status(400).json({ message: 'Roll Number is required' })
    }
    if (!dateOfBirth) {
      return res.status(400).json({ message: 'Date of Birth is required' })
    }

    const student = await prisma.student.findFirst({
      where: { rollNumber: rollNumber.trim() },
      include: {
        class: true,
        section: true,
        school: { select: { id: true, name: true, logo: true } },
      },
    })

    if (!student) {
      return res.status(404).json({ message: 'No student found with this Roll Number' })
    }

    // Verify Date of Birth matches
    const inputDob = new Date(dateOfBirth).toISOString().slice(0, 10)
    const storedDob = student.dateOfBirth
      ? new Date(student.dateOfBirth).toISOString().slice(0, 10)
      : null

    if (!storedDob || inputDob !== storedDob) {
      return res.status(401).json({ message: 'Date of Birth does not match our records' })
    }

    // Issue a JWT so the student portal is authenticated
    const token = signToken({
      id: student.id,
      email: student.email || `student-${student.id}@portal`,
      role: 'portal-student',
      schoolId: student.schoolId,
    })

    logInfo(`Student portal login: ${student.firstName} ${student.lastName} (Roll: ${rollNumber})`, {
      filename: 'portalController.js',
      line: 25,
      schoolId: student.schoolId,
    })

    res.json({
      message: 'Student login successful',
      data: student,
      token,
      portalType: 'student',
    })
  } catch (error) {
    logError(`Student login error: ${error.message}`, {
      filename: 'portalController.js',
      line: 35,
      stack: error.stack,
    })
    next(error)
  }
}

// Teacher login by Teacher ID + Date of Birth — issues a JWT token
export const teacherLogin = async (req, res, next) => {
  try {
    const { teacherId, dateOfBirth } = req.body

    if (!teacherId || !teacherId.trim()) {
      return res.status(400).json({ message: 'Teacher ID is required' })
    }
    if (!dateOfBirth) {
      return res.status(400).json({ message: 'Date of Birth is required' })
    }

    const teacher = await prisma.teacher.findFirst({
      where: { teacherId: teacherId.trim() },
      include: {
        classes: true,
        school: { select: { id: true, name: true, logo: true } },
      },
    })

    if (!teacher) {
      return res.status(404).json({ message: 'No teacher found with this Teacher ID' })
    }

    // Verify Date of Birth matches
    const inputDob = new Date(dateOfBirth).toISOString().slice(0, 10)
    const storedDob = teacher.dateOfBirth
      ? new Date(teacher.dateOfBirth).toISOString().slice(0, 10)
      : null

    if (!storedDob || inputDob !== storedDob) {
      return res.status(401).json({ message: 'Date of Birth does not match our records' })
    }

    // Issue a JWT so the teacher portal is authenticated
    const token = signToken({
      id: teacher.id,
      email: teacher.email || `teacher-${teacher.id}@portal`,
      role: 'portal-teacher',
      schoolId: teacher.schoolId,
    })

    logInfo(`Teacher portal login: ${teacher.firstName} ${teacher.lastName} (ID: ${teacherId})`, {
      filename: 'portalController.js',
      line: 65,
      schoolId: teacher.schoolId,
    })

    res.json({
      message: 'Teacher login successful',
      data: teacher,
      token,
      portalType: 'teacher',
    })
  } catch (error) {
    logError(`Teacher login error: ${error.message}`, {
      filename: 'portalController.js',
      line: 75,
      stack: error.stack,
    })
    next(error)
  }
}

// Get full student profile with attendance, marks, achievements
export const getStudentProfile = async (req, res, next) => {
  try {
    const { studentId } = req.params

    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId) },
      include: {
        class: true,
        section: true,
        school: { select: { id: true, name: true, logo: true } },
      },
    })

    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Get attendance, marks, achievements
    const [attendance, marks, achievements] = await Promise.all([
      prisma.attendance.findMany({
        where: { studentId: parseInt(studentId) },
        orderBy: { date: 'desc' },
      }),
      prisma.mark.findMany({
        where: { studentId: parseInt(studentId) },
        include: { exam: true },
      }),
      prisma.achievement.findMany({
        where: { studentId: parseInt(studentId) },
        orderBy: { achievementDate: 'desc' },
      }),
    ])

    // Get fees for this student
    const fees = await prisma.fee.findMany({
      where: { studentId: parseInt(studentId) },
      orderBy: { dueDate: 'desc' },
    })

    // Get events and announcements for the school
    const [events, announcements, sports] = await Promise.all([
      prisma.event.findMany({
        where: { schoolId: student.schoolId },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      prisma.announcement.findMany({
        where: { schoolId: student.schoolId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.sport.findMany({
        where: { schoolId: student.schoolId },
      }),
    ])

    res.json({
      data: {
        student,
        attendance,
        marks,
        achievements,
        fees,
        events,
        announcements,
        sports,
      },
    })
  } catch (error) {
    logError(`Get student profile error: ${error.message}`, {
      filename: 'portalController.js',
      line: 130,
      stack: error.stack,
    })
    next(error)
  }
}

// Get full teacher profile with classes
export const getTeacherProfile = async (req, res, next) => {
  try {
    const { teacherId } = req.params

    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(teacherId) },
      include: {
        classes: {
          include: {
            sections: true,
            students: { select: { id: true, firstName: true, lastName: true, rollNumber: true } },
          },
        },
        school: { select: { id: true, name: true, logo: true } },
      },
    })

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' })
    }

    // Get events and announcements for the school
    const [events, announcements, sports] = await Promise.all([
      prisma.event.findMany({
        where: { schoolId: teacher.schoolId },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      prisma.announcement.findMany({
        where: { schoolId: teacher.schoolId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.sport.findMany({
        where: { schoolId: teacher.schoolId },
      }),
    ])

    res.json({
      data: {
        teacher,
        events,
        announcements,
        sports,
      },
    })
  } catch (error) {
    logError(`Get teacher profile error: ${error.message}`, {
      filename: 'portalController.js',
      line: 180,
      stack: error.stack,
    })
    next(error)
  }
}
