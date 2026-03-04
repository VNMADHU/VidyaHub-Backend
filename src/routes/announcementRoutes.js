import { Router } from 'express'
import {
  createAnnouncement,
  listAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js'
import trialLimit from '../middlewares/trialLimit.js'

const router = Router()

router.get('/', listAnnouncements)
router.post('/', trialLimit('announcement'), createAnnouncement)
router.patch('/:announcementId', updateAnnouncement)
router.delete('/:announcementId', deleteAnnouncement)

export default router
