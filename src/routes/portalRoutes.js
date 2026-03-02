import { Router } from 'express'
import portalAuthenticate from '../middlewares/portalAuth.js'
import {
  studentLogin,
  teacherLogin,
  getStudentProfile,
  getTeacherProfile,
  createPortalHomework,
  updatePortalHomework,
  deletePortalHomework,
} from '../controllers/portalController.js'

const router = Router()

// Login routes — public (no auth required)
router.post('/student-login', studentLogin)
router.post('/teacher-login', teacherLogin)

// Profile routes — protected by portal JWT
router.get('/student/:studentId', portalAuthenticate, getStudentProfile)
router.get('/teacher/:teacherId', portalAuthenticate, getTeacherProfile)

// Teacher portal — homework management (portal JWT required)
router.post('/homework', portalAuthenticate, createPortalHomework)
router.patch('/homework/:id', portalAuthenticate, updatePortalHomework)
router.delete('/homework/:id', portalAuthenticate, deletePortalHomework)

export default router
