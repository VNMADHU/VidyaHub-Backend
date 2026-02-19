import { Router } from 'express'
import {
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subjectController.js'

const router = Router()

router.get('/', listSubjects)
router.post('/', createSubject)
router.patch('/:id', updateSubject)
router.delete('/:id', deleteSubject)

export default router
