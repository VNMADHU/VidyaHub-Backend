import { Router } from 'express'
import {
  listMarks,
  createMarks,
  updateMarks,
  deleteMarks,
  getMarksReport,
} from '../controllers/marksController.js'

const router = Router()

router.get('/', listMarks)
router.post('/', createMarks)
router.patch('/:markId', updateMarks)
router.delete('/:markId', deleteMarks)
router.get('/report', getMarksReport)

export default router
