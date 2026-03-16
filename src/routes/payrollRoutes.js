import { Router } from 'express'
import { listPayroll, generatePayroll, updatePayroll, deletePayroll } from '../controllers/payrollController.js'

const router = Router()

router.get('/', listPayroll)
router.post('/generate', generatePayroll)
router.patch('/:payrollId', updatePayroll)
router.delete('/:payrollId', deletePayroll)

export default router
