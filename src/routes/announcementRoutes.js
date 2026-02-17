import { Router } from 'express'
import {
  createAnnouncement,
  listAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js'

const router = Router()

router.get('/', listAnnouncements)
router.post('/', createAnnouncement)
router.patch('/:announcementId', updateAnnouncement)
router.delete('/:announcementId', deleteAnnouncement)

export default router
