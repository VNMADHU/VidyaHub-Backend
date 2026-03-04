import express from 'express'
import {
  listSections,
  createSection,
  updateSection,
  deleteSection,
} from '../controllers/sectionController.js'
import trialLimit from '../middlewares/trialLimit.js'

const router = express.Router()

router.get('/', listSections)
router.post('/', trialLimit('section'), createSection)
router.patch('/:sectionId', updateSection)
router.delete('/:sectionId', deleteSection)

export default router
