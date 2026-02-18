import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { logInfo, logError } from '../utils/logHelpers.js'

const prisma = new PrismaClient()

const examSchema = z.object({
  name: z.string().min(1),
  classId: z.number().optional().nullable(),
  sectionId: z.number().optional().nullable(),
})

export const listExams = async (req, res, next) => {
  try {
    const { classId, sectionId } = req.query
    logInfo('Listing all exams', {
      filename: 'examController.js',
      line: 14,
    })

    const where = {}
    if (classId) where.classId = parseInt(classId)
    if (sectionId) where.sectionId = parseInt(sectionId)

    const exams = await prisma.exam.findMany({
      where,
      include: {
        marks: true,
        class: true,
        section: true,
      },
    })
    res.json({ data: exams, message: 'List of exams' })
  } catch (error) {
    logError(`List exams error: ${error.message}`, {
      filename: 'examController.js',
      line: 25,
    })
    next(error)
  }
}

export const createExam = async (req, res, next) => {
  try {
    const payload = examSchema.parse(req.body)
    
    const exam = await prisma.exam.create({
      data: {
        name: payload.name,
        classId: payload.classId || null,
        sectionId: payload.sectionId || null,
      },
      include: {
        class: true,
        section: true,
      },
    })
    
    logInfo(`Exam created: ${payload.name}`, {
      filename: 'examController.js',
      line: 42,
    })
    res.status(201).json({ message: 'Exam created', data: exam })
  } catch (error) {
    logError(`Create exam error: ${error.message}`, {
      filename: 'examController.js',
      line: 48,
    })
    next(error)
  }
}

export const updateExam = async (req, res, next) => {
  try {
    const { examId } = req.params
    const payload = examSchema.partial().parse(req.body)
    
    const updateData = {}
    if (payload.name !== undefined) updateData.name = payload.name
    if (payload.classId !== undefined) updateData.classId = payload.classId || null
    if (payload.sectionId !== undefined) updateData.sectionId = payload.sectionId || null

    const exam = await prisma.exam.update({
      where: { id: parseInt(examId) },
      data: updateData,
      include: {
        class: true,
        section: true,
      },
    })
    
    logInfo(`Exam updated: ${examId}`, {
      filename: 'examController.js',
      line: 65,
    })
    res.json({ message: 'Exam updated', data: exam })
  } catch (error) {
    logError(`Update exam error: ${error.message}`, {
      filename: 'examController.js',
      line: 71,
    })
    next(error)
  }
}

export const deleteExam = async (req, res, next) => {
  try {
    const { examId } = req.params
    
    await prisma.exam.delete({
      where: { id: parseInt(examId) },
    })
    
    logInfo(`Exam deleted: ${examId}`, {
      filename: 'examController.js',
      line: 85,
    })
    res.json({ message: 'Exam deleted successfully' })
  } catch (error) {
    logError(`Delete exam error: ${error.message}`, {
      filename: 'examController.js',
      line: 91,
    })
    next(error)
  }
}
