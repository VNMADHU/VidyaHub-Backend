import { Router } from 'express'
import {
  createEvent,
  listEvents,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js'

const router = Router()

router.get('/', listEvents)
router.post('/', createEvent)
router.patch('/:eventId', updateEvent)
router.delete('/:eventId', deleteEvent)

export default router
