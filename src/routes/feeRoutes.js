import { Router } from 'express'
import {
  listFees,
  getFee,
  createFee,
  updateFee,
  payFee,
  deleteFee,
  getStudentFees,
} from '../controllers/feeController.js'

const router = Router()

router.get('/', listFees)
router.get('/:feeId', getFee)
router.post('/', createFee)
router.patch('/:feeId', updateFee)
router.post('/:feeId/pay', payFee)
router.delete('/:feeId', deleteFee)
router.get('/student/:studentId', getStudentFees)

export default router
