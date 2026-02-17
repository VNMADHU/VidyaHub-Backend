import { Router } from 'express'
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

const router = Router()

router.use('/auth', authRoutes)
router.use('/schools', schoolRoutes)
router.use('/students', studentRoutes)
router.use('/teachers', teacherRoutes)
router.use('/attendance', attendanceRoutes)
router.use('/marks', marksRoutes)
router.use('/events', eventRoutes)
router.use('/announcements', announcementRoutes)
router.use('/exams', examRoutes)
router.use('/achievements', achievementRoutes)
router.use('/sports', sportRoutes)
router.use('/classes', classRoutes)
router.use('/sections', sectionRoutes)

router.get('/', (req, res) => {
  res.json({ message: 'Vidya Hub API v1' })
})

export default router
