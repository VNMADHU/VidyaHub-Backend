import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

// ── Default seeds per category ───────────────────────────────
const DEFAULTS = {
  'teacher-designations': [
    'PRT', 'TGT', 'PGT', 'HOD', 'Vice Principal', 'Principal',
  ],
  'staff-designations': [
    'Watchman', 'Security Guard', 'Cleaning Staff', 'Sweeper', 'Peon',
    'Office Boy', 'Cook', 'Kitchen Staff', 'Gardener', 'Electrician', 'Plumber',
  ],
  'fee-types': [
    'tuition', 'exam', 'transport', 'library', 'sports', 'lab', 'other',
  ],
  'expense-categories': [
    'maintenance', 'salary', 'supplies', 'transport', 'utility',
    'infrastructure', 'events', 'sports', 'other',
  ],
  'leave-types': [
    'sick', 'casual', 'annual', 'maternity', 'paternity', 'emergency', 'unpaid',
  ],
  'book-categories': [
    'textbook', 'reference', 'fiction', 'non-fiction', 'magazine',
  ],
  'staff-departments': [
    'Office', 'Security', 'Housekeeping', 'Laboratory', 'Library',
    'Kitchen', 'Hostel', 'Maintenance', 'Transport', 'Other',
  ],
  'event-categories': [
    'Academic', 'Sports', 'Cultural', 'Other',
  ],
}

const VALID_CATEGORIES = Object.keys(DEFAULTS)

// ── Seed defaults if category is empty ───────────────────────
const seedIfEmpty = async (schoolId, category) => {
  const count = await prisma.masterData.count({ where: { schoolId, category } })
  if (count > 0) return
  const defaults = DEFAULTS[category] || []
  if (defaults.length === 0) return
  await prisma.masterData.createMany({
    data: defaults.map((val, i) => ({
      schoolId,
      category,
      value: val.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label: val,
      sortOrder: i + 1,
      isActive: true,
    })),
    skipDuplicates: true,
  })
}

// ── List values for a category ───────────────────────────────
export const list = async (req, res, next) => {
  try {
    const { category } = req.query
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `Invalid category. Valid: ${VALID_CATEGORIES.join(', ')}` })
    }
    const schoolId = req.user.schoolId
    await seedIfEmpty(schoolId, category)
    const items = await prisma.masterData.findMany({
      where: { schoolId, category, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    })
    res.json(items)
  } catch (err) {
    logError(`MasterData list error: ${err.message}`, { filename: 'masterDataController.js' })
    next(err)
  }
}

// ── List ALL values (including inactive) — for settings ──────
export const listAll = async (req, res, next) => {
  try {
    const { category } = req.query
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `Invalid category.` })
    }
    const schoolId = req.user.schoolId
    await seedIfEmpty(schoolId, category)
    const items = await prisma.masterData.findMany({
      where: { schoolId, category },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    })
    res.json(items)
  } catch (err) {
    logError(`MasterData listAll error: ${err.message}`, { filename: 'masterDataController.js' })
    next(err)
  }
}

// ── Create a value ───────────────────────────────────────────
export const create = async (req, res, next) => {
  try {
    const { category, label } = req.body
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category.' })
    }
    if (!label?.trim()) {
      return res.status(400).json({ message: 'Label is required.' })
    }
    const schoolId = req.user.schoolId
    const value = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const existing = await prisma.masterData.findUnique({
      where: { schoolId_category_value: { schoolId, category, value } },
    })
    if (existing) {
      return res.status(409).json({ message: 'This value already exists.' })
    }

    const maxOrder = await prisma.masterData.aggregate({
      where: { schoolId, category },
      _max: { sortOrder: true },
    })
    const sortOrder = (maxOrder._max.sortOrder ?? 0) + 1

    const item = await prisma.masterData.create({
      data: { schoolId, category, value, label: label.trim(), sortOrder, isActive: true },
    })
    logInfo(`MasterData created: ${category}/${label}`, { filename: 'masterDataController.js' })
    res.status(201).json(item)
  } catch (err) {
    logError(`MasterData create error: ${err.message}`, { filename: 'masterDataController.js' })
    next(err)
  }
}

// ── Update a value ───────────────────────────────────────────
export const update = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID.' })
    const schoolId = req.user.schoolId

    const existing = await prisma.masterData.findFirst({ where: { id, schoolId } })
    if (!existing) return res.status(404).json({ message: 'Not found.' })

    const { label, sortOrder, isActive } = req.body
    const updateData = {}
    if (label !== undefined) {
      updateData.label = label.trim()
      updateData.value = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder)
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const item = await prisma.masterData.update({ where: { id }, data: updateData })
    res.json(item)
  } catch (err) {
    logError(`MasterData update error: ${err.message}`, { filename: 'masterDataController.js' })
    next(err)
  }
}

// ── Delete a value ───────────────────────────────────────────
export const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID.' })
    const schoolId = req.user.schoolId

    const existing = await prisma.masterData.findFirst({ where: { id, schoolId } })
    if (!existing) return res.status(404).json({ message: 'Not found.' })

    await prisma.masterData.delete({ where: { id } })
    res.json({ message: 'Deleted.' })
  } catch (err) {
    logError(`MasterData delete error: ${err.message}`, { filename: 'masterDataController.js' })
    next(err)
  }
}

// ── List all valid categories ────────────────────────────────
export const categories = (_req, res) => {
  res.json(VALID_CATEGORIES)
}
