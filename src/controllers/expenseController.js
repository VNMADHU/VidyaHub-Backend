import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const expenseSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().positive(),
  date: z.string(),
  paidTo: z.string().optional(),
  paymentMode: z.string().optional(),
  receiptNo: z.string().optional(),
  description: z.string().optional(),
  approvedBy: z.string().optional(),
  status: z.string().optional(),
})

export const listExpenses = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    logInfo('Listing expenses', { filename: 'expenseController.js', schoolId })
    const expenses = await prisma.expense.findMany({
      where: { schoolId: parseInt(schoolId) },
      orderBy: { date: 'desc' },
    })
    res.json({ data: expenses, message: 'List of expenses' })
  } catch (error) {
    logError(`List expenses error: ${error.message}`, { filename: 'expenseController.js' })
    next(error)
  }
}

export const createExpense = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const validated = expenseSchema.parse(req.body)
    logInfo('Creating expense', { filename: 'expenseController.js', schoolId })
    const expense = await prisma.expense.create({
      data: {
        ...validated,
        date: new Date(validated.date),
        schoolId: parseInt(schoolId),
      },
    })
    res.status(201).json({ data: expense, message: 'Expense created' })
  } catch (error) {
    logError(`Create expense error: ${error.message}`, { filename: 'expenseController.js' })
    next(error)
  }
}

export const updateExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params
    const data = { ...req.body }
    if (data.date) data.date = new Date(data.date)
    logInfo('Updating expense', { filename: 'expenseController.js', expenseId })
    const expense = await prisma.expense.update({
      where: { id: parseInt(expenseId) },
      data,
    })
    res.json({ data: expense, message: 'Expense updated' })
  } catch (error) {
    logError(`Update expense error: ${error.message}`, { filename: 'expenseController.js' })
    next(error)
  }
}

export const deleteExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params
    logInfo('Deleting expense', { filename: 'expenseController.js', expenseId })
    await prisma.expense.delete({ where: { id: parseInt(expenseId) } })
    res.json({ message: 'Expense deleted' })
  } catch (error) {
    logError(`Delete expense error: ${error.message}`, { filename: 'expenseController.js' })
    next(error)
  }
}
