import { Router } from 'express'
import {
  listHomework,
  createHomework,
  updateHomework,
  deleteHomework,
} from '../controllers/homeworkController.js'

const router = Router()

router.get('/', listHomework)
router.post('/', createHomework)
router.patch('/:id', updateHomework)
router.delete('/:id', deleteHomework)

export default router
