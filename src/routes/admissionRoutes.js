import { Router } from 'express'
import {
  listAdmissions,
  createAdmission,
  updateAdmission,
  deleteAdmission,
} from '../controllers/admissionController.js'
import trialLimit from '../middlewares/trialLimit.js'

const router = Router()

router.get('/',                     listAdmissions)
router.post('/',                    trialLimit('admission'), createAdmission)
router.patch('/:admissionId',       updateAdmission)
router.delete('/:admissionId',      deleteAdmission)

export default router
