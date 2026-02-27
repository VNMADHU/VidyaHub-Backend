import express from 'express'
import {
  listLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
} from '../controllers/leaveController.js'

const router = express.Router()

router.get('/', listLeaves)
router.post('/', createLeave)
router.patch('/:leaveId', updateLeave)
router.delete('/:leaveId', deleteLeave)

export default router
