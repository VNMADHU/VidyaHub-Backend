import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { logInfo, logError } from '../utils/logHelpers.js'

const prisma = new PrismaClient()

const feeSchema = z.object({
  studentId: z.preprocess((val) => Number(val), z.number().int()),
  feeType: z.string().min(1),
  description: z.string().optional(),
  amount: z.preprocess((val) => Number(val), z.number().positive()),
  dueDate: z.string().min(1),
  status: z.enum(['pending', 'paid', 'overdue', 'partial']).optional(),
  paidAmount: z.preprocess((val) => (val === '' || val === null || val === undefined ? 0 : Number(val)), z.number().optional()),
  paidDate: z.string().optional().nullable(),
  paymentMode: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  academicYear: z.string().optional(),
  term: z.string().optional(),
})

// List all fees (optionally filter by studentId)
export const listFees = async (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || '1'
    const { studentId } = req.query

    const where = { schoolId: parseInt(schoolId) }
    if (studentId) {
      where.studentId = parseInt(studentId)
    }

    logInfo('Listing fees', {
      filename: 'feeController.js',
      line: 30,
      schoolId,
    })

    const fees = await prisma.fee.findMany({
      where,
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, admissionNumber: true, rollNumber: true, classId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: fees, message: 'List of fees' })
  } catch (error) {
    logError(`List fees error: ${error.message}`, {
      filename: 'feeController.js',
      line: 45,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

// Get a single fee
export const getFee = async (req, res, next) => {
  try {
    const { feeId } = req.params

    const fee = await prisma.fee.findUnique({
      where: { id: parseInt(feeId) },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, admissionNumber: true, rollNumber: true },
        },
      },
    })

    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' })
    }

    res.json(fee)
  } catch (error) {
    logError(`Get fee error: ${error.message}`, {
      filename: 'feeController.js',
      line: 72,
    })
    next(error)
  }
}

// Create a fee record
export const createFee = async (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || '1'
    const payload = feeSchema.parse(req.body)

    const fee = await prisma.fee.create({
      data: {
        ...payload,
        schoolId: parseInt(schoolId),
        dueDate: new Date(payload.dueDate),
        paidDate: payload.paidDate ? new Date(payload.paidDate) : null,
        paidAmount: payload.paidAmount || 0,
      },
    })

    logInfo(`Fee created for student ${payload.studentId}: ${payload.feeType} - ₹${payload.amount}`, {
      filename: 'feeController.js',
      line: 95,
      schoolId,
    })
    res.status(201).json({ message: 'Fee record created', data: fee })
  } catch (error) {
    logError(`Create fee error: ${error.message}`, {
      filename: 'feeController.js',
      line: 100,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

// Update a fee record (e.g., mark as paid)
export const updateFee = async (req, res, next) => {
  try {
    const { feeId } = req.params
    const schoolId = req.body?.schoolId || '1'
    const payload = feeSchema.partial().parse(req.body)

    const updateData = { ...payload }
    if (payload.dueDate) updateData.dueDate = new Date(payload.dueDate)
    if (payload.paidDate) updateData.paidDate = new Date(payload.paidDate)

    const fee = await prisma.fee.update({
      where: { id: parseInt(feeId) },
      data: updateData,
    })

    logInfo(`Fee updated: ${feeId}`, {
      filename: 'feeController.js',
      line: 125,
      schoolId,
    })
    res.json({ message: 'Fee record updated', data: fee })
  } catch (error) {
    logError(`Update fee error: ${error.message}`, {
      filename: 'feeController.js',
      line: 130,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

// Pay a fee (mark as paid)
export const payFee = async (req, res, next) => {
  try {
    const { feeId } = req.params
    const { paymentMode, transactionId, paidAmount } = req.body

    const fee = await prisma.fee.findUnique({ where: { id: parseInt(feeId) } })
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' })
    }

    const amountToPay = paidAmount ? parseFloat(paidAmount) : fee.amount
    const totalPaid = (fee.paidAmount || 0) + amountToPay
    const newStatus = totalPaid >= fee.amount ? 'paid' : 'partial'

    const updatedFee = await prisma.fee.update({
      where: { id: parseInt(feeId) },
      data: {
        status: newStatus,
        paidAmount: totalPaid,
        paidDate: new Date(),
        paymentMode: paymentMode || 'online',
        transactionId: transactionId || `TXN-${Date.now()}`,
      },
    })

    logInfo(`Fee paid: ${feeId} - ₹${amountToPay} via ${paymentMode || 'online'}`, {
      filename: 'feeController.js',
      line: 165,
    })
    res.json({ message: 'Payment recorded successfully', data: updatedFee })
  } catch (error) {
    logError(`Pay fee error: ${error.message}`, {
      filename: 'feeController.js',
      line: 170,
    })
    next(error)
  }
}

// Delete a fee record
export const deleteFee = async (req, res, next) => {
  try {
    const { feeId } = req.params
    const schoolId = req.body?.schoolId || '1'

    await prisma.fee.delete({
      where: { id: parseInt(feeId) },
    })

    logInfo(`Fee deleted: ${feeId}`, {
      filename: 'feeController.js',
      line: 185,
      schoolId,
    })
    res.json({ message: 'Fee record deleted successfully' })
  } catch (error) {
    logError(`Delete fee error: ${error.message}`, {
      filename: 'feeController.js',
      line: 190,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

// Get fee summary for a student (used by student portal)
export const getStudentFees = async (req, res, next) => {
  try {
    const { studentId } = req.params

    const fees = await prisma.fee.findMany({
      where: { studentId: parseInt(studentId) },
      orderBy: { dueDate: 'desc' },
    })

    const totalFees = fees.reduce((sum, f) => sum + f.amount, 0)
    const totalPaid = fees.reduce((sum, f) => sum + (f.paidAmount || 0), 0)
    const totalPending = totalFees - totalPaid
    const pendingCount = fees.filter(f => f.status === 'pending' || f.status === 'overdue').length

    res.json({
      data: fees,
      summary: {
        totalFees,
        totalPaid,
        totalPending,
        pendingCount,
        totalRecords: fees.length,
      },
    })
  } catch (error) {
    logError(`Get student fees error: ${error.message}`, {
      filename: 'feeController.js',
      line: 220,
    })
    next(error)
  }
}
