import express from 'express'
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js'
import trialLimit from '../middlewares/trialLimit.js'

const router = express.Router()

router.get('/', listExpenses)
router.post('/', trialLimit('expense'), createExpense)
router.patch('/:expenseId', updateExpense)
router.delete('/:expenseId', deleteExpense)

export default router
