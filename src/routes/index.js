import { Router } from 'express'
import authenticate from '../middlewares/auth.js'
import { apiLimiter } from '../middlewares/rateLimiter.js'
import authRoutes from './authRoutes.js'
import schoolRoutes from './schoolRoutes.js'
import studentRoutes from './studentRoutes.js'
import teacherRoutes from './teacherRoutes.js'
import attendanceRoutes from './attendanceRoutes.js'
import marksRoutes from './marksRoutes.js'
import eventRoutes from './eventRoutes.js'
import announcementRoutes from './announcementRoutes.js'
import examRoutes from './examRoutes.js'
import achievementRoutes from './achievementRoutes.js'
import sportRoutes from './sportRoutes.js'
import classRoutes from './classRoutes.js'
import sectionRoutes from './sectionRoutes.js'
import portalRoutes from './portalRoutes.js'
import feeRoutes from './feeRoutes.js'
import timetableRoutes from './timetableRoutes.js'
import subjectRoutes from './subjectRoutes.js'
import reportCardRoutes from './reportCardRoutes.js'
import attendanceReportRoutes from './attendanceReportRoutes.js'
import homeworkRoutes from './homeworkRoutes.js'

const router = Router()

// Global rate limiter for all API routes
router.use(apiLimiter)

// ── Public routes (no auth required) ──────────────────────
router.use('/auth', authRoutes)
router.use('/portal', portalRoutes)

// ── Protected routes (JWT required) ───────────────────────
router.use('/schools', authenticate, schoolRoutes)
router.use('/students', authenticate, studentRoutes)
router.use('/teachers', authenticate, teacherRoutes)
router.use('/attendance', authenticate, attendanceRoutes)
router.use('/marks', authenticate, marksRoutes)
router.use('/events', authenticate, eventRoutes)
router.use('/announcements', authenticate, announcementRoutes)
router.use('/exams', authenticate, examRoutes)
router.use('/achievements', authenticate, achievementRoutes)
router.use('/sports', authenticate, sportRoutes)
router.use('/classes', authenticate, classRoutes)
router.use('/sections', authenticate, sectionRoutes)
router.use('/fees', authenticate, feeRoutes)
router.use('/timetables', authenticate, timetableRoutes)
router.use('/subjects', authenticate, subjectRoutes)
router.use('/report-card', authenticate, reportCardRoutes)
router.use('/attendance-report', authenticate, attendanceReportRoutes)
router.use('/homework', authenticate, homeworkRoutes)

router.get('/', (req, res) => {
  res.json({ message: 'Vidya Hub API v1' })
})

export default router
