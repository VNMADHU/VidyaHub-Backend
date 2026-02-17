import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { logInfo, logError } from '../utils/logHelpers.js'

const prisma = new PrismaClient()

const examSchema = z.object({
  name: z.string().min(1),
})

export const listExams = async (req, res, next) => {
  try {
    logInfo('Listing all exams', {
      filename: 'examController.js',
      line: 14,
    })
    const exams = await prisma.exam.findMany({
      include: {
        marks: true,
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
      data: payload,
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
    
    const exam = await prisma.exam.update({
      where: { id: parseInt(examId) },
      data: payload,
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
