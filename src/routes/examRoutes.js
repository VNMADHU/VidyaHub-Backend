import { Router } from 'express'
import {
  listExams,
  createExam,
  updateExam,
  deleteExam,
} from '../controllers/examController.js'
import trialLimit from '../middlewares/trialLimit.js'

const router = Router()

router.get('/', listExams)
router.post('/', trialLimit('exam'), createExam)
router.patch('/:examId', updateExam)
router.delete('/:examId', deleteExam)

export default router
