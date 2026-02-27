import express from 'express'
import {
  listHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '../controllers/holidayController.js'

const router = express.Router()

router.get('/', listHolidays)
router.post('/', createHoliday)
router.patch('/:holidayId', updateHoliday)
router.delete('/:holidayId', deleteHoliday)

export default router
