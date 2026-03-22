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
import periodRoutes from './periodRoutes.js'
import notificationRoutes from './notificationRoutes.js'
import libraryRoutes from './libraryRoutes.js'
import transportRoutes from './transportRoutes.js'
import expenseRoutes from './expenseRoutes.js'
import incomeRoutes from './incomeRoutes.js'
import supportRoutes from './supportRoutes.js'
import leaveRoutes from './leaveRoutes.js'
import holidayRoutes from './holidayRoutes.js'
import staffRoutes from './staffRoutes.js'
import hostelRoutes from './hostelRoutes.js'
import admissionRoutes from './admissionRoutes.js'
import demoRequestRoutes from './demoRequestRoutes.js'
import adminRoutes from './adminRoutes.js'
import masterDataRoutes from './masterDataRoutes.js'
import whatsappRoutes from './whatsappRoutes.js'
import payrollRoutes from './payrollRoutes.js'
import gstRoutes from './gstRoutes.js'
import ledgerRoutes from './ledgerRoutes.js'
import voucherRoutes from './voucherRoutes.js'
import chatRoutes from './chatRoutes.js'
import assetRoutes from './assetRoutes.js'
import staffAttendanceRoutes from './staffAttendanceRoutes.js'

const router = Router()

// Global rate limiter for all API routes
router.use(apiLimiter)

// ── Public routes (no auth required) ──────────────────────
router.use('/auth', authRoutes)
router.use('/admins', adminRoutes)
router.use('/portal', portalRoutes)
router.use('/demo-request', demoRequestRoutes)

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
router.use('/periods', authenticate, periodRoutes)
router.use('/notifications', authenticate, notificationRoutes)
router.use('/library', authenticate, libraryRoutes)
router.use('/transport', authenticate, transportRoutes)
router.use('/expenses', authenticate, expenseRoutes)
router.use('/incomes', authenticate, incomeRoutes)
router.use('/support', authenticate, supportRoutes)
router.use('/leaves', authenticate, leaveRoutes)
router.use('/holidays', authenticate, holidayRoutes)
router.use('/staff', authenticate, staffRoutes)
router.use('/hostel', authenticate, hostelRoutes)
router.use('/admissions', authenticate, admissionRoutes)
router.use('/master-data', authenticate, masterDataRoutes)
router.use('/whatsapp', authenticate, whatsappRoutes)
router.use('/payroll', authenticate, payrollRoutes)
router.use('/gst-invoices', authenticate, gstRoutes)
router.use('/ledgers', authenticate, ledgerRoutes)
router.use('/vouchers', authenticate, voucherRoutes)
router.use('/chat', authenticate, chatRoutes)
router.use('/assets', authenticate, assetRoutes)
router.use('/staff-attendance', authenticate, staffAttendanceRoutes)

router.get('/', (req, res) => {
  res.json({ message: 'Vidya Hub API v1' })
})

export default router
