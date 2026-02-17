import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { logInfo, logError } from '../utils/logHelpers.js'

const prisma = new PrismaClient()

const classSchema = z.object({
  name: z.string().min(1),
})

export const listClasses = async (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || '1'
    logInfo('Listing all classes', {
      filename: 'classController.js',
      line: 17,
      schoolId,
    })
    const classes = await prisma.class.findMany({
      where: { schoolId: parseInt(schoolId) },
      include: { sections: true },
    })
    res.json({ data: classes, message: 'List of classes' })
  } catch (error) {
    logError(`List classes error: ${error.message}`, {
      filename: 'classController.js',
      line: 29,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const createClass = async (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || '1'
    const payload = classSchema.parse(req.body)
    
    const newClass = await prisma.class.create({
      data: {
        name: payload.name,
        schoolId: parseInt(schoolId),
      },
      include: { sections: true },
    })
    
    logInfo(`Class created: ${payload.name}`, {
      filename: 'classController.js',
      line: 49,
      schoolId,
    })
    res.status(201).json({ message: 'Class created', data: newClass })
  } catch (error) {
    logError(`Create class error: ${error.message}`, {
      filename: 'classController.js',
      line: 56,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const updateClass = async (req, res, next) => {
  try {
    const { classId } = req.params
    const schoolId = req.body?.schoolId || '1'
    const payload = classSchema.partial().parse(req.body)
    
    const updatedClass = await prisma.class.update({
      where: { id: parseInt(classId) },
      data: payload,
      include: { sections: true },
    })
    
    logInfo(`Class updated: ${classId}`, {
      filename: 'classController.js',
      line: 75,
      schoolId,
    })
    res.json({ message: 'Class updated', data: updatedClass })
  } catch (error) {
    logError(`Update class error: ${error.message}`, {
      filename: 'classController.js',
      line: 82,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}

export const deleteClass = async (req, res, next) => {
  try {
    const { classId } = req.params
    const schoolId = req.body?.schoolId || '1'
    
    await prisma.class.delete({
      where: { id: parseInt(classId) },
    })
    
    logInfo(`Class deleted: ${classId}`, {
      filename: 'classController.js',
      line: 100,
      schoolId,
    })
    res.json({ message: 'Class deleted successfully' })
  } catch (error) {
    logError(`Delete class error: ${error.message}`, {
      filename: 'classController.js',
      line: 107,
      schoolId: req.body?.schoolId || '1',
    })
    next(error)
  }
}
