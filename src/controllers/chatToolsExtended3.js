/**
 * chatToolsExtended3.js
 *
 * Third extension file for VidyaBot AI tools.
 * Covers master data / settings tables:
 *   - Subjects  (list, add, update, delete)
 *   - Periods   (list, add, update, delete)
 *   - MasterData categories:
 *       teacher-designations, staff-designations, fee-types,
 *       expense-categories, leave-types, book-categories,
 *       staff-departments, event-categories
 *     (list, add, update, delete)
 *
 * Chained from chatToolsExtended2.js default case.
 */

import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'
import { executeExtendedTool4 } from './chatToolsExtended4.js'

const VALID_MASTER_CATEGORIES = [
  'teacher-designations',
  'staff-designations',
  'fee-types',
  'expense-categories',
  'leave-types',
  'book-categories',
  'staff-departments',
  'event-categories',
]

// ── Tool declarations ─────────────────────────────────────────────────────────
export const extendedToolDeclarations3 = [

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBJECTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_subjects',
    description: 'List all subjects defined for this school. Returns subject id, name, and code.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: [],
    },
  },
  {
    name: 'add_subject',
    description: 'Add a new subject to the school. Both name and a short code are required.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'Full subject name, e.g. "Mathematics"' },
        code: { type: 'STRING', description: 'Short subject code, max 10 chars, e.g. "MATH"' },
      },
      required: ['name', 'code'],
    },
  },
  {
    name: 'update_subject',
    description: 'Update an existing subject\'s name or code. Call list_subjects first to get the id.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id:   { type: 'NUMBER', description: 'Subject ID (required)' },
        name: { type: 'STRING', description: 'New subject name (optional)' },
        code: { type: 'STRING', description: 'New subject code, max 10 chars (optional)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_subject',
    description: 'Delete a subject permanently. Call list_subjects to confirm the id first.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'NUMBER', description: 'Subject ID to delete' },
      },
      required: ['id'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PERIODS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_periods',
    description: 'List all school periods (class periods + breaks) ordered by sort order.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: [],
    },
  },
  {
    name: 'add_period',
    description: 'Add a new school period or break. sortOrder determines position in the timetable.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name:      { type: 'STRING',  description: 'Period name, e.g. "Period 1" or "Lunch Break"' },
        startTime: { type: 'STRING',  description: 'Start time in HH:MM 24h format, e.g. "08:00"' },
        endTime:   { type: 'STRING',  description: 'End time in HH:MM 24h format, e.g. "08:45"' },
        sortOrder: { type: 'NUMBER',  description: 'Position in timetable (1-based). Defaults to next available.' },
        isBreak:   { type: 'BOOLEAN', description: 'true if this is a break (lunch, recess), false for regular period' },
      },
      required: ['name', 'startTime', 'endTime'],
    },
  },
  {
    name: 'update_period',
    description: 'Update an existing school period. Call list_periods first to get the id.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id:        { type: 'NUMBER',  description: 'Period ID (required)' },
        name:      { type: 'STRING',  description: 'New period name (optional)' },
        startTime: { type: 'STRING',  description: 'New start time HH:MM (optional)' },
        endTime:   { type: 'STRING',  description: 'New end time HH:MM (optional)' },
        sortOrder: { type: 'NUMBER',  description: 'New sort order (optional)' },
        isBreak:   { type: 'BOOLEAN', description: 'true if break, false if regular period (optional)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_period',
    description: 'Delete a school period permanently. Call list_periods to confirm the id first.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'NUMBER', description: 'Period ID to delete' },
      },
      required: ['id'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MASTER DATA  (teacher-designations, staff-designations, fee-types,
  //               expense-categories, leave-types, book-categories,
  //               staff-departments, event-categories)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_master_data',
    description: `List all values in a master-data category.
Valid categories: teacher-designations, staff-designations, fee-types, expense-categories, leave-types, book-categories, staff-departments, event-categories.
Returns id, label, value, isActive for each item.`,
    parameters: {
      type: 'OBJECT',
      properties: {
        category: {
          type: 'STRING',
          description: 'One of: teacher-designations, staff-designations, fee-types, expense-categories, leave-types, book-categories, staff-departments, event-categories',
        },
      },
      required: ['category'],
    },
  },
  {
    name: 'add_master_data',
    description: `Add a new value to a master-data category.
Valid categories: teacher-designations, staff-designations, fee-types, expense-categories, leave-types, book-categories, staff-departments, event-categories.`,
    parameters: {
      type: 'OBJECT',
      properties: {
        category: {
          type: 'STRING',
          description: 'One of: teacher-designations, staff-designations, fee-types, expense-categories, leave-types, book-categories, staff-departments, event-categories',
        },
        label: { type: 'STRING', description: 'Display label for the new value, e.g. "Lab Assistant"' },
      },
      required: ['category', 'label'],
    },
  },
  {
    name: 'update_master_data',
    description: 'Update the label or active status of a master-data item. Call list_master_data first to get the id.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id:       { type: 'NUMBER',  description: 'Master data item ID (required)' },
        label:    { type: 'STRING',  description: 'New display label (optional)' },
        isActive: { type: 'BOOLEAN', description: 'true to activate, false to deactivate (optional)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_master_data',
    description: 'Permanently delete a master-data item. Call list_master_data to confirm the id first.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'NUMBER', description: 'Master data item ID to delete' },
      },
      required: ['id'],
    },
  },
]

// ── Executor ──────────────────────────────────────────────────────────────────
export const executeExtendedTool3 = async (name, args, schoolId) => {
  const sid = parseInt(schoolId) || 1

  try {
    switch (name) {

      // ─────────────────────────────────────────────────────────────────────
      // SUBJECTS
      // ─────────────────────────────────────────────────────────────────────
      case 'list_subjects': {
        const subjects = await prisma.subject.findMany({
          where: { schoolId: sid },
          orderBy: { name: 'asc' },
        })
        if (subjects.length === 0) return { message: 'No subjects found. You can add subjects using add_subject.' }
        const lines = subjects.map(s => `• **${s.name}** (code: ${s.code}, id: ${s.id})`)
        return { count: subjects.length, subjects: lines.join('\n') }
      }

      case 'add_subject': {
        if (!args.name?.trim()) return { error: 'Subject name is required.' }
        if (!args.code?.trim()) return { error: 'Subject code is required.' }
        const existing = await prisma.subject.findFirst({
          where: {
            schoolId: sid,
            OR: [
              { name: { equals: args.name.trim(), mode: 'insensitive' } },
              { code: { equals: args.code.trim().toUpperCase(), mode: 'insensitive' } },
            ],
          },
        })
        if (existing) return { error: `Subject "${existing.name}" (${existing.code}) already exists.` }
        const subject = await prisma.subject.create({
          data: { schoolId: sid, name: args.name.trim(), code: args.code.trim().toUpperCase() },
        })
        logInfo(`[AI] Subject created: ${subject.name}`, { filename: 'chatToolsExtended3.js' })
        return { success: true, message: `✅ Subject **"${subject.name}"** (code: ${subject.code}) added successfully.` }
      }

      case 'update_subject': {
        if (!args.id) return { error: 'Subject ID is required.' }
        const existing = await prisma.subject.findFirst({ where: { id: parseInt(args.id), schoolId: sid } })
        if (!existing) return { error: `Subject with id ${args.id} not found.` }
        const data = {}
        if (args.name?.trim()) data.name = args.name.trim()
        if (args.code?.trim()) data.code = args.code.trim().toUpperCase()
        if (Object.keys(data).length === 0) return { error: 'No fields to update. Provide name or code.' }
        const updated = await prisma.subject.update({ where: { id: parseInt(args.id) }, data })
        logInfo(`[AI] Subject updated: id=${args.id}`, { filename: 'chatToolsExtended3.js' })
        return { success: true, message: `✅ Subject updated to **"${updated.name}"** (code: ${updated.code}).` }
      }

      case 'delete_subject': {
        if (!args.id) return { error: 'Subject ID is required.' }
        const existing = await prisma.subject.findFirst({ where: { id: parseInt(args.id), schoolId: sid } })
        if (!existing) return { error: `Subject with id ${args.id} not found.` }
        await prisma.subject.delete({ where: { id: parseInt(args.id) } })
        logInfo(`[AI] Subject deleted: id=${args.id}`, { filename: 'chatToolsExtended3.js' })
        return { success: true, message: `✅ Subject **"${existing.name}"** deleted successfully.` }
      }

      // ─────────────────────────────────────────────────────────────────────
      // PERIODS
      // ─────────────────────────────────────────────────────────────────────
      case 'list_periods': {
        const periods = await prisma.period.findMany({
          where: { schoolId: sid },
          orderBy: { sortOrder: 'asc' },
        })
        if (periods.length === 0) return { message: 'No periods defined. Add periods using add_period.' }
        const lines = periods.map(p => {
          const tag = p.isBreak ? '☕ Break' : '📖 Period'
          return `${p.sortOrder}. [${tag}] **${p.name}** — ${p.startTime} to ${p.endTime} (id: ${p.id})`
        })
        return { count: periods.length, periods: lines.join('\n') }
      }

      case 'add_period': {
        if (!args.name?.trim())  return { error: 'Period name is required.' }
        if (!args.startTime)     return { error: 'startTime is required (HH:MM).' }
        if (!args.endTime)       return { error: 'endTime is required (HH:MM).' }
        // Auto-compute sortOrder if not provided
        let sortOrder = args.sortOrder ? parseInt(args.sortOrder) : null
        if (!sortOrder) {
          const max = await prisma.period.aggregate({ where: { schoolId: sid }, _max: { sortOrder: true } })
          sortOrder = (max._max.sortOrder ?? 0) + 1
        }
        const period = await prisma.period.create({
          data: {
            schoolId: sid,
            name: args.name.trim(),
            startTime: args.startTime,
            endTime: args.endTime,
            sortOrder,
            isBreak: args.isBreak === true,
          },
        })
        logInfo(`[AI] Period created: ${period.name}`, { filename: 'chatToolsExtended3.js' })
        const tag = period.isBreak ? 'Break' : 'Period'
        return { success: true, message: `✅ ${tag} **"${period.name}"** (${period.startTime}–${period.endTime}) added at position ${period.sortOrder}.` }
      }

      case 'update_period': {
        if (!args.id) return { error: 'Period ID is required.' }
        const existing = await prisma.period.findFirst({ where: { id: parseInt(args.id), schoolId: sid } })
        if (!existing) return { error: `Period with id ${args.id} not found.` }
        const data = {}
        if (args.name?.trim())        data.name      = args.name.trim()
        if (args.startTime)           data.startTime = args.startTime
        if (args.endTime)             data.endTime   = args.endTime
        if (args.sortOrder != null)   data.sortOrder = parseInt(args.sortOrder)
        if (args.isBreak != null)     data.isBreak   = Boolean(args.isBreak)
        if (Object.keys(data).length === 0) return { error: 'No fields to update.' }
        const updated = await prisma.period.update({ where: { id: parseInt(args.id) }, data })
        logInfo(`[AI] Period updated: id=${args.id}`, { filename: 'chatToolsExtended3.js' })
        return { success: true, message: `✅ Period **"${updated.name}"** updated (${updated.startTime}–${updated.endTime}).` }
      }

      case 'delete_period': {
        if (!args.id) return { error: 'Period ID is required.' }
        const existing = await prisma.period.findFirst({ where: { id: parseInt(args.id), schoolId: sid } })
        if (!existing) return { error: `Period with id ${args.id} not found.` }
        await prisma.period.delete({ where: { id: parseInt(args.id) } })
        logInfo(`[AI] Period deleted: id=${args.id}`, { filename: 'chatToolsExtended3.js' })
        return { success: true, message: `✅ Period **"${existing.name}"** deleted successfully.` }
      }

      // ─────────────────────────────────────────────────────────────────────
      // MASTER DATA
      // ─────────────────────────────────────────────────────────────────────
      case 'list_master_data': {
        const cat = args.category?.trim()
        if (!cat || !VALID_MASTER_CATEGORIES.includes(cat)) {
          return { error: `Invalid category. Valid options: ${VALID_MASTER_CATEGORIES.join(', ')}` }
        }
        // Auto-seed defaults if empty
        const count = await prisma.masterData.count({ where: { schoolId: sid, category: cat } })
        if (count === 0) {
          // Seed defaults inline (mirrors masterDataController seedIfEmpty)
          const DEFAULTS = {
            'teacher-designations': ['PRT', 'TGT', 'PGT', 'HOD', 'Vice Principal', 'Principal'],
            'staff-designations':   ['Watchman', 'Security Guard', 'Cleaning Staff', 'Sweeper', 'Peon', 'Office Boy', 'Cook', 'Kitchen Staff', 'Gardener', 'Electrician', 'Plumber'],
            'fee-types':            ['tuition', 'exam', 'transport', 'library', 'sports', 'lab', 'other'],
            'expense-categories':   ['maintenance', 'salary', 'supplies', 'transport', 'utility', 'infrastructure', 'events', 'sports', 'other'],
            'leave-types':          ['sick', 'casual', 'annual', 'maternity', 'paternity', 'emergency', 'unpaid'],
            'book-categories':      ['textbook', 'reference', 'fiction', 'non-fiction', 'magazine'],
            'staff-departments':    ['Office', 'Security', 'Housekeeping', 'Laboratory', 'Library', 'Kitchen', 'Hostel', 'Maintenance', 'Transport', 'Other'],
            'event-categories':     ['Academic', 'Sports', 'Cultural', 'Other'],
          }
          const defaults = DEFAULTS[cat] || []
          if (defaults.length > 0) {
            await prisma.masterData.createMany({
              data: defaults.map((val, i) => ({
                schoolId: sid, category: cat,
                value: val.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                label: val, sortOrder: i + 1, isActive: true,
              })),
              skipDuplicates: true,
            })
          }
        }
        const items = await prisma.masterData.findMany({
          where: { schoolId: sid, category: cat },
          orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
        })
        if (items.length === 0) return { message: `No items found in category "${cat}".` }
        const lines = items.map(it => `• **${it.label}** (id: ${it.id}, active: ${it.isActive})`)
        return { category: cat, count: items.length, items: lines.join('\n') }
      }

      case 'add_master_data': {
        const cat = args.category?.trim()
        if (!cat || !VALID_MASTER_CATEGORIES.includes(cat)) {
          return { error: `Invalid category. Valid options: ${VALID_MASTER_CATEGORIES.join(', ')}` }
        }
        if (!args.label?.trim()) return { error: 'Label is required.' }
        const value = args.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const existing = await prisma.masterData.findUnique({
          where: { schoolId_category_value: { schoolId: sid, category: cat, value } },
        })
        if (existing) return { error: `"${args.label}" already exists in ${cat}.` }
        const maxOrder = await prisma.masterData.aggregate({ where: { schoolId: sid, category: cat }, _max: { sortOrder: true } })
        const sortOrder = (maxOrder._max.sortOrder ?? 0) + 1
        const item = await prisma.masterData.create({
          data: { schoolId: sid, category: cat, value, label: args.label.trim(), sortOrder, isActive: true },
        })
        logInfo(`[AI] MasterData added: ${cat}/${item.label}`, { filename: 'chatToolsExtended3.js' })
        return { success: true, message: `✅ **"${item.label}"** added to ${cat} successfully.` }
      }

      case 'update_master_data': {
        if (!args.id) return { error: 'Master data item ID is required.' }
        const existing = await prisma.masterData.findFirst({ where: { id: parseInt(args.id), schoolId: sid } })
        if (!existing) return { error: `Master data item with id ${args.id} not found.` }
        const data = {}
        if (args.label?.trim()) {
          data.label = args.label.trim()
          data.value = args.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
        }
        if (args.isActive != null) data.isActive = Boolean(args.isActive)
        if (Object.keys(data).length === 0) return { error: 'No fields to update. Provide label or isActive.' }
        const updated = await prisma.masterData.update({ where: { id: parseInt(args.id) }, data })
        logInfo(`[AI] MasterData updated: id=${args.id}`, { filename: 'chatToolsExtended3.js' })
        return { success: true, message: `✅ Updated to **"${updated.label}"** (active: ${updated.isActive}).` }
      }

      case 'delete_master_data': {
        if (!args.id) return { error: 'Master data item ID is required.' }
        const existing = await prisma.masterData.findFirst({ where: { id: parseInt(args.id), schoolId: sid } })
        if (!existing) return { error: `Master data item with id ${args.id} not found.` }
        await prisma.masterData.delete({ where: { id: parseInt(args.id) } })
        logInfo(`[AI] MasterData deleted: id=${args.id}`, { filename: 'chatToolsExtended3.js' })
        return { success: true, message: `✅ **"${existing.label}"** removed from ${existing.category}.` }
      }

      default:
        return executeExtendedTool4(name, args, schoolId)
    }
  } catch (err) {
    logError(`executeExtendedTool3 [${name}] error: ${err.message}`, { filename: 'chatToolsExtended3.js' })
    return { error: err.message }
  }
}
