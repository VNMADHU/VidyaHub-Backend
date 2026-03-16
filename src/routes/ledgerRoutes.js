import express from 'express'
import { listLedgers, seedDefaultLedgers, createLedger, updateLedger, deleteLedger } from '../controllers/ledgerController.js'

const router = express.Router()

router.get('/', listLedgers)
router.post('/seed', seedDefaultLedgers)
router.post('/', createLedger)
router.patch('/:ledgerId', updateLedger)
router.delete('/:ledgerId', deleteLedger)

export default router
