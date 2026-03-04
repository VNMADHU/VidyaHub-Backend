import { Router } from 'express'
import {
  listAdmissions,
  createAdmission,
  updateAdmission,
  deleteAdmission,
} from '../controllers/admissionController.js'

const router = Router()

router.get('/',                     listAdmissions)
router.post('/',                    createAdmission)
router.patch('/:admissionId',       updateAdmission)
router.delete('/:admissionId',      deleteAdmission)

export default router
