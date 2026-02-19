import { Router } from 'express'
import { login, register, requestOtp, changePassword } from '../controllers/authController.js'
import { authLimiter } from '../middlewares/rateLimiter.js'
import authenticate from '../middlewares/auth.js'

const router = Router()

router.post('/login', authLimiter, login)
router.post('/register', authLimiter, register)
router.post('/otp', authLimiter, requestOtp)
router.post('/change-password', authenticate, changePassword)

export default router
