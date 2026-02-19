import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const homeworkSchema = z.object({
  classId: z.coerce.number().int(),
  sectionId: z.coerce.number().int().optional(),
  subject: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().default(''),
  dueDate: z.string().min(1),  // ISO date
  assignedBy: z.string().optional().default(''),
})

export const listHomework = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const { classId } = req.query

    const where = { schoolId: parseInt(schoolId) }
    if (classId) where.classId = parseInt(classId)

    const homework = await prisma.homework.findMany({
      where,
      include: { class: true, section: true },
      orderBy: { dueDate: 'desc' },
    })

    logInfo('Listing homework', { filename: 'homeworkController.js', schoolId })
    res.json({ data: homework, message: 'List of homework' })
  } catch (error) {
    logError(`List homework error: ${error.message}`, { filename: 'homeworkController.js', schoolId: req.schoolId })
    next(error)
  }
}

export const createHomework = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const payload = homeworkSchema.parse(req.body)

    const homework = await prisma.homework.create({
      data: {
        schoolId: parseInt(schoolId),
        classId: payload.classId,
        sectionId: payload.sectionId || null,
        subject: payload.subject,
        title: payload.title,
        description: payload.description,
        dueDate: new Date(payload.dueDate),
        assignedBy: payload.assignedBy,
      },
      include: { class: true, section: true },
    })

    logInfo(`Homework created: ${homework.id}`, { filename: 'homeworkController.js', schoolId })
    res.status(201).json({ message: 'Homework assigned', data: homework })
  } catch (error) {
    logError(`Create homework error: ${error.message}`, { filename: 'homeworkController.js', schoolId: req.schoolId })
    next(error)
  }
}

export const updateHomework = async (req, res, next) => {
  try {
    const { id } = req.params
    const payload = homeworkSchema.partial().parse(req.body)
    const updateData = { ...payload }
    if (payload.dueDate) updateData.dueDate = new Date(payload.dueDate)

    const homework = await prisma.homework.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { class: true, section: true },
    })

    logInfo(`Homework updated: ${id}`, { filename: 'homeworkController.js', schoolId: req.schoolId })
    res.json({ message: 'Homework updated', data: homework })
  } catch (error) {
    logError(`Update homework error: ${error.message}`, { filename: 'homeworkController.js', schoolId: req.schoolId })
    next(error)
  }
}

export const deleteHomework = async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.homework.delete({ where: { id: parseInt(id) } })
    logInfo(`Homework deleted: ${id}`, { filename: 'homeworkController.js', schoolId: req.schoolId })
    res.json({ message: 'Homework deleted' })
  } catch (error) {
    logError(`Delete homework error: ${error.message}`, { filename: 'homeworkController.js', schoolId: req.schoolId })
    next(error)
  }
}
