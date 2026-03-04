import { Router } from 'express'
import {
  createEvent,
  listEvents,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js'
import trialLimit from '../middlewares/trialLimit.js'

const router = Router()

router.get('/', listEvents)
router.post('/', trialLimit('event'), createEvent)
router.patch('/:eventId', updateEvent)
router.delete('/:eventId', deleteEvent)

export default router
