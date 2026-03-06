import { Router } from 'express'
import { list, listAll, create, update, remove, categories } from '../controllers/masterDataController.js'

const router = Router()

router.get('/categories', categories)
router.get('/', list)
router.get('/all', listAll)
router.post('/', create)
router.patch('/:id', update)
router.delete('/:id', remove)

export default router
