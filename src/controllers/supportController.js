import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const ticketSchema = z.object({
  subject: z.string().min(1),
  message: z.string().min(1),
  category: z.string().optional(),
  priority: z.string().optional(),
})

export const listTickets = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    logInfo('Listing support tickets', { filename: 'supportController.js', schoolId })
    const tickets = await prisma.supportTicket.findMany({
      where: { schoolId: parseInt(schoolId) },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: tickets, message: 'List of support tickets' })
  } catch (error) {
    logError(`List tickets error: ${error.message}`, { filename: 'supportController.js' })
    next(error)
  }
}

export const createTicket = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const validated = ticketSchema.parse(req.body)
    // Get user email from auth
    const createdBy = req.user?.email || 'unknown'
    logInfo('Creating support ticket', { filename: 'supportController.js', schoolId })
    const ticket = await prisma.supportTicket.create({
      data: {
        ...validated,
        schoolId: parseInt(schoolId),
        createdBy,
      },
    })
    res.status(201).json({ data: ticket, message: 'Support ticket created' })
  } catch (error) {
    logError(`Create ticket error: ${error.message}`, { filename: 'supportController.js' })
    next(error)
  }
}

export const updateTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params
    const data = { ...req.body }
    if (data.reply) data.repliedAt = new Date()
    logInfo('Updating support ticket', { filename: 'supportController.js', ticketId })
    const ticket = await prisma.supportTicket.update({
      where: { id: parseInt(ticketId) },
      data,
    })
    res.json({ data: ticket, message: 'Ticket updated' })
  } catch (error) {
    logError(`Update ticket error: ${error.message}`, { filename: 'supportController.js' })
    next(error)
  }
}

export const deleteTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params
    logInfo('Deleting support ticket', { filename: 'supportController.js', ticketId })
    await prisma.supportTicket.delete({ where: { id: parseInt(ticketId) } })
    res.json({ message: 'Ticket deleted' })
  } catch (error) {
    logError(`Delete ticket error: ${error.message}`, { filename: 'supportController.js' })
    next(error)
  }
}
