import { Router } from 'express'
import {
  listExams,
  createExam,
  updateExam,
  deleteExam,
} from '../controllers/examController.js'

const router = Router()

router.get('/', listExams)
router.post('/', createExam)
router.patch('/:examId', updateExam)
router.delete('/:examId', deleteExam)

export default router
