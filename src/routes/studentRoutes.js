import { Router } from 'express'
import {
  createStudent,
  listStudents,
  getStudent,
  updateStudent,
  deleteStudent,
} from '../controllers/studentController.js'
import trialLimit from '../middlewares/trialLimit.js'

const router = Router()

router.get('/', listStudents)
router.get('/:studentId', getStudent)
router.post('/', trialLimit('student'), createStudent)
router.patch('/:studentId', updateStudent)
router.delete('/:studentId', deleteStudent)

export default router
