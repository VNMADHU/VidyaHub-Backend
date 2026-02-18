import { Router } from 'express'
import portalAuthenticate from '../middlewares/portalAuth.js'
import {
  studentLogin,
  teacherLogin,
  getStudentProfile,
  getTeacherProfile,
} from '../controllers/portalController.js'

const router = Router()

// Login routes — public (no auth required)
router.post('/student-login', studentLogin)
router.post('/teacher-login', teacherLogin)

// Profile routes — protected by portal JWT
router.get('/student/:studentId', portalAuthenticate, getStudentProfile)
router.get('/teacher/:teacherId', portalAuthenticate, getTeacherProfile)

export default router
