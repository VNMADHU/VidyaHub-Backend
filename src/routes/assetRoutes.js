import { Router } from 'express'
import {
  listAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  assetSummary,
} from '../controllers/assetController.js'

const router = Router()

router.get('/summary', assetSummary)
router.get('/',        listAssets)
router.post('/',       createAsset)
router.patch('/:id',   updateAsset)
router.delete('/:id',  deleteAsset)

export default router
