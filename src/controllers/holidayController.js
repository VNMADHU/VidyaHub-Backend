import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const holidaySchema = z.object({
  title: z.string().min(1),
  date: z.string(),
  toDate: z.string().optional().nullable(),
  type: z.enum(['national', 'regional', 'school', 'religious', 'seasonal']).optional(),
  description: z.string().optional().nullable(),
})

export const listHolidays = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    logInfo('Listing holidays', { filename: 'holidayController.js', schoolId })
    const holidays = await prisma.holiday.findMany({
      where: { schoolId: parseInt(schoolId) },
      orderBy: { date: 'asc' },
    })
    res.json({ data: holidays, message: 'List of holidays' })
  } catch (error) {
    logError(`List holidays error: ${error.message}`, { filename: 'holidayController.js' })
    next(error)
  }
}

export const createHoliday = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const validated = holidaySchema.parse(req.body)
    logInfo('Creating holiday', { filename: 'holidayController.js', schoolId })
    const holiday = await prisma.holiday.create({
      data: {
        ...validated,
        date: new Date(validated.date),
        toDate: validated.toDate ? new Date(validated.toDate) : null,
        schoolId: parseInt(schoolId),
      },
    })
    res.status(201).json({ data: holiday, message: 'Holiday created' })
  } catch (error) {
    logError(`Create holiday error: ${error.message}`, { filename: 'holidayController.js' })
    next(error)
  }
}

export const updateHoliday = async (req, res, next) => {
  try {
    const { holidayId } = req.params
    const data = { ...req.body }
    if (data.date) data.date = new Date(data.date)
    if (data.toDate) data.toDate = new Date(data.toDate)
    logInfo('Updating holiday', { filename: 'holidayController.js', holidayId })
    const holiday = await prisma.holiday.update({
      where: { id: parseInt(holidayId) },
      data,
    })
    res.json({ data: holiday, message: 'Holiday updated' })
  } catch (error) {
    logError(`Update holiday error: ${error.message}`, { filename: 'holidayController.js' })
    next(error)
  }
}

export const deleteHoliday = async (req, res, next) => {
  try {
    const { holidayId } = req.params
    logInfo('Deleting holiday', { filename: 'holidayController.js', holidayId })
    await prisma.holiday.delete({ where: { id: parseInt(holidayId) } })
    res.json({ message: 'Holiday deleted' })
  } catch (error) {
    logError(`Delete holiday error: ${error.message}`, { filename: 'holidayController.js' })
    next(error)
  }
}
