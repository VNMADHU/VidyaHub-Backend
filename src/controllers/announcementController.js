import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'


const announcementSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
})

export const listAnnouncements = async (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || '1'
    logInfo('Listing all announcements', {
      filename: 'announcementController.js',
      line: 16,
      schoolId,
    })
    const announcements = await prisma.announcement.findMany({
      where: { schoolId: parseInt(schoolId) },
    })
    res.json({ data: announcements, message: 'List of announcements' })
  } catch (error) {
    logError(`List announcements error: ${error.message}`, {
      filename: 'announcementController.js',
      line: 26,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const createAnnouncement = async (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || '1'
    const payload = announcementSchema.parse(req.body)
    
    const announcement = await prisma.announcement.create({
      data: {
        ...payload,
        schoolId: parseInt(schoolId),
      },
    })
    
    logInfo(`Announcement created: ${payload.title}`, {
      filename: 'announcementController.js',
      line: 48,
      schoolId,
    })
    res.status(201).json({ message: 'Announcement created', data: announcement })
  } catch (error) {
    logError(`Create announcement error: ${error.message}`, {
      filename: 'announcementController.js',
      line: 55,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const updateAnnouncement = async (req, res, next) => {
  try {
    const { announcementId } = req.params
    const schoolId = req.body?.schoolId || '1'
    const payload = announcementSchema.partial().parse(req.body)
    
    const announcement = await prisma.announcement.update({
      where: { id: parseInt(announcementId) },
      data: payload,
    })
    
    logInfo(`Announcement updated: ${announcementId}`, {
      filename: 'announcementController.js',
      line: 72,
      schoolId,
    })
    res.json({ message: 'Announcement updated', data: announcement })
  } catch (error) {
    logError(`Update announcement error: ${error.message}`, {
      filename: 'announcementController.js',
      line: 79,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { announcementId } = req.params
    const schoolId = req.body?.schoolId || '1'
    
    await prisma.announcement.delete({
      where: { id: parseInt(announcementId) },
    })
    
    logInfo(`Announcement deleted: ${announcementId}`, {
      filename: 'announcementController.js',
      line: 95,
      schoolId,
    })
    res.json({ message: 'Announcement deleted successfully' })
  } catch (error) {
    logError(`Delete announcement error: ${error.message}`, {
      filename: 'announcementController.js',
      line: 102,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}
