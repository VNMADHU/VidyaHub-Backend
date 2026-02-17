import { Router } from 'express'
import {
  listAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceSummary,
} from '../controllers/attendanceController.js'

const router = Router()

router.get('/', listAttendance)
router.post('/', createAttendance)
router.patch('/:attendanceId', updateAttendance)
router.delete('/:attendanceId', deleteAttendance)
router.get('/summary', getAttendanceSummary)

export default router
