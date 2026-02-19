import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const periodSchema = z.object({
  name: z.string().min(1),
  startTime: z.string().min(1), // "08:00"
  endTime: z.string().min(1),   // "08:45"
  sortOrder: z.number({ coerce: true }).int().min(0),
  isBreak: z.boolean().optional().default(false),
})

export const listPeriods = async (req, res, next) => {
  try {
    const schoolId = parseInt(req.headers['x-school-id'])
    const periods = await prisma.period.findMany({
      where: { schoolId },
      orderBy: { sortOrder: 'asc' },
    })
    logInfo('Listing periods', { filename: 'periodController.js', schoolId })
    res.json({ data: periods, message: 'List of periods' })
  } catch (error) {
    logError(`List periods error: ${error.message}`, { filename: 'periodController.js' })
    next(error)
  }
}

export const createPeriod = async (req, res, next) => {
  try {
    const schoolId = parseInt(req.headers['x-school-id'])
    const payload = periodSchema.parse(req.body)

    const period = await prisma.period.create({
      data: { ...payload, schoolId },
    })
    logInfo(`Period created: ${payload.name}`, { filename: 'periodController.js' })
    res.status(201).json({ message: 'Period created', data: period })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Period name or sort order already exists for this school' })
    }
    logError(`Create period error: ${error.message}`, { filename: 'periodController.js' })
    next(error)
  }
}

export const updatePeriod = async (req, res, next) => {
  try {
    const { id } = req.params
    const payload = periodSchema.partial().parse(req.body)

    const period = await prisma.period.update({
      where: { id: parseInt(id) },
      data: payload,
    })
    logInfo(`Period updated: id=${id}`, { filename: 'periodController.js' })
    res.json({ message: 'Period updated', data: period })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Period name or sort order already exists for this school' })
    }
    logError(`Update period error: ${error.message}`, { filename: 'periodController.js' })
    next(error)
  }
}

export const deletePeriod = async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.period.delete({ where: { id: parseInt(id) } })
    logInfo(`Period deleted: id=${id}`, { filename: 'periodController.js' })
    res.json({ message: 'Period deleted' })
  } catch (error) {
    logError(`Delete period error: ${error.message}`, { filename: 'periodController.js' })
    next(error)
  }
}
