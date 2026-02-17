import { Router } from 'express'
import {
  createTeacher,
  listTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
} from '../controllers/teacherController.js'

const router = Router()

router.get('/', listTeachers)
router.get('/:teacherId', getTeacher)
router.post('/', createTeacher)
router.patch('/:teacherId', updateTeacher)
router.delete('/:teacherId', deleteTeacher)

export default router
