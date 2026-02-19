import { Router } from 'express'
import {
  listTimetables,
  createTimetable,
  updateTimetable,
  deleteTimetable,
} from '../controllers/timetableController.js'

const router = Router()

router.get('/', listTimetables)
router.post('/', createTimetable)
router.patch('/:id', updateTimetable)
router.delete('/:id', deleteTimetable)

export default router
