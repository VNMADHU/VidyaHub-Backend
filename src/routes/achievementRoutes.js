import express from 'express'
import {
  listAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from '../controllers/achievementController.js'

const router = express.Router()

router.get('/', listAchievements)
router.post('/', createAchievement)
router.patch('/:achievementId', updateAchievement)
router.delete('/:achievementId', deleteAchievement)

export default router
