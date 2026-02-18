import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'


const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/

const schoolSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  contact: z.string().regex(INDIAN_PHONE_REGEX, 'Must be a valid 10-digit Indian mobile number (starting with 6-9)'),
  principal: z.string().min(2),
  boardType: z.string().min(2),
})

export const listSchools = async (req, res, next) => {
  try {
    logInfo('Listing all schools', {
      filename: 'schoolController.js',
      line: 16,
    })
    const schools = await prisma.school.findMany()
    res.json({ data: schools, message: 'List of schools' })
  } catch (error) {
    logError(`List schools error: ${error.message}`, {
      filename: 'schoolController.js',
      line: 23,
    })
    next(error)
  }
}

export const createSchool = async (req, res, next) => {
  try {
    const payload = schoolSchema.parse(req.body)
    
    const school = await prisma.school.create({
      data: payload,
    })
    
    logInfo(`School created: ${payload.name}`, {
      filename: 'schoolController.js',
      line: 36,
    })
    res.status(201).json({ message: 'School created', data: school })
  } catch (error) {
    logError(`Create school error: ${error.message}`, {
      filename: 'schoolController.js',
      line: 43,
    })
    next(error)
  }
}

export const updateSchool = async (req, res, next) => {
  try {
    const { schoolId } = req.params
    const payload = schoolSchema.partial().parse(req.body)
    
    const school = await prisma.school.update({
      where: { id: parseInt(schoolId) },
      data: payload,
    })
    
    logInfo(`School updated: ${schoolId}`, {
      filename: 'schoolController.js',
      line: 59,
    })
    res.json({ message: 'School updated', data: school })
  } catch (error) {
    logError(`Update school error: ${error.message}`, {
      filename: 'schoolController.js',
      line: 66,
    })
    next(error)
  }
}

export const deleteSchool = async (req, res, next) => {
  try {
    const { schoolId } = req.params
    
    await prisma.school.delete({
      where: { id: parseInt(schoolId) },
    })
    
    logInfo(`School deleted: ${schoolId}`, {
      filename: 'schoolController.js',
      line: 80,
    })
    res.json({ message: 'School deleted successfully' })
  } catch (error) {
    logError(`Delete school error: ${error.message}`, {
      filename: 'schoolController.js',
      line: 87,
    })
    next(error)
  }
}
