import express from 'express'
import {
  listClasses,
  createClass,
  updateClass,
  deleteClass,
} from '../controllers/classController.js'
import trialLimit from '../middlewares/trialLimit.js'

const router = express.Router()

router.get('/', listClasses)
router.post('/', trialLimit('class'), createClass)
router.patch('/:classId', updateClass)
router.delete('/:classId', deleteClass)

export default router
