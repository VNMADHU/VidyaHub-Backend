import { Router } from 'express'
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
router.post('/', createAttendance)
router.post('/bulk', bulkUpsertAttendance)
router.get('/summary', getAttendanceSummary)
router.patch('/:attendanceId', updateAttendance)
router.delete('/:attendanceId', deleteAttendance)

export default router
