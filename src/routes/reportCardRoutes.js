import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const router = Router()

/**
 * GET /report-card/:studentId
 * Returns full report card data: student info, school info, all exams with marks, attendance summary
 */
router.get('/:studentId', async (req, res, next) => {
  try {
    const { studentId } = req.params
    const schoolId = req.schoolId

    logInfo(`Report card requested for student ${studentId}`, {
      filename: 'reportCardRoutes.js',
      schoolId,
    })

    // Get student with class & section
    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId) },
      include: {
        class: true,
        section: true,
        school: true,
      },
    })

    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Get all marks for this student, grouped by exam
    const marks = await prisma.mark.findMany({
      where: { studentId: parseInt(studentId) },
      include: { exam: true },
      orderBy: [{ exam: { name: 'asc' } }, { subject: 'asc' }],
    })

    // Group marks by exam
    const examMap = {}
    marks.forEach(mark => {
      const examName = mark.exam?.name || 'Unknown'
      if (!examMap[examName]) {
        examMap[examName] = { examId: mark.examId, examName, marks: [] }
      }
      examMap[examName].marks.push({
        id: mark.id,
        subject: mark.subject,
        score: mark.score,
        maxScore: mark.maxScore || 100,
      })
    })

    const exams = Object.values(examMap)

    // Get attendance summary for this student
    const totalAttendance = await prisma.attendance.count({
      where: { studentId: parseInt(studentId) },
    })
    const presentDays = await prisma.attendance.count({
      where: {
        studentId: parseInt(studentId),
        status: { in: ['present', 'late'] },
      },
    })

    res.json({
      data: {
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          admissionNumber: student.admissionNumber,
          rollNumber: student.rollNumber,
          dateOfBirth: student.dateOfBirth,
          fatherName: student.fatherName,
          motherName: student.motherName,
          category: student.category,
          className: student.class?.name || 'N/A',
          sectionName: student.section?.name || '',
        },
        school: {
          name: student.school?.name || '',
          address: student.school?.address || '',
          boardType: student.school?.boardType || '',
          schoolCode: student.school?.schoolCode || '',
          academicYear: student.school?.academicYear || '2025-26',
        },
        exams,
        attendance: {
          totalDays: totalAttendance,
          presentDays,
          percentage: totalAttendance > 0 ? Math.round((presentDays / totalAttendance) * 100) : 0,
        },
      },
    })
  } catch (error) {
    logError(`Report card error: ${error.message}`, {
      filename: 'reportCardRoutes.js',
      schoolId: req.schoolId,
    })
    next(error)
  }
})

export default router
