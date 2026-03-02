import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

// ── Schemas ───────────────────────────────────────────────
const hostelSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  totalCapacity: z.number().int().min(0).optional(),
  wardenName: z.string().optional().nullable(),
  wardenPhone: z.string().optional().nullable(),
  wardenEmail: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.string().optional(),
})

const roomSchema = z.object({
  hostelId: z.number().int(),
  roomNumber: z.string().min(1),
  floor: z.string().optional().nullable(),
  type: z.string().optional(),
  capacity: z.number().int().min(1).optional(),
  amenities: z.string().optional().nullable(),
  status: z.string().optional(),
})

const allotmentSchema = z.object({
  hostelId: z.number().int(),
  roomId: z.number().int(),
  studentId: z.number().int().optional().nullable(),
  studentName: z.string().min(1),
  admissionNumber: z.string().optional().nullable(),
  allotmentDate: z.string().optional(),
  vacatingDate: z.string().optional().nullable(),
  roomFee: z.number().optional().nullable(),
  messFee: z.number().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  status: z.string().optional(),
})

// ── Hostels CRUD ──────────────────────────────────────────
export const listHostels = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    logInfo('Listing hostels', { filename: 'hostelController.js', schoolId })
    const hostels = await prisma.hostel.findMany({
      where: { schoolId: parseInt(schoolId) },
      include: {
        _count: { select: { rooms: true, allotments: { where: { status: 'active' } } } },
      },
      orderBy: { name: 'asc' },
    })
    res.json({ data: hostels, message: 'List of hostels' })
  } catch (error) {
    logError(`List hostels error: ${error.message}`, { filename: 'hostelController.js' })
    next(error)
  }
}

export const getHostel = async (req, res, next) => {
  try {
    const { hostelId } = req.params
    logInfo('Getting hostel', { filename: 'hostelController.js', hostelId })
    const hostel = await prisma.hostel.findUnique({
      where: { id: parseInt(hostelId) },
      include: {
        rooms: true,
        allotments: { where: { status: 'active' }, orderBy: { studentName: 'asc' } },
      },
    })
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' })
    res.json({ data: hostel, message: 'Hostel details' })
  } catch (error) {
    logError(`Get hostel error: ${error.message}`, { filename: 'hostelController.js' })
    next(error)
  }
}

export const createHostel = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const validated = hostelSchema.parse(req.body)
    logInfo('Creating hostel', { filename: 'hostelController.js', schoolId })
    const hostel = await prisma.hostel.create({
      data: { ...validated, wardenEmail: validated.wardenEmail || null, schoolId: parseInt(schoolId) },
    })
    res.status(201).json({ data: hostel, message: 'Hostel created' })
  } catch (error) {
    logError(`Create hostel error: ${error.message}`, { filename: 'hostelController.js' })
    next(error)
  }
}

export const updateHostel = async (req, res, next) => {
  try {
    const { hostelId } = req.params
    const validated = hostelSchema.partial().parse(req.body)
    logInfo('Updating hostel', { filename: 'hostelController.js', hostelId })
    const hostel = await prisma.hostel.update({
      where: { id: parseInt(hostelId) },
      data: { ...validated, wardenEmail: validated.wardenEmail || null },
    })
    res.json({ data: hostel, message: 'Hostel updated' })
  } catch (error) {
    logError(`Update hostel error: ${error.message}`, { filename: 'hostelController.js' })
    next(error)
  }
}

export const deleteHostel = async (req, res, next) => {
  try {
    const { hostelId } = req.params
    logInfo('Deleting hostel', { filename: 'hostelController.js', hostelId })
    await prisma.hostel.delete({ where: { id: parseInt(hostelId) } })
    res.json({ message: 'Hostel deleted' })
  } catch (error) {
    logError(`Delete hostel error: ${error.message}`, { filename: 'hostelController.js' })
    next(error)
  }
}

// ── Rooms CRUD ────────────────────────────────────────────
export const listRooms = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const { hostelId } = req.query
    logInfo('Listing hostel rooms', { filename: 'hostelController.js', schoolId })
    const rooms = await prisma.hostelRoom.findMany({
      where: {
        schoolId: parseInt(schoolId),
        ...(hostelId ? { hostelId: parseInt(hostelId) } : {}),
      },
      include: {
        hostel: { select: { name: true } },
        _count: { select: { allotments: { where: { status: 'active' } } } },
      },
      orderBy: [{ hostelId: 'asc' }, { roomNumber: 'asc' }],
    })
    res.json({ data: rooms, message: 'List of hostel rooms' })
  } catch (error) {
    logError(`List rooms error: ${error.message}`, { filename: 'hostelController.js' })
    next(error)
  }
}

export const createRoom = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const validated = roomSchema.parse(req.body)
    logInfo('Creating hostel room', { filename: 'hostelController.js', schoolId })
    const room = await prisma.hostelRoom.create({
      data: { ...validated, schoolId: parseInt(schoolId) },
    })
    res.status(201).json({ data: room, message: 'Room created' })
  } catch (error) {
    logError(`Create room error: ${error.message}`, { filename: 'hostelController.js' })
    next(error)
  }
}

export const updateRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params
    const validated = roomSchema.partial().parse(req.body)
    logInfo('Updating hostel room', { filename: 'hostelController.js', roomId })
    const room = await prisma.hostelRoom.update({
      where: { id: parseInt(roomId) },
      data: validated,
    })
    res.json({ data: room, message: 'Room updated' })
  } catch (error) {
    logError(`Update room error: ${error.message}`, { filename: 'hostelController.js' })
    next(error)
  }
}

export const deleteRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params
    logInfo('Deleting hostel room', { filename: 'hostelController.js', roomId })
    await prisma.hostelRoom.delete({ where: { id: parseInt(roomId) } })
    res.json({ message: 'Room deleted' })
  } catch (error) {
    logError(`Delete room error: ${error.message}`, { filename: 'hostelController.js' })
    next(error)
  }
}

// ── Allotments CRUD ───────────────────────────────────────
export const listAllotments = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const { hostelId, status } = req.query
    logInfo('Listing allotments', { filename: 'hostelController.js', schoolId })
    const allotments = await prisma.hostelAllotment.findMany({
      where: {
        schoolId: parseInt(schoolId),
        ...(hostelId ? { hostelId: parseInt(hostelId) } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        hostel: { select: { name: true } },
        room: { select: { roomNumber: true, floor: true } },
      },
      orderBy: { studentName: 'asc' },
    })
    res.json({ data: allotments, message: 'List of allotments' })
  } catch (error) {
    logError(`List allotments error: ${error.message}`, { filename: 'hostelController.js' })
    next(error)
  }
}

export const createAllotment = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const validated = allotmentSchema.parse(req.body)
    logInfo('Creating allotment', { filename: 'hostelController.js', schoolId })
    const data = {
      ...validated,
      schoolId: parseInt(schoolId),
      allotmentDate: validated.allotmentDate ? new Date(validated.allotmentDate) : new Date(),
      vacatingDate: validated.vacatingDate ? new Date(validated.vacatingDate) : null,
    }
    const allotment = await prisma.hostelAllotment.create({ data })
    res.status(201).json({ data: allotment, message: 'Allotment created' })
  } catch (error) {
    logError(`Create allotment error: ${error.message}`, { filename: 'hostelController.js' })
    next(error)
  }
}

export const updateAllotment = async (req, res, next) => {
  try {
    const { allotmentId } = req.params
    const data = { ...req.body }
    if (data.allotmentDate) data.allotmentDate = new Date(data.allotmentDate)
    if (data.vacatingDate) data.vacatingDate = new Date(data.vacatingDate)
    logInfo('Updating allotment', { filename: 'hostelController.js', allotmentId })
    const allotment = await prisma.hostelAllotment.update({
      where: { id: parseInt(allotmentId) },
      data,
    })
    res.json({ data: allotment, message: 'Allotment updated' })
  } catch (error) {
    logError(`Update allotment error: ${error.message}`, { filename: 'hostelController.js' })
    next(error)
  }
}

export const deleteAllotment = async (req, res, next) => {
  try {
    const { allotmentId } = req.params
    logInfo('Deleting allotment', { filename: 'hostelController.js', allotmentId })
    await prisma.hostelAllotment.delete({ where: { id: parseInt(allotmentId) } })
    res.json({ message: 'Allotment deleted' })
  } catch (error) {
    logError(`Delete allotment error: ${error.message}`, { filename: 'hostelController.js' })
    next(error)
  }
}
