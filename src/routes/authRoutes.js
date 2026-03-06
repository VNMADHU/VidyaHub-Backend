import { Router } from 'express'
import {
  login,
  forceLogin,
  verifyOtp,
  resendOtp,
  logout,
  sessionCheck,
  register,
  verifyEmail,
  verifyPhone,
  resendVerification,
  changePassword,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  getMfaSettings,
  updateMfaSettings,
} from '../controllers/authController.js'
import { authLimiter } from '../middlewares/rateLimiter.js'
import authenticate from '../middlewares/auth.js'

const router = Router()

// Public — rate-limited
router.post('/login', authLimiter, login)
router.post('/force-login', authLimiter, forceLogin)
router.post('/verify-otp', authLimiter, verifyOtp)
router.post('/resend-otp', authLimiter, resendOtp)
router.post('/register', authLimiter, register)
router.post('/verify-email', authLimiter, verifyEmail)
router.post('/verify-phone', authLimiter, verifyPhone)
router.post('/resend-verification', authLimiter, resendVerification)
router.post('/forgot-password', authLimiter, forgotPassword)
router.post('/reset-password', authLimiter, resetPassword)

// Authenticated
router.post('/logout', authenticate, logout)
router.get('/session-check', authenticate, sessionCheck)
router.post('/change-password', authenticate, changePassword)
router.get('/profile', authenticate, getProfile)
router.patch('/profile', authenticate, updateProfile)
router.get('/mfa-settings', authenticate, getMfaSettings)
router.patch('/mfa-settings', authenticate, updateMfaSettings)

export default router
