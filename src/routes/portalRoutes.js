import { Router } from 'express'
import {
  studentLogin,
  teacherLogin,
  getStudentProfile,
  getTeacherProfile,
} from '../controllers/portalController.js'

const router = Router()

// Login routes (no password)
router.post('/student-login', studentLogin)
router.post('/teacher-login', teacherLogin)

// Profile routes
router.get('/student/:studentId', getStudentProfile)
router.get('/teacher/:teacherId', getTeacherProfile)

export default router
