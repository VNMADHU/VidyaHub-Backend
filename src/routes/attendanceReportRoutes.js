import { Router } from 'express'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const router = Router()

/**
 * GET /attendance-report?classId=&month=&year=
 * Returns monthly attendance report for a class
 */
router.get('/', async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const { classId, month, year } = req.query

    if (!classId || !month || !year) {
      return res.status(400).json({ message: 'classId, month, and year are required' })
    }

    const m = parseInt(month)
    const y = parseInt(year)
    const startDate = new Date(y, m - 1, 1)
    const endDate = new Date(y, m, 0, 23, 59, 59) // last day of month

    logInfo(`Attendance report: class=${classId}, month=${m}/${y}`, {
      filename: 'attendanceReportRoutes.js',
      schoolId,
    })

    // Get all students in this class
    const students = await prisma.student.findMany({
      where: {
        schoolId: parseInt(schoolId),
        classId: parseInt(classId),
      },
      orderBy: [{ rollNumber: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rollNumber: true,
        admissionNumber: true,
      },
    })

    // Get all attendance records for these students in the date range
    const studentIds = students.map(s => s.id)
    const attendance = await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        date: { gte: startDate, lte: endDate },
      },
    })

    // Build a map: studentId -> { present, absent, late, total }
    const attendanceMap = {}
    attendance.forEach(a => {
      if (!attendanceMap[a.studentId]) {
        attendanceMap[a.studentId] = { present: 0, absent: 0, late: 0 }
      }
      if (a.status === 'present') attendanceMap[a.studentId].present++
      else if (a.status === 'absent') attendanceMap[a.studentId].absent++
      else if (a.status === 'late') attendanceMap[a.studentId].late++
    })

    // Calculate working days (unique dates in the attendance records)
    const uniqueDates = new Set(attendance.map(a => a.date.toISOString().slice(0, 10)))
    const workingDays = uniqueDates.size

    const report = students.map(s => {
      const att = attendanceMap[s.id] || { present: 0, absent: 0, late: 0 }
      const total = att.present + att.absent + att.late
      return {
        studentId: s.id,
        name: `${s.firstName} ${s.lastName}`,
        rollNumber: s.rollNumber || s.admissionNumber,
        present: att.present,
        absent: att.absent,
        late: att.late,
        totalMarked: total,
        percentage: total > 0 ? Math.round((( att.present + att.late) / total) * 100) : 0,
      }
    })

    res.json({
      data: {
        month: m,
        year: y,
        workingDays,
        classId: parseInt(classId),
        students: report,
      },
    })
  } catch (error) {
    logError(`Attendance report error: ${error.message}`, {
      filename: 'attendanceReportRoutes.js',
      schoolId: req.schoolId,
    })
    next(error)
  }
})

export default router
