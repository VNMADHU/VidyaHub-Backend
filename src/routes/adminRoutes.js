import { Router } from 'express'
import authenticate, { authorize } from '../middlewares/auth.js'
import { listAdmins, getModules, createAdmin, updateAdmin, updateAdminPassword, toggleAdminStatus, deleteAdmin } from '../controllers/adminController.js'

const router = Router()

// Both super-admin, school-admin, and owner can manage admins
// Controllers scope results to the requester's school for school-admins
router.use(authenticate)
router.use(authorize('super-admin', 'school-admin', 'owner'))

router.get('/', listAdmins)
router.get('/modules', getModules)
router.post('/', createAdmin)
router.patch('/:id', updateAdmin)
router.patch('/:id/password', updateAdminPassword)
router.patch('/:id/status', toggleAdminStatus)
router.delete('/:id', deleteAdmin)

export default router
