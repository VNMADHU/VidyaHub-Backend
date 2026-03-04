import express from 'express'
import {
  listSports,
  createSport,
  updateSport,
  deleteSport,
} from '../controllers/sportController.js'
import trialLimit from '../middlewares/trialLimit.js'

const router = express.Router()

router.get('/', listSports)
router.post('/', trialLimit('sport'), createSport)
router.patch('/:sportId', updateSport)
router.delete('/:sportId', deleteSport)

export default router
