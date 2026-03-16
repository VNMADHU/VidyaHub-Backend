import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

export const listGstInvoices = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    logInfo('Listing GST invoices', { filename: 'gstController.js', schoolId })
    const invoices = await prisma.gstInvoice.findMany({
      where: { schoolId: parseInt(schoolId) },
      orderBy: { invoiceDate: 'desc' },
    })
    // Parse items JSON for each invoice
    const parsed = invoices.map(inv => ({
      ...inv,
      items: (() => { try { return JSON.parse(inv.items || '[]') } catch { return [] } })(),
    }))
    res.json({ data: parsed })
  } catch (error) {
    logError(`List GST invoices error: ${error.message}`, { filename: 'gstController.js' })
    next(error)
  }
}

export const createGstInvoice = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const data = { ...req.body }
    if (data.invoiceDate) data.invoiceDate = new Date(data.invoiceDate)
    if (Array.isArray(data.items)) data.items = JSON.stringify(data.items)
    logInfo('Creating GST invoice', { filename: 'gstController.js', schoolId })
    const invoice = await prisma.gstInvoice.create({
      data: { ...data, schoolId: parseInt(schoolId) },
    })
    res.status(201).json({
      data: { ...invoice, items: (() => { try { return JSON.parse(invoice.items || '[]') } catch { return [] } })() },
      message: 'Invoice created',
    })
  } catch (error) {
    logError(`Create GST invoice error: ${error.message}`, { filename: 'gstController.js' })
    next(error)
  }
}

export const updateGstInvoice = async (req, res, next) => {
  try {
    const { invoiceId } = req.params
    const data = { ...req.body }
    if (data.invoiceDate) data.invoiceDate = new Date(data.invoiceDate)
    if (Array.isArray(data.items)) data.items = JSON.stringify(data.items)
    logInfo('Updating GST invoice', { filename: 'gstController.js', invoiceId })
    const invoice = await prisma.gstInvoice.update({
      where: { id: parseInt(invoiceId) },
      data,
    })
    res.json({
      data: { ...invoice, items: (() => { try { return JSON.parse(invoice.items || '[]') } catch { return [] } })() },
      message: 'Invoice updated',
    })
  } catch (error) {
    logError(`Update GST invoice error: ${error.message}`, { filename: 'gstController.js' })
    next(error)
  }
}

export const deleteGstInvoice = async (req, res, next) => {
  try {
    const { invoiceId } = req.params
    logInfo('Deleting GST invoice', { filename: 'gstController.js', invoiceId })
    await prisma.gstInvoice.delete({ where: { id: parseInt(invoiceId) } })
    res.json({ message: 'Invoice deleted' })
  } catch (error) {
    logError(`Delete GST invoice error: ${error.message}`, { filename: 'gstController.js' })
    next(error)
  }
}
