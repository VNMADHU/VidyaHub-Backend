import { Router } from 'express'
import {
  listTimetables,
  createTimetable,
  updateTimetable,
  deleteTimetable,
} from '../controllers/timetableController.js'
import trialLimit from '../middlewares/trialLimit.js'

const router = Router()

router.get('/', listTimetables)
router.post('/', trialLimit('timetable'), createTimetable)
router.patch('/:id', updateTimetable)
router.delete('/:id', deleteTimetable)

export default router
