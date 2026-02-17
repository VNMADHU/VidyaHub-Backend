import { Router } from 'express'
import {
  createStudent,
  listStudents,
  getStudent,
  updateStudent,
  deleteStudent,
} from '../controllers/studentController.js'

const router = Router()

router.get('/', listStudents)
router.get('/:studentId', getStudent)
router.post('/', createStudent)
router.patch('/:studentId', updateStudent)
router.delete('/:studentId', deleteStudent)

export default router
