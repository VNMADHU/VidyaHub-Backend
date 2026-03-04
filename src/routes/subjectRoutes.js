import { Router } from 'express'
import {
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/subjectController.js'
import trialLimit from '../middlewares/trialLimit.js'

const router = Router()

router.get('/', listSubjects)
router.post('/', trialLimit('subject'), createSubject)
router.patch('/:id', updateSubject)
router.delete('/:id', deleteSubject)

export default router
