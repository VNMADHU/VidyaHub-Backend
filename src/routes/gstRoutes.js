import { Router } from 'express'
import { listGstInvoices, createGstInvoice, updateGstInvoice, deleteGstInvoice } from '../controllers/gstController.js'

const router = Router()

router.get('/', listGstInvoices)
router.post('/', createGstInvoice)
router.patch('/:invoiceId', updateGstInvoice)
router.delete('/:invoiceId', deleteGstInvoice)

export default router
