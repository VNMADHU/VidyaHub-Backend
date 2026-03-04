import { Router } from 'express'
import { submitDemoRequest } from '../controllers/demoRequestController.js'

const router = Router()

router.post('/', submitDemoRequest)

export default router
