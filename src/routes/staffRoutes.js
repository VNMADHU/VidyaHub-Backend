import { Router } from 'express'
import { listStaff, getStaff, createStaff, updateStaff, deleteStaff } from '../controllers/staffController.js'

const router = Router()

router.get('/', listStaff)
router.post('/', createStaff)
router.get('/:staffId', getStaff)
router.patch('/:staffId', updateStaff)
router.delete('/:staffId', deleteStaff)

export default router
