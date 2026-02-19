import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'


const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  eventDate: z.string(),
  eventTime: z.string().optional(),
  location: z.string().optional(),
  category: z.enum(['academic', 'sports', 'cultural', 'other']).optional(),
})

export const listEvents = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    logInfo('Listing all events', {
      filename: 'eventController.js',
      line: 18,
      schoolId,
    })
    const events = await prisma.event.findMany({
      where: { schoolId: parseInt(schoolId) },
    })
    res.json({ data: events, message: 'List of events' })
  } catch (error) {
    logError(`List events error: ${error.message}`, {
      filename: 'eventController.js',
      line: 28,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const createEvent = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const payload = eventSchema.parse(req.body)
    
    // Combine eventDate and eventTime into a date field
    const dateTime = `${payload.eventDate}T${payload.eventTime || '00:00'}`
    
    const event = await prisma.event.create({
      data: {
        title: payload.title,
        description: payload.description || '',
        date: new Date(dateTime),
        location: payload.location || null,
        category: payload.category || 'academic',
        schoolId: parseInt(schoolId),
      },
    })
    
    logInfo(`Event created: ${payload.title}`, {
      filename: 'eventController.js',
      line: 50,
      schoolId,
    })
    res.status(201).json({ message: 'Event created', data: event })
  } catch (error) {
    logError(`Create event error: ${error.message}`, {
      filename: 'eventController.js',
      line: 57,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const updateEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const schoolId = req.schoolId
    const payload = eventSchema.partial().parse(req.body)
    
    // Build update data, mapping eventDate/eventTime to date if provided
    const updateData = {}
    if (payload.title) updateData.title = payload.title
    if (payload.description) updateData.description = payload.description
    if (payload.location !== undefined) updateData.location = payload.location
    if (payload.category) updateData.category = payload.category
    
    // Combine eventDate and eventTime into date field if eventDate is provided
    if (payload.eventDate) {
      const dateTime = `${payload.eventDate}T${payload.eventTime || '00:00'}`
      updateData.date = new Date(dateTime)
    }
    
    const event = await prisma.event.update({
      where: { id: parseInt(eventId) },
      data: updateData,
    })
    
    logInfo(`Event updated: ${eventId}`, {
      filename: 'eventController.js',
      line: 74,
      schoolId,
    })
    res.json({ message: 'Event updated', data: event })
  } catch (error) {
    logError(`Update event error: ${error.message}`, {
      filename: 'eventController.js',
      line: 95,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const deleteEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const schoolId = req.schoolId
    
    await prisma.event.delete({
      where: { id: parseInt(eventId) },
    })
    
    logInfo(`Event deleted: ${eventId}`, {
      filename: 'eventController.js',
      line: 97,
      schoolId,
    })
    res.json({ message: 'Event deleted successfully' })
  } catch (error) {
    logError(`Delete event error: ${error.message}`, {
      filename: 'eventController.js',
      line: 104,
      schoolId: req.schoolId,
    })
    next(error)
  }
}
