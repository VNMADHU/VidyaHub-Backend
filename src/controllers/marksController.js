import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { logInfo, logError } from '../utils/logHelpers.js'

const prisma = new PrismaClient()

const marksSchema = z.object({
  studentId: z.number(),
  examId: z.number(),
  marks: z.number().min(0),
  subject: z.string().min(1),
})

export const listMarks = async (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || '1'
    logInfo('Listing all marks', {
      filename: 'marksController.js',
      line: 17,
      schoolId,
    })
    const marks = await prisma.mark.findMany({
      where: { 
        student: {
          schoolId: parseInt(schoolId)
        }
      },
      include: { student: true, exam: true },
    })
    res.json({ data: marks, message: 'List of marks' })
  } catch (error) {
    logError(`List marks error: ${error.message}`, {
      filename: 'marksController.js',
      line: 28,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const createMarks = async (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || '1'
    const payload = marksSchema.parse(req.body)
    
    const mark = await prisma.mark.create({
      data: {
        studentId: payload.studentId,
        examId: payload.examId,
        score: payload.marks,
        subject: payload.subject,
      },
      include: { student: true, exam: true },
    })
    
    logInfo(`Marks recorded - Student: ${payload.studentId}, Score: ${payload.marks}`, {
      filename: 'marksController.js',
      line: 52,
      schoolId,
    })
    res.status(201).json({ message: 'Marks recorded', data: mark })
  } catch (error) {
    logError(`Create marks error: ${error.message}`, {
      filename: 'marksController.js',
      line: 59,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const updateMarks = async (req, res, next) => {
  try {
    const { markId } = req.params
    const schoolId = req.body?.schoolId || '1'
    const payload = marksSchema.partial().parse(req.body)
    
    const updateData = {}
    if (payload.studentId !== undefined) updateData.studentId = payload.studentId
    if (payload.examId !== undefined) updateData.examId = payload.examId
    if (payload.marks !== undefined) updateData.score = payload.marks
    if (payload.subject !== undefined) updateData.subject = payload.subject
    
    const mark = await prisma.mark.update({
      where: { id: parseInt(markId) },
      data: updateData,
      include: { student: true, exam: true },
    })
    
    logInfo(`Marks updated: ${markId}`, {
      filename: 'marksController.js',
      line: 78,
      schoolId,
    })
    res.json({ message: 'Marks updated', data: mark })
  } catch (error) {
    logError(`Update marks error: ${error.message}`, {
      filename: 'marksController.js',
      line: 85,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const deleteMarks = async (req, res, next) => {
  try {
    const { markId } = req.params
    const schoolId = req.body?.schoolId || '1'
    
    await prisma.mark.delete({
      where: { id: parseInt(markId) },
    })
    
    logInfo(`Marks deleted: ${markId}`, {
      filename: 'marksController.js',
      line: 101,
      schoolId,
    })
    res.json({ message: 'Marks deleted successfully' })
  } catch (error) {
    logError(`Delete marks error: ${error.message}`, {
      filename: 'marksController.js',
      line: 108,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const getMarksReport = async (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || '1'
    const { studentId } = req.query
    
    logInfo(`Marks report requested for student ${studentId}`, {
      filename: 'marksController.js',
      line: 122,
      schoolId,
    })
    
    const marks = await prisma.mark.findMany({
      where: {
        schoolId: parseInt(schoolId),
        studentId: studentId ? parseInt(studentId) : undefined,
      },
      include: { exam: true },
    })
    
    const average = marks.length > 0
      ? Math.round(marks.reduce((sum, m) => sum + m.marks, 0) / marks.length)
      : 0
    
    res.json({
      report: {
        studentId: studentId || 'all',
        totalMarks: marks.length,
        averageMarks: average,
        marks,
      },
    })
  } catch (error) {
    logError(`Marks report error: ${error.message}`, {
      filename: 'marksController.js',
      line: 147,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}
