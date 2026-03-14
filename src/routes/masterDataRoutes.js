import { Router } from 'express'
import trialLimit from '../middlewares/trialLimit.js'
import { list, listAll, create, update, remove, categories } from '../controllers/masterDataController.js'

const router = Router()

router.get('/categories', categories)
router.get('/', list)
router.get('/all', listAll)
router.post('/', trialLimit('masterData'), create)
router.patch('/:id', update)
router.delete('/:id', remove)

export default router
