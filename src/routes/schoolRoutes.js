import { Router } from 'express'
import {
  createSchool,
  listSchools,
  updateSchool,
  deleteSchool,
} from '../controllers/schoolController.js'

const router = Router()

router.get('/', listSchools)
router.post('/', createSchool)
router.patch('/:schoolId', updateSchool)
router.delete('/:schoolId', deleteSchool)

export default router
