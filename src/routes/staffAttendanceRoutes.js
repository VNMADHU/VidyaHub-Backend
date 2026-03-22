import { Router } from 'express'
import {
  listStaffAttendance,
  bulkMarkAttendance,
  updateStaffAttendance,
  deleteStaffAttendance,
  monthlySummary,
} from '../controllers/staffAttendanceController.js'

const router = Router()

router.get('/monthly-summary', monthlySummary)
router.get('/',        listStaffAttendance)
router.post('/bulk',   bulkMarkAttendance)
router.patch('/:id',   updateStaffAttendance)
router.delete('/:id',  deleteStaffAttendance)

export default router
