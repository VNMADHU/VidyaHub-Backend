import express from 'express'
import { listVouchers, createVoucher, updateVoucherStatus, deleteVoucher, getLedgerBalances } from '../controllers/voucherController.js'

const router = express.Router()

router.get('/ledger-balances', getLedgerBalances)
router.get('/', listVouchers)
router.post('/', createVoucher)
router.patch('/:voucherId', updateVoucherStatus)
router.delete('/:voucherId', deleteVoucher)

export default router
