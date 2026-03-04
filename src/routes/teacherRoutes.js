import { Router } from 'express'
import {
  createTeacher,
  listTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
} from '../controllers/teacherController.js'
import trialLimit from '../middlewares/trialLimit.js'

const router = Router()

router.get('/', listTeachers)
router.get('/:teacherId', getTeacher)
router.post('/', trialLimit('teacher'), createTeacher)
router.patch('/:teacherId', updateTeacher)
router.delete('/:teacherId', deleteTeacher)

export default router
