import express from 'express'
import {
  listTickets,
  createTicket,
  updateTicket,
  deleteTicket,
} from '../controllers/supportController.js'

const router = express.Router()

router.get('/', listTickets)
router.post('/', createTicket)
router.patch('/:ticketId', updateTicket)
router.delete('/:ticketId', deleteTicket)

export default router
