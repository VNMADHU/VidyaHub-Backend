import { Router } from 'express'
import { login, register, requestOtp } from '../controllers/authController.js'

const router = Router()

router.post('/login', login)
router.post('/register', register)
router.post('/otp', requestOtp)

export default router
