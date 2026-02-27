import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const leaveSchema = z.object({
  employeeType: z.enum(['teacher', 'driver', 'staff']),
  employeeId: z.number().int().optional().nullable(),
  employeeName: z.string().min(1),
  leaveType: z.enum(['sick', 'casual', 'annual', 'maternity', 'paternity', 'emergency', 'unpaid']),
  fromDate: z.string(),
  toDate: z.string(),
  days: z.number().int().positive(),
  reason: z.string().min(1),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  approvedBy: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
})

export const listLeaves = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const { employeeType, status } = req.query
    logInfo('Listing leaves', { filename: 'leaveController.js', schoolId })
    const leaves = await prisma.leave.findMany({
      where: {
        schoolId: parseInt(schoolId),
        ...(employeeType ? { employeeType } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { fromDate: 'desc' },
    })
    res.json({ data: leaves, message: 'List of leaves' })
  } catch (error) {
    logError(`List leaves error: ${error.message}`, { filename: 'leaveController.js' })
    next(error)
  }
}

export const createLeave = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const validated = leaveSchema.parse(req.body)
    logInfo('Creating leave', { filename: 'leaveController.js', schoolId })
    const leave = await prisma.leave.create({
      data: {
        ...validated,
        fromDate: new Date(validated.fromDate),
        toDate: new Date(validated.toDate),
        schoolId: parseInt(schoolId),
      },
    })
    res.status(201).json({ data: leave, message: 'Leave application created' })
  } catch (error) {
    logError(`Create leave error: ${error.message}`, { filename: 'leaveController.js' })
    next(error)
  }
}

export const updateLeave = async (req, res, next) => {
  try {
    const { leaveId } = req.params
    const data = { ...req.body }
    if (data.fromDate) data.fromDate = new Date(data.fromDate)
    if (data.toDate) data.toDate = new Date(data.toDate)
    logInfo('Updating leave', { filename: 'leaveController.js', leaveId })
    const leave = await prisma.leave.update({
      where: { id: parseInt(leaveId) },
      data,
    })
    res.json({ data: leave, message: 'Leave updated' })
  } catch (error) {
    logError(`Update leave error: ${error.message}`, { filename: 'leaveController.js' })
    next(error)
  }
}

export const deleteLeave = async (req, res, next) => {
  try {
    const { leaveId } = req.params
    logInfo('Deleting leave', { filename: 'leaveController.js', leaveId })
    await prisma.leave.delete({ where: { id: parseInt(leaveId) } })
    res.json({ message: 'Leave deleted' })
  } catch (error) {
    logError(`Delete leave error: ${error.message}`, { filename: 'leaveController.js' })
    next(error)
  }
}
