import { Router } from 'express'
import { listStaff, createStaff, updateStaff, deleteStaff } from '../controllers/staffController.js'

const router = Router()

router.get('/', listStaff)
router.post('/', createStaff)
router.patch('/:staffId', updateStaff)
router.delete('/:staffId', deleteStaff)

export default router
