import express from 'express'
import {
  listHostels, getHostel, createHostel, updateHostel, deleteHostel,
  listRooms, createRoom, updateRoom, deleteRoom,
  listAllotments, createAllotment, updateAllotment, deleteAllotment,
} from '../controllers/hostelController.js'
import trialLimit from '../middlewares/trialLimit.js'

const router = express.Router()

// Hostels
router.get('/', listHostels)
router.post('/', trialLimit('hostel'), createHostel)
router.get('/:hostelId', getHostel)
router.patch('/:hostelId', updateHostel)
router.delete('/:hostelId', deleteHostel)

// Rooms
router.get('/rooms/list', listRooms)
router.post('/rooms', trialLimit('hostelRoom'), createRoom)
router.patch('/rooms/:roomId', updateRoom)
router.delete('/rooms/:roomId', deleteRoom)

// Allotments
router.get('/allotments/list', listAllotments)
router.post('/allotments', trialLimit('hostelAllotment'), createAllotment)
router.patch('/allotments/:allotmentId', updateAllotment)
router.delete('/allotments/:allotmentId', deleteAllotment)

export default router
