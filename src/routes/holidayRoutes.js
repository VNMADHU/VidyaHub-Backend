import express from 'express'
import {
  listHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '../controllers/holidayController.js'
import trialLimit from '../middlewares/trialLimit.js'

const router = express.Router()

router.get('/', listHolidays)
router.post('/', trialLimit('holiday'), createHoliday)
router.patch('/:holidayId', updateHoliday)
router.delete('/:holidayId', deleteHoliday)

export default router
