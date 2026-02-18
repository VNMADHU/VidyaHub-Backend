import { Router } from 'express'
import { login, register, requestOtp } from '../controllers/authController.js'
import { authLimiter } from '../middlewares/rateLimiter.js'

const router = Router()

router.post('/login', authLimiter, login)
router.post('/register', authLimiter, register)
router.post('/otp', authLimiter, requestOtp)

export default router
