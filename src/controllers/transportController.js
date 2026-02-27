import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

// ── Vehicle Schemas ───────────────────────────────────────
const vehicleSchema = z.object({
  vehicleNumber: z.string().min(1),
  vehicleType: z.string().min(1),
  capacity: z.number().int().min(1),
  driverId: z.number().int().optional().nullable(),
  routeName: z.string().optional(),
  routeStops: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  fitnessExpiry: z.string().optional(),
  permitExpiry: z.string().optional(),
  status: z.string().optional(),
})

const driverSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().min(1),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  experience: z.string().optional(),
  licenseNumber: z.string().min(1),
  licenseType: z.string().optional(),
  licenseExpiry: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  badgeNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  profilePic: z.string().optional(),
  status: z.string().optional(),
})

// ── Vehicles CRUD ─────────────────────────────────────────

export const listVehicles = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    logInfo('Listing vehicles', { filename: 'transportController.js', schoolId })
    const vehicles = await prisma.vehicle.findMany({
      where: { schoolId: parseInt(schoolId) },
      include: { driver: true },
      orderBy: { vehicleNumber: 'asc' },
    })
    res.json({ data: vehicles, message: 'List of vehicles' })
  } catch (error) {
    logError(`List vehicles error: ${error.message}`, { filename: 'transportController.js' })
    next(error)
  }
}

export const createVehicle = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const validated = vehicleSchema.parse(req.body)
    logInfo('Creating vehicle', { filename: 'transportController.js', schoolId })
    const data = {
      ...validated,
      schoolId: parseInt(schoolId),
    }
    if (validated.insuranceExpiry) data.insuranceExpiry = new Date(validated.insuranceExpiry)
    if (validated.fitnessExpiry) data.fitnessExpiry = new Date(validated.fitnessExpiry)
    if (validated.permitExpiry) data.permitExpiry = new Date(validated.permitExpiry)
    const vehicle = await prisma.vehicle.create({ data })
    res.status(201).json({ data: vehicle, message: 'Vehicle created' })
  } catch (error) {
    logError(`Create vehicle error: ${error.message}`, { filename: 'transportController.js' })
    next(error)
  }
}

export const updateVehicle = async (req, res, next) => {
  try {
    const { vehicleId } = req.params
    const data = { ...req.body }
    if (data.insuranceExpiry) data.insuranceExpiry = new Date(data.insuranceExpiry)
    if (data.fitnessExpiry) data.fitnessExpiry = new Date(data.fitnessExpiry)
    if (data.permitExpiry) data.permitExpiry = new Date(data.permitExpiry)
    logInfo('Updating vehicle', { filename: 'transportController.js', vehicleId })
    const vehicle = await prisma.vehicle.update({
      where: { id: parseInt(vehicleId) },
      data,
    })
    res.json({ data: vehicle, message: 'Vehicle updated' })
  } catch (error) {
    logError(`Update vehicle error: ${error.message}`, { filename: 'transportController.js' })
    next(error)
  }
}

export const deleteVehicle = async (req, res, next) => {
  try {
    const { vehicleId } = req.params
    logInfo('Deleting vehicle', { filename: 'transportController.js', vehicleId })
    await prisma.vehicle.delete({ where: { id: parseInt(vehicleId) } })
    res.json({ message: 'Vehicle deleted' })
  } catch (error) {
    logError(`Delete vehicle error: ${error.message}`, { filename: 'transportController.js' })
    next(error)
  }
}

// ── Drivers CRUD ──────────────────────────────────────────

export const listDrivers = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    logInfo('Listing drivers', { filename: 'transportController.js', schoolId })
    const drivers = await prisma.driver.findMany({
      where: { schoolId: parseInt(schoolId) },
      include: { vehicles: true },
      orderBy: { firstName: 'asc' },
    })
    res.json({ data: drivers, message: 'List of drivers' })
  } catch (error) {
    logError(`List drivers error: ${error.message}`, { filename: 'transportController.js' })
    next(error)
  }
}

export const createDriver = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const validated = driverSchema.parse(req.body)
    logInfo('Creating driver', { filename: 'transportController.js', schoolId })
    const data = {
      ...validated,
      schoolId: parseInt(schoolId),
    }
    if (validated.dateOfBirth) data.dateOfBirth = new Date(validated.dateOfBirth)
    if (validated.licenseExpiry) data.licenseExpiry = new Date(validated.licenseExpiry)
    const driver = await prisma.driver.create({ data })
    res.status(201).json({ data: driver, message: 'Driver created' })
  } catch (error) {
    logError(`Create driver error: ${error.message}`, { filename: 'transportController.js' })
    next(error)
  }
}

export const updateDriver = async (req, res, next) => {
  try {
    const { driverId } = req.params
    const data = { ...req.body }
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth)
    if (data.licenseExpiry) data.licenseExpiry = new Date(data.licenseExpiry)
    logInfo('Updating driver', { filename: 'transportController.js', driverId })
    const driver = await prisma.driver.update({
      where: { id: parseInt(driverId) },
      data,
    })
    res.json({ data: driver, message: 'Driver updated' })
  } catch (error) {
    logError(`Update driver error: ${error.message}`, { filename: 'transportController.js' })
    next(error)
  }
}

export const deleteDriver = async (req, res, next) => {
  try {
    const { driverId } = req.params
    logInfo('Deleting driver', { filename: 'transportController.js', driverId })
    await prisma.driver.delete({ where: { id: parseInt(driverId) } })
    res.json({ message: 'Driver deleted' })
  } catch (error) {
    logError(`Delete driver error: ${error.message}`, { filename: 'transportController.js' })
    next(error)
  }
}
