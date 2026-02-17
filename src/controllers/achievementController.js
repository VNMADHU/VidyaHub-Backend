import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { logInfo, logError } from '../utils/logHelpers.js'

const prisma = new PrismaClient()

const achievementSchema = z.object({
  title: z.string().min(1),
  studentId: z.number(),
  category: z.enum(['academic', 'sports', 'cultural', 'other']).optional(),
  date: z.string(),
  description: z.string().optional(),
})

export const listAchievements = async (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || '1'
    logInfo('Listing all achievements', {
      filename: 'achievementController.js',
      line: 18,
      schoolId,
    })
    const achievements = await prisma.achievement.findMany({
      where: {
        student: {
          schoolId: parseInt(schoolId)
        }
      },
      include: { student: true },
    })
    res.json({ data: achievements, message: 'List of achievements' })
  } catch (error) {
    logError(`List achievements error: ${error.message}`, {
      filename: 'achievementController.js',
      line: 30,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const createAchievement = async (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || '1'
    const payload = achievementSchema.parse(req.body)
    
    const achievement = await prisma.achievement.create({
      data: {
        title: payload.title,
        studentId: payload.studentId,
        category: payload.category || 'other',
        achievementDate: new Date(payload.date),
        description: payload.description || '',
      },
      include: { student: true },
    })
    
    logInfo(`Achievement created: ${payload.title}`, {
      filename: 'achievementController.js',
      line: 58,
      schoolId,
    })
    res.status(201).json({ message: 'Achievement created', data: achievement })
  } catch (error) {
    logError(`Create achievement error: ${error.message}`, {
      filename: 'achievementController.js',
      line: 65,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const updateAchievement = async (req, res, next) => {
  try {
    const { achievementId } = req.params
    const schoolId = req.body?.schoolId || '1'
    const payload = achievementSchema.partial().parse(req.body)
    
    const updateData = {}
    if (payload.title) updateData.title = payload.title
    if (payload.category) updateData.category = payload.category
    if (payload.description) updateData.description = payload.description
    if (payload.date) updateData.achievementDate = new Date(payload.date)
    
    const achievement = await prisma.achievement.update({
      where: { id: parseInt(achievementId) },
      data: updateData,
      include: { student: true },
    })
    
    logInfo(`Achievement updated: ${achievementId}`, {
      filename: 'achievementController.js',
      line: 87,
      schoolId,
    })
    res.json({ message: 'Achievement updated', data: achievement })
  } catch (error) {
    logError(`Update achievement error: ${error.message}`, {
      filename: 'achievementController.js',
      line: 94,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const deleteAchievement = async (req, res, next) => {
  try {
    const { achievementId } = req.params
    const schoolId = req.body?.schoolId || '1'
    
    await prisma.achievement.delete({
      where: { id: parseInt(achievementId) },
    })
    
    logInfo(`Achievement deleted: ${achievementId}`, {
      filename: 'achievementController.js',
      line: 108,
      schoolId,
    })
    res.json({ message: 'Achievement deleted successfully' })
  } catch (error) {
    logError(`Delete achievement error: ${error.message}`, {
      filename: 'achievementController.js',
      line: 115,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}
