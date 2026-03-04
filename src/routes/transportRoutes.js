import express from 'express'
import {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  listDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
} from '../controllers/transportController.js'
import trialLimit from '../middlewares/trialLimit.js'

const router = express.Router()

// Vehicles
router.get('/vehicles', listVehicles)
router.post('/vehicles', trialLimit('vehicle'), createVehicle)
router.get('/vehicles/:vehicleId', getVehicle)
router.patch('/vehicles/:vehicleId', updateVehicle)
router.delete('/vehicles/:vehicleId', deleteVehicle)

// Drivers
router.get('/drivers', listDrivers)
router.post('/drivers', trialLimit('driver'), createDriver)
router.get('/drivers/:driverId', getDriver)
router.patch('/drivers/:driverId', updateDriver)
router.delete('/drivers/:driverId', deleteDriver)

export default router
