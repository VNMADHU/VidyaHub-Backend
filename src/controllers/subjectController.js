import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const subjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(10),
})

export const listSubjects = async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } })
    logInfo('Listing subjects', { filename: 'subjectController.js' })
    res.json({ data: subjects, message: 'List of subjects' })
  } catch (error) {
    logError(`List subjects error: ${error.message}`, { filename: 'subjectController.js' })
    next(error)
  }
}

export const createSubject = async (req, res, next) => {
  try {
    const payload = subjectSchema.parse(req.body)
    const subject = await prisma.subject.create({ data: payload })
    logInfo(`Subject created: ${payload.name}`, { filename: 'subjectController.js' })
    res.status(201).json({ message: 'Subject created', data: subject })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Subject name or code already exists' })
    }
    logError(`Create subject error: ${error.message}`, { filename: 'subjectController.js' })
    next(error)
  }
}

export const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params
    const payload = subjectSchema.partial().parse(req.body)
    const subject = await prisma.subject.update({
      where: { id: parseInt(id) },
      data: payload,
    })
    logInfo(`Subject updated: id=${id}`, { filename: 'subjectController.js' })
    res.json({ message: 'Subject updated', data: subject })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Subject name or code already exists' })
    }
    logError(`Update subject error: ${error.message}`, { filename: 'subjectController.js' })
    next(error)
  }
}

export const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.subject.delete({ where: { id: parseInt(id) } })
    logInfo(`Subject deleted: id=${id}`, { filename: 'subjectController.js' })
    res.json({ message: 'Subject deleted' })
  } catch (error) {
    logError(`Delete subject error: ${error.message}`, { filename: 'subjectController.js' })
    next(error)
  }
}
