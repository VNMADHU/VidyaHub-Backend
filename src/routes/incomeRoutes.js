import { Router } from 'express'
import { listIncomes, createIncome, updateIncome, deleteIncome } from '../controllers/incomeController.js'

const router = Router()

router.get('/', listIncomes)
router.post('/', createIncome)
router.patch('/:incomeId', updateIncome)
router.delete('/:incomeId', deleteIncome)

export default router
