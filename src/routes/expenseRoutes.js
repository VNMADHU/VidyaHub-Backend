import express from 'express'
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js'

const router = express.Router()

router.get('/', listExpenses)
router.post('/', createExpense)
router.patch('/:expenseId', updateExpense)
router.delete('/:expenseId', deleteExpense)

export default router
