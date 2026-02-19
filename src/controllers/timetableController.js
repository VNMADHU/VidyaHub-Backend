import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const timetableSchema = z.object({
  classId: z.number({ coerce: true }).int().positive(),
  day: z.enum(DAYS),
  periodId: z.number({ coerce: true }).int().positive(),
  subject: z.string().min(1),
  teacher: z.string().min(1),
  effectiveFrom: z.string().optional(),
})

export const listTimetables = async (req, res, next) => {
  try {
    const { classId, date } = req.query
    const where = {}
    if (classId) where.classId = parseInt(classId)

    // If a date is provided, show entries effective on/before that date
    if (date) {
      where.effectiveFrom = { lte: new Date(date) }
    }

    const timetables = await prisma.timetable.findMany({
      where,
      include: { class: true },
      orderBy: [{ day: 'asc' }, { periodId: 'asc' }],
    })

    // If date is provided, keep only the latest effective entry per class+day+period
    let result = timetables
    if (date) {
      const latest = {}
      for (const t of timetables) {
        const key = `${t.classId}-${t.day}-${t.periodId}`
        if (!latest[key] || new Date(t.effectiveFrom) > new Date(latest[key].effectiveFrom)) {
          latest[key] = t
        }
      }
      result = Object.values(latest)
    }

    logInfo('Listing timetables', { filename: 'timetableController.js', classId, date })
    res.json({ data: result, message: 'List of timetable entries' })
  } catch (error) {
    logError(`List timetables error: ${error.message}`, { filename: 'timetableController.js' })
    next(error)
  }
}

export const createTimetable = async (req, res, next) => {
  try {
    const payload = timetableSchema.parse(req.body)
    const effectiveFrom = payload.effectiveFrom ? new Date(payload.effectiveFrom) : new Date()

    // Check for conflicts: same class, same day, same period, same effectiveFrom date
    const existing = await prisma.timetable.findFirst({
      where: {
        classId: payload.classId,
        day: payload.day,
        periodId: payload.periodId,
        effectiveFrom,
      },
    })
    if (existing) {
      return res.status(409).json({
        message: `This period on ${payload.day} already has an entry for the selected effective date`,
      })
    }

    const entry = await prisma.timetable.create({
      data: {
        classId: payload.classId,
        day: payload.day,
        periodId: payload.periodId,
        subject: payload.subject,
        teacher: payload.teacher,
        effectiveFrom,
      },
    })
    logInfo(`Timetable created: ${payload.day} periodId=${payload.periodId}`, { filename: 'timetableController.js' })
    res.status(201).json({ message: 'Timetable entry created', data: entry })
  } catch (error) {
    logError(`Create timetable error: ${error.message}`, { filename: 'timetableController.js' })
    next(error)
  }
}

export const updateTimetable = async (req, res, next) => {
  try {
    const { id } = req.params
    const raw = timetableSchema.partial().parse(req.body)
    const payload = { ...raw }
    if (payload.effectiveFrom) {
      payload.effectiveFrom = new Date(payload.effectiveFrom)
    }

    if (payload.day || payload.periodId || payload.classId) {
      const current = await prisma.timetable.findUnique({ where: { id: parseInt(id) } })
      if (!current) return res.status(404).json({ message: 'Timetable entry not found' })

      const checkDay = payload.day || current.day
      const checkPeriod = payload.periodId || current.periodId
      const checkClass = payload.classId || current.classId
      const checkDate = payload.effectiveFrom || current.effectiveFrom

      const conflict = await prisma.timetable.findFirst({
        where: {
          classId: checkClass,
          day: checkDay,
          periodId: checkPeriod,
          effectiveFrom: checkDate,
          NOT: { id: parseInt(id) },
        },
      })
      if (conflict) {
        return res.status(409).json({
          message: `This period on ${checkDay} already has an entry for the selected effective date`,
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
