import express from 'express'
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  listDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
} from '../controllers/transportController.js'

const router = express.Router()

// Vehicles
router.get('/vehicles', listVehicles)
router.post('/vehicles', createVehicle)
router.patch('/vehicles/:vehicleId', updateVehicle)
router.delete('/vehicles/:vehicleId', deleteVehicle)

// Drivers
router.get('/drivers', listDrivers)
router.post('/drivers', createDriver)
router.patch('/drivers/:driverId', updateDriver)
router.delete('/drivers/:driverId', deleteDriver)

export default router
