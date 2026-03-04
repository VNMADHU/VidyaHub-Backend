import { Router } from 'express'
import {
  listHomework,
  createHomework,
  updateHomework,
  deleteHomework,
} from '../controllers/homeworkController.js'
import trialLimit from '../middlewares/trialLimit.js'

const router = Router()

router.get('/', listHomework)
router.post('/', trialLimit('homework'), createHomework)
router.patch('/:id', updateHomework)
router.delete('/:id', deleteHomework)

export default router
