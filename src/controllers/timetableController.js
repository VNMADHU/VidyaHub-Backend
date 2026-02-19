import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const timetableSchema = z.object({
  classId: z.number({ coerce: true }).int().positive(),
  day: z.enum(DAYS),
  period: z.number({ coerce: true }).int().min(1).max(10),
  subject: z.string().min(1),
  teacher: z.string().min(1),
})

export const listTimetables = async (req, res, next) => {
  try {
    const { classId } = req.query
    const where = {}
    if (classId) where.classId = parseInt(classId)

    const timetables = await prisma.timetable.findMany({
      where,
      include: { class: true },
      orderBy: [{ day: 'asc' }, { period: 'asc' }],
    })
    logInfo('Listing timetables', { filename: 'timetableController.js', classId })
    res.json({ data: timetables, message: 'List of timetable entries' })
  } catch (error) {
    logError(`List timetables error: ${error.message}`, { filename: 'timetableController.js' })
    next(error)
  }
}

export const createTimetable = async (req, res, next) => {
  try {
    const payload = timetableSchema.parse(req.body)

    // Check for conflicts: same class, same day, same period
    const existing = await prisma.timetable.findFirst({
      where: {
        classId: payload.classId,
        day: payload.day,
        period: payload.period,
      },
    })
    if (existing) {
      return res.status(409).json({
        message: `Period ${payload.period} on ${payload.day} is already assigned to ${existing.subject}`,
      })
    }

    const entry = await prisma.timetable.create({ data: payload })
    logInfo(`Timetable created: ${payload.day} P${payload.period}`, { filename: 'timetableController.js' })
    res.status(201).json({ message: 'Timetable entry created', data: entry })
  } catch (error) {
    logError(`Create timetable error: ${error.message}`, { filename: 'timetableController.js' })
    next(error)
  }
}

export const updateTimetable = async (req, res, next) => {
  try {
    const { id } = req.params
    const payload = timetableSchema.partial().parse(req.body)

    // If day/period/classId changed, check conflicts
    if (payload.day || payload.period || payload.classId) {
      const current = await prisma.timetable.findUnique({ where: { id: parseInt(id) } })
      if (!current) return res.status(404).json({ message: 'Timetable entry not found' })

      const checkDay = payload.day || current.day
      const checkPeriod = payload.period || current.period
      const checkClass = payload.classId || current.classId

      const conflict = await prisma.timetable.findFirst({
        where: {
          classId: checkClass,
          day: checkDay,
          period: checkPeriod,
          NOT: { id: parseInt(id) },
        },
      })
      if (conflict) {
        return res.status(409).json({
          message: `Period ${checkPeriod} on ${checkDay} is already assigned to ${conflict.subject}`,
        })
      }
    }

    const entry = await prisma.timetable.update({
      where: { id: parseInt(id) },
      data: payload,
    })
    logInfo(`Timetable updated: id=${id}`, { filename: 'timetableController.js' })
    res.json({ message: 'Timetable entry updated', data: entry })
  } catch (error) {
    logError(`Update timetable error: ${error.message}`, { filename: 'timetableController.js' })
    next(error)
  }
}

export const deleteTimetable = async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.timetable.delete({ where: { id: parseInt(id) } })
    logInfo(`Timetable deleted: id=${id}`, { filename: 'timetableController.js' })
    res.json({ message: 'Timetable entry deleted' })
  } catch (error) {
    logError(`Delete timetable error: ${error.message}`, { filename: 'timetableController.js' })
    next(error)
  }
}
