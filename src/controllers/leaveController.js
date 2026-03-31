import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'
import { sendSMS, fillTemplate } from '../services/smsService.js'

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

    // Only super-admin can approve or reject a leave
    if ((data.status === 'approved' || data.status === 'rejected') && req.user?.role !== 'super-admin') {
      return res.status(403).json({ message: 'Only Super Admin can approve or reject leave applications.' })
    }

    if (data.fromDate) data.fromDate = new Date(data.fromDate)
    if (data.toDate) data.toDate = new Date(data.toDate)
    logInfo('Updating leave', { filename: 'leaveController.js', leaveId })
    const leave = await prisma.leave.update({
      where: { id: parseInt(leaveId) },
      data,
    })

    // Send SMS to employee when leave is approved or rejected (fire-and-forget)
    if (data.status === 'approved' || data.status === 'rejected') {
      setImmediate(async () => {
        try {
          const school = await prisma.school.findUnique({ where: { id: leave.schoolId }, select: { name: true, smsEnabled: true, smsOnLeaveApproved: true } })
          if (school?.smsEnabled && school?.smsOnLeaveApproved) {
            let phone = null
            if (leave.employeeType === 'teacher' && leave.employeeId) {
              const teacher = await prisma.teacher.findUnique({ where: { id: leave.employeeId }, select: { phoneNumber: true } })
              phone = teacher?.phoneNumber
            } else if (leave.employeeType === 'staff' && leave.employeeId) {
              const staff = await prisma.staff.findUnique({ where: { id: leave.employeeId }, select: { phoneNumber: true } })
              phone = staff?.phoneNumber
            } else if (leave.employeeType === 'driver' && leave.employeeId) {
              const driver = await prisma.driver.findUnique({ where: { id: leave.employeeId }, select: { phone: true } })
              phone = driver?.phone
            }
            if (phone) {
              const tpl = process.env.SAPTELE_LEAVE_TEMPLATE || 'Dear {employeeName}, your leave application from {fromDate} to {toDate} has been {status}. - {schoolName}'
              const msg = fillTemplate(tpl, { employeeName: leave.employeeName, fromDate: leave.fromDate.toISOString().split('T')[0], toDate: leave.toDate.toISOString().split('T')[0], status: data.status, schoolName: school.name })
              await sendSMS({ to: phone, message: msg, templateId: process.env.SAPTELE_LEAVE_TEMPLATE_ID }).catch(() => {})
            }
          }
        } catch (e) { /* SMS failure must not break the main response */ }
      })
    }

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
