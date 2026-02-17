import express from 'express'
import {
  listSections,
  createSection,
  updateSection,
  deleteSection,
} from '../controllers/sectionController.js'

const router = express.Router()

router.get('/', listSections)
router.post('/', createSection)
router.patch('/:sectionId', updateSection)
router.delete('/:sectionId', deleteSection)

export default router
