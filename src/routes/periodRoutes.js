import { Router } from 'express'
import {
  listPeriods,
  createPeriod,
  updatePeriod,
  deletePeriod,
} from '../controllers/periodController.js'

const router = Router()

router.get('/', listPeriods)
router.post('/', createPeriod)
router.patch('/:id', updatePeriod)
router.delete('/:id', deletePeriod)

export default router
