import { Router } from 'express'
import trialLimit from '../middlewares/trialLimit.js'
import {
  listAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceSummary,
  bulkUpsertAttendance,
} from '../controllers/attendanceController.js'

const router = Router()

router.get('/', listAttendance)
router.post('/', trialLimit('attendance'), createAttendance)
router.post('/bulk', trialLimit('attendance'), bulkUpsertAttendance)
router.get('/summary', getAttendanceSummary)
router.patch('/:attendanceId', updateAttendance)
router.delete('/:attendanceId', deleteAttendance)

export default router
