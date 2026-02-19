import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'


const sportSchema = z.object({
  name: z.string().min(1),
  coachName: z.string().optional(),
  schedule: z.string().optional(),
  description: z.string().optional(),
})

export const listSports = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    logInfo('Listing all sports', {
      filename: 'sportController.js',
      line: 17,
      schoolId,
    })
    const sports = await prisma.sport.findMany({
      where: { schoolId: parseInt(schoolId) },
    })
    res.json({ data: sports, message: 'List of sports' })
  } catch (error) {
    logError(`List sports error: ${error.message}`, {
      filename: 'sportController.js',
      line: 28,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const createSport = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const payload = sportSchema.parse(req.body)
    
    const sport = await prisma.sport.create({
      data: {
        name: payload.name,
        coachName: payload.coachName || '',
        schedule: payload.schedule || '',
        description: payload.description || '',
        schoolId: parseInt(schoolId),
      },
    })
    
    logInfo(`Sport created: ${payload.name}`, {
      filename: 'sportController.js',
      line: 50,
      schoolId,
    })
    res.status(201).json({ message: 'Sport created', data: sport })
  } catch (error) {
    logError(`Create sport error: ${error.message}`, {
      filename: 'sportController.js',
      line: 57,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const updateSport = async (req, res, next) => {
  try {
    const { sportId } = req.params
    const schoolId = req.schoolId
    const payload = sportSchema.partial().parse(req.body)
    
    const sport = await prisma.sport.update({
      where: { id: parseInt(sportId) },
      data: payload,
    })
    
    logInfo(`Sport updated: ${sportId}`, {
      filename: 'sportController.js',
      line: 74,
      schoolId,
    })
    res.json({ message: 'Sport updated', data: sport })
  } catch (error) {
    logError(`Update sport error: ${error.message}`, {
      filename: 'sportController.js',
      line: 81,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const deleteSport = async (req, res, next) => {
  try {
    const { sportId } = req.params
    const schoolId = req.schoolId
    
    await prisma.sport.delete({
      where: { id: parseInt(sportId) },
    })
    
    logInfo(`Sport deleted: ${sportId}`, {
      filename: 'sportController.js',
      line: 97,
      schoolId,
    })
    res.json({ message: 'Sport deleted successfully' })
  } catch (error) {
    logError(`Delete sport error: ${error.message}`, {
      filename: 'sportController.js',
      line: 104,
      schoolId: req.schoolId,
    })
    next(error)
  }
}
