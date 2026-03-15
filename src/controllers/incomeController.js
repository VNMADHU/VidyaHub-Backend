import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const incomeSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().positive(),
  date: z.string(),
  receivedFrom: z.string().optional(),
  paymentMode: z.string().optional(),
  receiptNo: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
})

export const listIncomes = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    logInfo('Listing incomes', { filename: 'incomeController.js', schoolId })
    const incomes = await prisma.income.findMany({
      where: { schoolId: parseInt(schoolId) },
      orderBy: { date: 'desc' },
    })
    res.json({ data: incomes, message: 'List of incomes' })
  } catch (error) {
    logError(`List incomes error: ${error.message}`, { filename: 'incomeController.js' })
    next(error)
  }
}

export const createIncome = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const validated = incomeSchema.parse(req.body)
    logInfo('Creating income', { filename: 'incomeController.js', schoolId })
    const income = await prisma.income.create({
      data: {
        ...validated,
        date: new Date(validated.date),
        schoolId: parseInt(schoolId),
      },
    })
    res.status(201).json({ data: income, message: 'Income created' })
  } catch (error) {
    logError(`Create income error: ${error.message}`, { filename: 'incomeController.js' })
    next(error)
  }
}

export const updateIncome = async (req, res, next) => {
  try {
    const { incomeId } = req.params
    const data = { ...req.body }
    if (data.date) data.date = new Date(data.date)
    if (data.amount !== undefined) data.amount = parseFloat(data.amount)
    logInfo(`Updating income ${incomeId}`, { filename: 'incomeController.js' })
    const income = await prisma.income.update({
      where: { id: parseInt(incomeId) },
      data,
    })
    res.json({ data: income, message: 'Income updated' })
  } catch (error) {
    logError(`Update income error: ${error.message}`, { filename: 'incomeController.js' })
    next(error)
  }
}

export const deleteIncome = async (req, res, next) => {
  try {
    const { incomeId } = req.params
    logInfo(`Deleting income ${incomeId}`, { filename: 'incomeController.js' })
    await prisma.income.delete({ where: { id: parseInt(incomeId) } })
    res.json({ message: 'Income deleted' })
  } catch (error) {
    logError(`Delete income error: ${error.message}`, { filename: 'incomeController.js' })
    next(error)
  }
}
