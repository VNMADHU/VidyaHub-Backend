import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'


const attendanceSchema = z.object({
  studentId: z.number(),
  date: z.string(),
  status: z.enum(['present', 'absent', 'late']),
})

export const listAttendance = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    logInfo('Listing all attendance records', {
      filename: 'attendanceController.js',
      line: 17,
      schoolId,
    })
    const attendance = await prisma.attendance.findMany({
      where: {
        student: {
          schoolId: parseInt(schoolId)
        }
      },
      include: { student: true },
    })
    res.json({ data: attendance, message: 'List of attendance' })
  } catch (error) {
    logError(`List attendance error: ${error.message}`, {
      filename: 'attendanceController.js',
      line: 28,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const createAttendance = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const payload = attendanceSchema.parse(req.body)
    
    // Convert date string to Date object
    const attendanceData = {
      studentId: payload.studentId,
      status: payload.status,
      date: new Date(payload.date)
    }
    
    const attendance = await prisma.attendance.create({
      data: attendanceData,
    })
    
    logInfo(`Attendance recorded for student ${payload.studentId}`, {
      filename: 'attendanceController.js',
      line: 48,
      schoolId,
    })
    res.status(201).json({ message: 'Attendance recorded', data: attendance })
  } catch (error) {
    logError(`Create attendance error: ${error.message}`, {
      filename: 'attendanceController.js',
      line: 55,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const updateAttendance = async (req, res, next) => {
  try {
    const { attendanceId } = req.params
    const schoolId = req.schoolId
    const payload = attendanceSchema.partial().parse(req.body)
    
    const attendance = await prisma.attendance.update({
      where: { id: parseInt(attendanceId) },
      data: payload,
    })
    
    logInfo(`Attendance updated: ${attendanceId}`, {
      filename: 'attendanceController.js',
      line: 72,
      schoolId,
    })
    res.json({ message: 'Attendance updated', data: attendance })
  } catch (error) {
    logError(`Update attendance error: ${error.message}`, {
      filename: 'attendanceController.js',
      line: 79,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const deleteAttendance = async (req, res, next) => {
  try {
    const { attendanceId } = req.params
    const schoolId = req.schoolId
    
    await prisma.attendance.delete({
      where: { id: parseInt(attendanceId) },
    })
    
    logInfo(`Attendance deleted: ${attendanceId}`, {
      filename: 'attendanceController.js',
      line: 95,
      schoolId,
    })
    res.json({ message: 'Attendance deleted successfully' })
  } catch (error) {
    logError(`Delete attendance error: ${error.message}`, {
      filename: 'attendanceController.js',
      line: 102,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const bulkUpsertAttendance = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const { date, status, toCreate = [], toUpdate = [] } = req.body

    if (!date || !status) {
      return res.status(400).json({ message: 'date and status are required' })
    }
    if (!['present', 'absent', 'late'].includes(status)) {
      return res.status(400).json({ message: 'status must be present, absent, or late' })
    }

    const dateObj = new Date(date)
    const createIds = toCreate.map(Number).filter(n => !isNaN(n))
    const updateIds = toUpdate.map(Number).filter(n => !isNaN(n))

    const ops = []
    if (updateIds.length > 0) {
      ops.push(
        prisma.attendance.updateMany({
          where: { id: { in: updateIds } },
          data: { status },
        })
      )
    }
    if (createIds.length > 0) {
      ops.push(
        prisma.attendance.createMany({
          data: createIds.map(studentId => ({ studentId, date: dateObj, status })),
          skipDuplicates: true,
        })
      )
    }

    if (ops.length > 0) {
      await prisma.$transaction(ops)
    }

    logInfo(`Bulk attendance: ${createIds.length} created, ${updateIds.length} updated`, {
      filename: 'attendanceController.js',
      schoolId,
    })
    res.json({ message: 'Bulk attendance updated', created: createIds.length, updated: updateIds.length })
  } catch (error) {
    logError(`Bulk attendance error: ${error.message}`, {
      filename: 'attendanceController.js',
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const getAttendanceSummary = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    logInfo('Attendance summary requested', {
      filename: 'attendanceController.js',
      line: 115,
      schoolId,
    })
    const totalRecords = await prisma.attendance.count({
      where: { schoolId: parseInt(schoolId) },
    })
    const presentCount = await prisma.attendance.count({
      where: { schoolId: parseInt(schoolId), status: 'present' },
    })
    
    const percentage = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0
    
    res.json({
      summary: {
        totalRecords,
        presentCount,
        absentCount: totalRecords - presentCount,
        attendancePercentage: percentage,
      },
    })
  } catch (error) {
    logError(`Attendance summary error: ${error.message}`, {
      filename: 'attendanceController.js',
      line: 135,
      schoolId: req.schoolId,
    })
    next(error)
  }
}
