import { Router } from 'express'
import trialLimit from '../middlewares/trialLimit.js'
import {
  listPeriods,
  createPeriod,
  updatePeriod,
  deletePeriod,
} from '../controllers/periodController.js'

const router = Router()

router.get('/', listPeriods)
router.post('/', trialLimit('period'), createPeriod)
router.patch('/:id', updatePeriod)
router.delete('/:id', deletePeriod)

export default router
