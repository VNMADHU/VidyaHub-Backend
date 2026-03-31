import { Router } from 'express'
import {
  createSchool,
  listSchools,
  updateSchool,
  deleteSchool,
  getSmsSettings,
  updateSmsSettings,
  getSchoolConfig,
  updateSchoolConfig,
} from '../controllers/schoolController.js'

const router = Router()

router.get('/', listSchools)
router.post('/', createSchool)
router.patch('/:schoolId', updateSchool)
router.delete('/:schoolId', deleteSchool)
router.get('/:schoolId/sms-settings', getSmsSettings)
router.patch('/:schoolId/sms-settings', updateSmsSettings)
router.get('/:schoolId/config', getSchoolConfig)
router.patch('/:schoolId/config', updateSchoolConfig)

export default router
