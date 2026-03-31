/**
 * chatToolsExtended4.js
 *
 * Fourth extension file for VidyaBot AI tools.
 * Covers:
 *   - Staff Attendance  (list, mark, update, summary)
 *   - Inventory / Assets (list, add, update, delete)
 *
 * Chained from chatToolsExtended3.js default case.
 */

import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'
import { executeExtendedTool5 } from './chatToolsExtended5.js'

// ─── Tool Declarations ────────────────────────────────────────────────────────

export const extendedToolDeclarations4 = [
  // ── Staff Attendance ──
  {
    name: 'get_staff_attendance_summary',
    description: 'Get staff attendance summary for a specific date (or today). Returns present/absent/late counts grouped by employee type.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format. Defaults to today if not provided.' },
      },
    },
  },
  {
    name: 'list_staff_attendance',
    description: 'List staff attendance records for a date or date range, optionally filtered by employee type (teacher, staff, driver).',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Exact date in YYYY-MM-DD. Use this OR fromDate/toDate.' },
        fromDate: { type: 'string', description: 'Start date (YYYY-MM-DD) for range query.' },
        toDate: { type: 'string', description: 'End date (YYYY-MM-DD) for range query.' },
        employeeType: { type: 'string', description: 'Filter by type: teacher, staff, or driver.' },
        employeeName: { type: 'string', description: 'Filter by employee name (partial match).' },
      },
    },
  },
  {
    name: 'mark_staff_attendance',
    description: 'Mark attendance for one or more staff members on a given date. Provide a list of entries with employeeType, employeeId, employeeName, and status.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format.' },
        entries: {
          type: 'array',
          description: 'List of attendance entries.',
          items: {
            type: 'object',
            properties: {
              employeeType: { type: 'string', description: 'teacher, staff, or driver.' },
              employeeId: { type: 'number', description: 'The DB id of the employee.' },
              employeeName: { type: 'string', description: 'Name (for display).' },
              status: { type: 'string', description: 'present, absent, late, half-day, or on-leave.' },
              inTime: { type: 'string', description: 'Optional. e.g. "09:00".' },
              outTime: { type: 'string', description: 'Optional. e.g. "17:00".' },
              remarks: { type: 'string', description: 'Optional remarks.' },
            },
            required: ['employeeType', 'employeeId', 'employeeName', 'status'],
          },
        },
        markedBy: { type: 'string', description: 'Admin email marking the attendance.' },
      },
      required: ['date', 'entries'],
    },
  },
  {
    name: 'update_staff_attendance',
    description: 'Update an existing staff attendance record (e.g. change status, inTime, outTime, remarks).',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'The id of the StaffAttendance record.' },
        status: { type: 'string', description: 'New status: present, absent, late, half-day, on-leave.' },
        inTime: { type: 'string', description: 'New inTime e.g. "09:30".' },
        outTime: { type: 'string', description: 'New outTime e.g. "17:00".' },
        remarks: { type: 'string', description: 'New remarks.' },
      },
      required: ['id'],
    },
  },

  // ── Inventory / Assets ──
  {
    name: 'list_assets',
    description: 'List all inventory assets in the school. Can filter by category, status, or search by name/code/location/vendor.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Filter by category: computer, furniture, lab-equipment, book, sports, vehicle-parts, other.' },
        status: { type: 'string', description: 'Filter by status: active, under-repair, disposed, lost.' },
        search: { type: 'string', description: 'Search term to match name, assetCode, location, or vendor.' },
      },
    },
  },
  {
    name: 'add_asset',
    description: 'Add a new asset/inventory item to the school.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Asset name e.g. "HP Laptop", "Wooden Chair".' },
        assetCode: { type: 'string', description: 'Optional asset code e.g. "COMP-001".' },
        category: { type: 'string', description: 'computer, furniture, lab-equipment, book, sports, vehicle-parts, other.' },
        quantity: { type: 'number', description: 'Quantity (default 1).' },
        unit: { type: 'string', description: 'Unit e.g. pieces, sets, kg.' },
        condition: { type: 'string', description: 'good, fair, poor, damaged. Default: good.' },
        location: { type: 'string', description: 'Where it is kept e.g. "Computer Lab".' },
        purchaseDate: { type: 'string', description: 'Purchase date YYYY-MM-DD.' },
        purchasePrice: { type: 'number', description: 'Purchase price in INR.' },
        vendor: { type: 'string', description: 'Vendor/supplier name.' },
        warrantyExpiry: { type: 'string', description: 'Warranty expiry date YYYY-MM-DD.' },
        invoiceNo: { type: 'string', description: 'Invoice number.' },
        description: { type: 'string', description: 'Additional notes.' },
        status: { type: 'string', description: 'active, under-repair, disposed, lost. Default: active.' },
      },
      required: ['name', 'category'],
    },
  },
  {
    name: 'update_asset',
    description: 'Update an existing asset record (e.g. change condition, status, location, quantity).',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'The id of the asset to update.' },
        name: { type: 'string' },
        assetCode: { type: 'string' },
        category: { type: 'string' },
        quantity: { type: 'number' },
        unit: { type: 'string' },
        condition: { type: 'string' },
        location: { type: 'string' },
        purchaseDate: { type: 'string' },
        purchasePrice: { type: 'number' },
        vendor: { type: 'string' },
        warrantyExpiry: { type: 'string' },
        invoiceNo: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_asset',
    description: 'Delete an asset/inventory item by its ID.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'The id of the asset to delete.' },
      },
      required: ['id'],
    },
  },
]

// ─── Executor ─────────────────────────────────────────────────────────────────

export const executeExtendedTool4 = async (name, args, schoolId) => {
  const sid = parseInt(schoolId)

  try {
    switch (name) {

      // ── Staff Attendance ──────────────────────────────────────────────────

      case 'get_staff_attendance_summary': {
        const targetDate = args.date ? new Date(args.date) : new Date()
        const dateStart = new Date(targetDate)
        dateStart.setHours(0, 0, 0, 0)
        const dateEnd = new Date(targetDate)
        dateEnd.setHours(23, 59, 59, 999)

        const records = await prisma.staffAttendance.findMany({
          where: { schoolId: sid, date: { gte: dateStart, lte: dateEnd } },
          select: { employeeType: true, status: true, employeeName: true },
        })

        if (!records.length) {
          return { message: `No staff attendance records found for **${args.date || 'today'}**.` }
        }

        const summary = {}
        for (const r of records) {
          if (!summary[r.employeeType]) summary[r.employeeType] = { present: 0, absent: 0, late: 0, 'half-day': 0, 'on-leave': 0, total: 0 }
          summary[r.employeeType][r.status] = (summary[r.employeeType][r.status] || 0) + 1
          summary[r.employeeType].total++
        }

        const lines = Object.entries(summary).map(([type, s]) =>
          `**${type.charAt(0).toUpperCase() + type.slice(1)}s** (${s.total} total): ✅ Present: ${s.present} | ❌ Absent: ${s.absent} | ⏰ Late: ${s.late} | 🌗 Half-day: ${s['half-day']} | 🏖️ On-leave: ${s['on-leave']}`
        )

        return { date: args.date || new Date().toISOString().split('T')[0], summary: lines.join('\n') }
      }

      case 'list_staff_attendance': {
        const where = { schoolId: sid }

        if (args.date) {
          const d = new Date(args.date)
          const start = new Date(d); start.setHours(0, 0, 0, 0)
          const end = new Date(d); end.setHours(23, 59, 59, 999)
          where.date = { gte: start, lte: end }
        } else if (args.fromDate && args.toDate) {
          const start = new Date(args.fromDate); start.setHours(0, 0, 0, 0)
          const end = new Date(args.toDate); end.setHours(23, 59, 59, 999)
          where.date = { gte: start, lte: end }
        }

        if (args.employeeType) where.employeeType = args.employeeType
        if (args.employeeName) where.employeeName = { contains: args.employeeName, mode: 'insensitive' }

        const records = await prisma.staffAttendance.findMany({
          where,
          orderBy: [{ date: 'desc' }, { employeeName: 'asc' }],
          take: 100,
        })

        if (!records.length) return { message: 'No staff attendance records found for the given filters.' }

        return {
          count: records.length,
          records: records.map(r => ({
            id: r.id,
            date: r.date.toISOString().split('T')[0],
            name: r.employeeName,
            type: r.employeeType,
            status: r.status,
            inTime: r.inTime,
            outTime: r.outTime,
            remarks: r.remarks,
          })),
        }
      }

      case 'mark_staff_attendance': {
        if (!args.date) return { error: 'Date is required.' }
        if (!Array.isArray(args.entries) || args.entries.length === 0) return { error: 'entries array is required.' }

        const date = new Date(args.date)
        const results = []

        for (const entry of args.entries) {
          const { employeeType, employeeId, employeeName, status, inTime, outTime, remarks } = entry
          const record = await prisma.staffAttendance.upsert({
            where: { employeeType_employeeId_date: { employeeType, employeeId, date } },
            update: { status, inTime: inTime || null, outTime: outTime || null, remarks: remarks || null, markedBy: args.markedBy || null },
            create: { schoolId: sid, employeeType, employeeId, employeeName, date, status, inTime: inTime || null, outTime: outTime || null, remarks: remarks || null, markedBy: args.markedBy || null },
          })
          results.push({ id: record.id, name: employeeName, status })
        }

        logInfo(`[AI] Staff attendance marked for ${results.length} employees on ${args.date}`, { filename: 'chatToolsExtended4.js' })
        return {
          success: true,
          message: `✅ Attendance marked for **${results.length} employee(s)** on **${args.date}**.`,
          records: results,
        }
      }

      case 'update_staff_attendance': {
        if (!args.id) return { error: 'Record ID is required.' }

        const existing = await prisma.staffAttendance.findFirst({ where: { id: parseInt(args.id), schoolId: sid } })
        if (!existing) return { error: `Staff attendance record with id ${args.id} not found.` }

        const data = {}
        if (args.status) data.status = args.status
        if (args.inTime !== undefined) data.inTime = args.inTime
        if (args.outTime !== undefined) data.outTime = args.outTime
        if (args.remarks !== undefined) data.remarks = args.remarks

        if (Object.keys(data).length === 0) return { error: 'No fields to update.' }

        const updated = await prisma.staffAttendance.update({ where: { id: parseInt(args.id) }, data })
        logInfo(`[AI] Staff attendance updated: id=${args.id}`, { filename: 'chatToolsExtended4.js' })
        return { success: true, message: `✅ Attendance for **${existing.employeeName}** on **${existing.date.toISOString().split('T')[0]}** updated to **${updated.status}**.` }
      }

      // ── Inventory / Assets ────────────────────────────────────────────────

      case 'list_assets': {
        const where = { schoolId: sid }
        if (args.category) where.category = args.category
        if (args.status) where.status = args.status
        if (args.search) {
          const q = args.search.toLowerCase()
          where.OR = [
            { name: { contains: args.search, mode: 'insensitive' } },
            { assetCode: { contains: args.search, mode: 'insensitive' } },
            { location: { contains: args.search, mode: 'insensitive' } },
            { vendor: { contains: args.search, mode: 'insensitive' } },
          ]
        }

        const assets = await prisma.asset.findMany({
          where,
          orderBy: { name: 'asc' },
        })

        if (!assets.length) return { message: 'No assets found matching the given filters.' }

        const totalValue = assets.reduce((sum, a) => sum + (a.purchasePrice || 0) * a.quantity, 0)

        return {
          count: assets.length,
          totalValue: `₹${totalValue.toLocaleString('en-IN')}`,
          assets: assets.map(a => ({
            id: a.id,
            name: a.name,
            code: a.assetCode,
            category: a.category,
            qty: a.quantity,
            condition: a.condition,
            status: a.status,
            location: a.location,
            vendor: a.vendor,
            purchasePrice: a.purchasePrice ? `₹${a.purchasePrice}` : null,
          })),
        }
      }

      case 'add_asset': {
        if (!args.name?.trim()) return { error: 'Asset name is required.' }
        if (!args.category) return { error: 'Category is required.' }

        const asset = await prisma.asset.create({
          data: {
            schoolId: sid,
            name: args.name.trim(),
            assetCode: args.assetCode || null,
            category: args.category,
            quantity: args.quantity || 1,
            unit: args.unit || null,
            condition: args.condition || 'good',
            location: args.location || null,
            purchaseDate: args.purchaseDate ? new Date(args.purchaseDate) : null,
            purchasePrice: args.purchasePrice || null,
            vendor: args.vendor || null,
            warrantyExpiry: args.warrantyExpiry ? new Date(args.warrantyExpiry) : null,
            invoiceNo: args.invoiceNo || null,
            description: args.description || null,
            status: args.status || 'active',
          },
        })

        logInfo(`[AI] Asset added: id=${asset.id} name=${asset.name}`, { filename: 'chatToolsExtended4.js' })
        return {
          success: true,
          message: `✅ Added **"${asset.name}"** (${asset.category}) — Qty: ${asset.quantity}, Condition: ${asset.condition}, Status: ${asset.status}.`,
          id: asset.id,
        }
      }

      case 'update_asset': {
        if (!args.id) return { error: 'Asset ID is required.' }

        const existing = await prisma.asset.findFirst({ where: { id: parseInt(args.id), schoolId: sid } })
        if (!existing) return { error: `Asset with id ${args.id} not found.` }

        const data = {}
        const fields = ['name', 'assetCode', 'category', 'quantity', 'unit', 'condition', 'location', 'purchasePrice', 'vendor', 'invoiceNo', 'description', 'status']
        for (const f of fields) {
          if (args[f] !== undefined) data[f] = args[f]
        }
        if (args.purchaseDate) data.purchaseDate = new Date(args.purchaseDate)
        if (args.warrantyExpiry) data.warrantyExpiry = new Date(args.warrantyExpiry)

        if (Object.keys(data).length === 0) return { error: 'No fields to update.' }

        const updated = await prisma.asset.update({ where: { id: parseInt(args.id) }, data })
        logInfo(`[AI] Asset updated: id=${args.id}`, { filename: 'chatToolsExtended4.js' })
        return { success: true, message: `✅ **"${updated.name}"** updated successfully.` }
      }

      case 'delete_asset': {
        if (!args.id) return { error: 'Asset ID is required.' }

        const existing = await prisma.asset.findFirst({ where: { id: parseInt(args.id), schoolId: sid } })
        if (!existing) return { error: `Asset with id ${args.id} not found.` }

        await prisma.asset.delete({ where: { id: parseInt(args.id) } })
        logInfo(`[AI] Asset deleted: id=${args.id} name=${existing.name}`, { filename: 'chatToolsExtended4.js' })
        return { success: true, message: `✅ **"${existing.name}"** removed from inventory.` }
      }

      default:
        return executeExtendedTool5(name, args, schoolId)
    }
  } catch (err) {
    logError(`executeExtendedTool4 [${name}] error: ${err.message}`, { filename: 'chatToolsExtended4.js' })
    return { error: err.message }
  }
}
