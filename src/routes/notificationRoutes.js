import { Router } from 'express'
import {
  sendNotification,
  listNotifications,
  deleteNotification,
  getRecipientsCount,
} from '../controllers/notificationController.js'

const router = Router()

router.get('/', listNotifications)
router.post('/send', sendNotification)
router.get('/recipients-count', getRecipientsCount)
router.delete('/:id', deleteNotification)

export default router
