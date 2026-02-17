import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { logInfo, logError } from '../utils/logHelpers.js'

const prisma = new PrismaClient()

const sectionSchema = z.object({
  classId: z.number(),
  name: z.string().min(1),
})

export const listSections = async (req, res, next) => {
  try {
    const { classId } = req.query
    logInfo('Listing all sections', {
      filename: 'sectionController.js',
      line: 16,
      classId,
    })
    
    const where = classId ? { classId: parseInt(classId) } : {}
    const sections = await prisma.section.findMany({
      where,
      include: { class: true },
    })
    res.json({ data: sections, message: 'List of sections' })
  } catch (error) {
    logError(`List sections error: ${error.message}`, {
      filename: 'sectionController.js',
      line: 30,
    })
    next(error)
  }
}

export const createSection = async (req, res, next) => {
  try {
    const payload = sectionSchema.parse(req.body)
    
    const section = await prisma.section.create({
      data: {
        name: payload.name,
        classId: payload.classId,
      },
      include: { class: true },
    })
    
    logInfo(`Section created: ${payload.name}`, {
      filename: 'sectionController.js',
      line: 48,
    })
    res.status(201).json({ message: 'Section created', data: section })
  } catch (error) {
    logError(`Create section error: ${error.message}`, {
      filename: 'sectionController.js',
      line: 55,
    })
    next(error)
  }
}

export const updateSection = async (req, res, next) => {
  try {
    const { sectionId } = req.params
    const payload = sectionSchema.partial().parse(req.body)
    
    const section = await prisma.section.update({
      where: { id: parseInt(sectionId) },
      data: payload,
      include: { class: true },
    })
    
    logInfo(`Section updated: ${sectionId}`, {
      filename: 'sectionController.js',
      line: 72,
    })
    res.json({ message: 'Section updated', data: section })
  } catch (error) {
    logError(`Update section error: ${error.message}`, {
      filename: 'sectionController.js',
      line: 79,
    })
    next(error)
  }
}

export const deleteSection = async (req, res, next) => {
  try {
    const { sectionId } = req.params
    
    await prisma.section.delete({
      where: { id: parseInt(sectionId) },
    })
    
    logInfo(`Section deleted: ${sectionId}`, {
      filename: 'sectionController.js',
      line: 95,
    })
    res.json({ message: 'Section deleted successfully' })
  } catch (error) {
    logError(`Delete section error: ${error.message}`, {
      filename: 'sectionController.js',
      line: 102,
    })
    next(error)
  }
}
