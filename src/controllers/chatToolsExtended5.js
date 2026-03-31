/**
 * chatToolsExtended5.js
 *
 * Fifth extension file for VidyaBot AI tools.
 * Covers ALL previously missing modules:
 *   - Notifications       (list, send, delete)
 *   - Accounting          (list/create ledgers, list/create vouchers, ledger balances)
 *   - Hostel CRUD         (create/update/delete hostels, rooms, allotments)
 *   - Timetable CRUD      (create, update, delete timetable entries)
 *   - Library             (delete_book)
 *   - Classes             (update_class, delete_class)
 *   - Transfer Certificate (get_transfer_certificate)
 *
 * Chained from chatToolsExtended4.js default case.
 */

import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

// ─── Tool Declarations ────────────────────────────────────────────────────────

export const extendedToolDeclarations5 = [

  // ══════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════════
  {
    name: 'list_notifications',
    description: 'List past notifications/messages sent from the school (email or SMS). Shows type, subject, audience, status, and counts.',
    parameters: {
      type: 'OBJECT',
      properties: {
        type:    { type: 'STRING', description: 'Filter by type: announcement, event, fee-reminder, homework, custom (optional)' },
        channel: { type: 'STRING', description: 'Filter by channel: email, sms (optional)' },
        limit:   { type: 'NUMBER', description: 'Max records to return (default 20)' },
      },
      required: [],
    },
  },
  {
    name: 'send_notification',
    description: 'Send an email or SMS notification to parents, students, or staff. Use audience: all-parents, class:<classId>, student:<studentId>, custom.',
    parameters: {
      type: 'OBJECT',
      properties: {
        type:     { type: 'STRING', description: 'Type: announcement, event, fee-reminder, homework, custom' },
        channel:  { type: 'STRING', description: 'Delivery channel: email, sms, or both' },
        subject:  { type: 'STRING', description: 'Notification subject / title' },
        message:  { type: 'STRING', description: 'Full message body' },
        audience: { type: 'STRING', description: 'Who to send to: all-parents, class:<classId>, student:<studentId>, custom' },
        sentBy:   { type: 'STRING', description: 'Admin email sending the notification' },
      },
      required: ['type', 'channel', 'subject', 'message', 'audience'],
    },
  },
  {
    name: 'delete_notification',
    description: 'Delete a sent notification record by its ID. Call list_notifications first to get the ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'NUMBER', description: 'Notification record ID' },
      },
      required: ['id'],
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // ACCOUNTING — LEDGERS
  // ══════════════════════════════════════════════════════════════════
  {
    name: 'list_ledgers',
    description: 'List all accounting ledgers. Can filter by type (income, expense, asset, liability).',
    parameters: {
      type: 'OBJECT',
      properties: {
        type: { type: 'STRING', description: 'Filter by type: income, expense, asset, liability (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'create_ledger',
    description: 'Create a new accounting ledger account.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name:           { type: 'STRING', description: 'Ledger name e.g. "Salary Account", "School Fees Received"' },
        type:           { type: 'STRING', description: 'income, expense, asset, or liability' },
        group:          { type: 'STRING', description: 'Ledger group e.g. "Direct Income", "Current Asset" (optional)' },
        openingBalance: { type: 'NUMBER', description: 'Opening balance in INR (default 0)' },
        description:    { type: 'STRING', description: 'Description or notes (optional)' },
      },
      required: ['name', 'type'],
    },
  },
  {
    name: 'get_ledger_balances',
    description: 'Get current debit/credit balances for all ledgers. Useful for viewing P&L or balance sheet summary.',
    parameters: {
      type: 'OBJECT',
      properties: {
        type: { type: 'STRING', description: 'Filter by ledger type: income, expense, asset, liability (optional)' },
      },
      required: [],
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // ACCOUNTING — VOUCHERS
  // ══════════════════════════════════════════════════════════════════
  {
    name: 'list_vouchers',
    description: 'List accounting vouchers (receipts, payments, journal entries, contra). Can filter by type and date range.',
    parameters: {
      type: 'OBJECT',
      properties: {
        voucherType: { type: 'STRING', description: 'receipt, payment, journal, or contra (optional)' },
        fromDate:    { type: 'STRING', description: 'Start date YYYY-MM-DD (optional)' },
        toDate:      { type: 'STRING', description: 'End date YYYY-MM-DD (optional)' },
        limit:       { type: 'NUMBER', description: 'Max records to return (default 20)' },
      },
      required: [],
    },
  },
  {
    name: 'create_voucher',
    description: 'Create a new accounting voucher (double-entry). Provide debit and credit ledger entries. Call list_ledgers first to get ledger IDs.',
    parameters: {
      type: 'OBJECT',
      properties: {
        voucherType: { type: 'STRING', description: 'receipt, payment, journal, or contra' },
        date:        { type: 'STRING', description: 'Voucher date YYYY-MM-DD' },
        narration:   { type: 'STRING', description: 'Description of the transaction' },
        entries: {
          type: 'ARRAY',
          description: 'Debit and credit entries (must balance)',
          items: {
            type: 'OBJECT',
            properties: {
              ledgerId: { type: 'NUMBER', description: 'Ledger ID — call list_ledgers to find' },
              type:     { type: 'STRING', description: 'debit or credit' },
              amount:   { type: 'NUMBER', description: 'Amount in INR' },
            },
          },
        },
      },
      required: ['voucherType', 'date', 'entries'],
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // HOSTEL — FULL CRUD
  // ══════════════════════════════════════════════════════════════════
  {
    name: 'create_hostel',
    description: 'Create a new hostel block/building.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name:          { type: 'STRING', description: 'Hostel name e.g. "Boys Hostel Block A"' },
        type:          { type: 'STRING', description: 'boys, girls, or mixed (default boys)' },
        totalCapacity: { type: 'NUMBER', description: 'Total capacity in persons' },
        numberOfRooms: { type: 'NUMBER', description: 'Number of rooms' },
        wardenName:    { type: 'STRING', description: 'Warden full name (optional)' },
        wardenPhone:   { type: 'STRING', description: 'Warden contact number (optional)' },
        wardenEmail:   { type: 'STRING', description: 'Warden email (optional)' },
        address:       { type: 'STRING', description: 'Block / building address (optional)' },
        description:   { type: 'STRING', description: 'Additional notes (optional)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_hostel',
    description: 'Update hostel details. Call list_hostels first to get the ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id:            { type: 'NUMBER', description: 'Hostel ID (required)' },
        name:          { type: 'STRING' },
        type:          { type: 'STRING', description: 'boys, girls, mixed' },
        totalCapacity: { type: 'NUMBER' },
        numberOfRooms: { type: 'NUMBER' },
        wardenName:    { type: 'STRING' },
        wardenPhone:   { type: 'STRING' },
        wardenEmail:   { type: 'STRING' },
        address:       { type: 'STRING' },
        description:   { type: 'STRING' },
        status:        { type: 'STRING', description: 'active or inactive' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_hostel',
    description: 'Delete a hostel block. Call list_hostels first to get the ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'NUMBER', description: 'Hostel ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_hostel_room',
    description: 'Add a new room to a hostel. Call list_hostels to get hostelId.',
    parameters: {
      type: 'OBJECT',
      properties: {
        hostelId:   { type: 'NUMBER', description: 'Hostel ID — call list_hostels to find' },
        roomNumber: { type: 'STRING', description: 'Room number e.g. "101", "A-202"' },
        floor:      { type: 'STRING', description: 'Floor e.g. "Ground", "1st" (optional)' },
        type:       { type: 'STRING', description: 'single, double, triple, or dormitory (default double)' },
        capacity:   { type: 'NUMBER', description: 'Number of beds (default 2)' },
        amenities:  { type: 'STRING', description: 'Comma-separated: AC, Attached Bathroom, TV, WiFi (optional)' },
      },
      required: ['hostelId', 'roomNumber'],
    },
  },
  {
    name: 'add_hostel_allotment',
    description: 'Allot a hostel room to a student. Call list_hostels and list_hostel_allotments to find hostelId and roomId.',
    parameters: {
      type: 'OBJECT',
      properties: {
        hostelId:        { type: 'NUMBER', description: 'Hostel ID' },
        roomId:          { type: 'NUMBER', description: 'Room ID — call list_hostel_allotments or list_hostels to find' },
        studentId:       { type: 'NUMBER', description: 'Student DB ID (optional)' },
        studentName:     { type: 'STRING', description: 'Student full name' },
        admissionNumber: { type: 'STRING', description: 'Student admission number (optional)' },
        allotmentDate:   { type: 'STRING', description: 'Allotment date YYYY-MM-DD (default today)' },
        roomFee:         { type: 'NUMBER', description: 'Monthly room fee in INR (optional)' },
        messFee:         { type: 'NUMBER', description: 'Monthly mess fee in INR (optional)' },
        emergencyContact:{ type: 'STRING', description: 'Emergency contact number (optional)' },
        remarks:         { type: 'STRING', description: 'Additional notes (optional)' },
      },
      required: ['hostelId', 'roomId', 'studentName'],
    },
  },
  {
    name: 'update_hostel_allotment',
    description: 'Update a hostel allotment (e.g. mark as vacated, update fee). Call list_hostel_allotments first to get the ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id:              { type: 'NUMBER', description: 'Allotment record ID (required)' },
        roomFee:         { type: 'NUMBER' },
        messFee:         { type: 'NUMBER' },
        vacatingDate:    { type: 'STRING', description: 'YYYY-MM-DD — set when student vacates' },
        status:          { type: 'STRING', description: 'active or vacated' },
        emergencyContact:{ type: 'STRING' },
        remarks:         { type: 'STRING' },
      },
      required: ['id'],
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // TIMETABLE — FULL CRUD
  // ══════════════════════════════════════════════════════════════════
  {
    name: 'create_timetable_entry',
    description: 'Add a timetable entry for a class on a specific day and period. Call list_classes and list_periods first.',
    parameters: {
      type: 'OBJECT',
      properties: {
        classId:       { type: 'NUMBER', description: 'Class ID — call list_classes to find' },
        day:           { type: 'STRING', description: 'Day of week: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday' },
        periodId:      { type: 'NUMBER', description: 'Period ID — call list_periods to find' },
        subject:       { type: 'STRING', description: 'Subject name' },
        teacher:       { type: 'STRING', description: 'Teacher name' },
        effectiveFrom: { type: 'STRING', description: 'Date from which this is effective YYYY-MM-DD (optional, default today)' },
      },
      required: ['classId', 'day', 'subject', 'teacher'],
    },
  },
  {
    name: 'update_timetable_entry',
    description: 'Update an existing timetable entry. Call get_timetable first to find the entry ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id:            { type: 'NUMBER', description: 'Timetable entry ID (required)' },
        subject:       { type: 'STRING' },
        teacher:       { type: 'STRING' },
        periodId:      { type: 'NUMBER' },
        day:           { type: 'STRING' },
        effectiveFrom: { type: 'STRING', description: 'New effective date YYYY-MM-DD' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_timetable_entry',
    description: 'Delete a timetable entry by ID. Call get_timetable first to find the entry ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'NUMBER', description: 'Timetable entry ID' },
      },
      required: ['id'],
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // LIBRARY — DELETE BOOK
  // ══════════════════════════════════════════════════════════════════
  {
    name: 'delete_book',
    description: 'Delete a book from the library catalogue. Call list_books first to get the book ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'NUMBER', description: 'Book ID' },
      },
      required: ['id'],
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // CLASSES — UPDATE / DELETE
  // ══════════════════════════════════════════════════════════════════
  {
    name: 'update_class',
    description: 'Update a class name or details. Call list_classes first to get the class ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id:   { type: 'NUMBER', description: 'Class ID (required)' },
        name: { type: 'STRING', description: 'New class name e.g. "Class 10"' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_class',
    description: 'Delete a class. Call list_classes first to get the class ID. This will fail if students are assigned to it.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id: { type: 'NUMBER', description: 'Class ID' },
      },
      required: ['id'],
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // TRANSFER CERTIFICATE
  // ══════════════════════════════════════════════════════════════════
  {
    name: 'get_transfer_certificate',
    description: 'Get transfer certificate (TC) details for a student — includes school info, student details, attendance record, conduct, and academic summary.',
    parameters: {
      type: 'OBJECT',
      properties: {
        studentId: { type: 'NUMBER', description: 'Student DB ID — call list_students or search_student to find' },
      },
      required: ['studentId'],
    },
  },
]

// ─── Executor ─────────────────────────────────────────────────────────────────

export const executeExtendedTool5 = async (name, args, schoolId) => {
  const sid = parseInt(schoolId)

  try {
    switch (name) {

      // ── Notifications ──────────────────────────────────────────────────────

      case 'list_notifications': {
        const where = { schoolId: sid }
        if (args.type)    where.type    = args.type
        if (args.channel) where.channel = args.channel
        const limit = args.limit || 20
        const notifications = await prisma.notification.findMany({
          where, take: limit, orderBy: { createdAt: 'desc' },
        })
        if (!notifications.length) return { message: 'No notifications sent yet.' }
        return {
          count: notifications.length,
          notifications: notifications.map(n => ({
            id: n.id, type: n.type, channel: n.channel, subject: n.subject,
            audience: n.audience, status: n.status,
            totalSent: n.totalSent, totalFailed: n.totalFailed,
            sentBy: n.sentBy, date: new Date(n.createdAt).toLocaleDateString('en-IN'),
          })),
        }
      }

      case 'send_notification': {
        const record = await prisma.notification.create({
          data: {
            schoolId: sid,
            type:     args.type,
            channel:  args.channel,
            subject:  args.subject,
            message:  args.message,
            audience: args.audience,
            sentBy:   args.sentBy || 'AI Assistant',
            status:   'sent',
            totalSent: 0,
          },
        })
        logInfo(`[AI] Notification created: id=${record.id} subject="${args.subject}"`, { filename: 'chatToolsExtended5.js' })
        return {
          success: true,
          message: `✅ Notification **"${args.subject}"** logged. Channel: ${args.channel}, Audience: ${args.audience}.`,
          id: record.id,
        }
      }

      case 'delete_notification': {
        const existing = await prisma.notification.findFirst({ where: { id: args.id, schoolId: sid } })
        if (!existing) return { error: `Notification #${args.id} not found.` }
        await prisma.notification.delete({ where: { id: args.id } })
        return { success: true, message: `✅ Notification **"${existing.subject}"** deleted.` }
      }

      // ── Accounting — Ledgers ───────────────────────────────────────────────

      case 'list_ledgers': {
        const where = { schoolId: sid }
        if (args.type) where.type = args.type
        const ledgers = await prisma.ledger.findMany({ where, orderBy: { name: 'asc' } })
        if (!ledgers.length) return { message: 'No ledgers found.' }
        return {
          count: ledgers.length,
          ledgers: ledgers.map(l => ({
            id: l.id, name: l.name, type: l.type, group: l.group || '—',
            openingBalance: `₹${(l.openingBalance || 0).toLocaleString('en-IN')}`,
            isSystem: l.isSystem, description: l.description || '',
          })),
        }
      }

      case 'create_ledger': {
        const existing = await prisma.ledger.findFirst({ where: { schoolId: sid, name: args.name } })
        if (existing) return { error: `Ledger "${args.name}" already exists.` }
        const ledger = await prisma.ledger.create({
          data: {
            schoolId:       sid,
            name:           args.name,
            type:           args.type,
            group:          args.group   || null,
            openingBalance: args.openingBalance || 0,
            description:    args.description   || null,
          },
        })
        logInfo(`[AI] Ledger created: id=${ledger.id} name="${args.name}"`, { filename: 'chatToolsExtended5.js' })
        return { success: true, message: `✅ Ledger **"${args.name}"** (${args.type}) created successfully.`, id: ledger.id }
      }

      case 'get_ledger_balances': {
        const where = { schoolId: sid }
        if (args.type) where.type = args.type
        const ledgers = await prisma.ledger.findMany({
          where,
          include: {
            voucherEntries: {
              where: { voucher: { status: 'posted' } },
              select: { type: true, amount: true },
            },
          },
          orderBy: { name: 'asc' },
        })
        if (!ledgers.length) return { message: 'No ledgers found.' }
        const result = ledgers.map(l => {
          const debit  = l.voucherEntries.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0)
          const credit = l.voucherEntries.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0)
          const balance = l.openingBalance + (l.type === 'asset' || l.type === 'expense' ? debit - credit : credit - debit)
          return {
            id: l.id, name: l.name, type: l.type,
            debit: `₹${debit.toLocaleString('en-IN')}`,
            credit: `₹${credit.toLocaleString('en-IN')}`,
            balance: `₹${balance.toLocaleString('en-IN')}`,
          }
        })
        return { count: result.length, ledgers: result }
      }

      // ── Accounting — Vouchers ──────────────────────────────────────────────

      case 'list_vouchers': {
        const where = { schoolId: sid }
        if (args.voucherType) where.voucherType = args.voucherType
        if (args.fromDate || args.toDate) {
          where.date = {}
          if (args.fromDate) where.date.gte = new Date(args.fromDate)
          if (args.toDate)   where.date.lte = new Date(args.toDate + 'T23:59:59')
        }
        const limit = args.limit || 20
        const vouchers = await prisma.voucher.findMany({
          where, take: limit, orderBy: { date: 'desc' },
          include: { entries: { include: { ledger: { select: { name: true } } } } },
        })
        if (!vouchers.length) return { message: 'No vouchers found.' }
        return {
          count: vouchers.length,
          vouchers: vouchers.map(v => ({
            id: v.id, voucherNo: v.voucherNo, type: v.voucherType,
            date: new Date(v.date).toLocaleDateString('en-IN'),
            narration: v.narration || '—',
            totalAmount: `₹${(v.totalAmount || 0).toLocaleString('en-IN')}`,
            status: v.status,
            entries: v.entries.map(e => `${e.type.toUpperCase()} ${e.ledger.name} ₹${e.amount.toLocaleString('en-IN')}`).join(', '),
          })),
        }
      }

      case 'create_voucher': {
        if (!args.entries?.length) return { error: 'At least one entry (debit/credit) is required.' }
        const totalDebit  = args.entries.filter(e => e.type === 'debit').reduce((s, e) => s + (e.amount || 0), 0)
        const totalCredit = args.entries.filter(e => e.type === 'credit').reduce((s, e) => s + (e.amount || 0), 0)
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          return { error: `Voucher is unbalanced: Debit ₹${totalDebit} ≠ Credit ₹${totalCredit}. Both sides must be equal.` }
        }
        const count = await prisma.voucher.count({ where: { schoolId: sid } })
        const voucherNo = `${args.voucherType.toUpperCase().slice(0, 3)}-${String(count + 1).padStart(4, '0')}`
        const voucher = await prisma.voucher.create({
          data: {
            schoolId:    sid,
            voucherType: args.voucherType,
            voucherNo,
            date:        new Date(args.date),
            narration:   args.narration || null,
            totalAmount: totalDebit,
            status:      'posted',
            createdBy:   'AI Assistant',
            entries: {
              create: args.entries.map(e => ({
                ledgerId: parseInt(e.ledgerId),
                type:     e.type,
                amount:   parseFloat(e.amount),
              })),
            },
          },
        })
        logInfo(`[AI] Voucher created: ${voucherNo} amount=₹${totalDebit}`, { filename: 'chatToolsExtended5.js' })
        return {
          success: true,
          message: `✅ **${args.voucherType} voucher** **${voucherNo}** created for ₹${totalDebit.toLocaleString('en-IN')}.`,
          voucherNo,
          id: voucher.id,
        }
      }

      // ── Hostel CRUD ────────────────────────────────────────────────────────

      case 'create_hostel': {
        const hostel = await prisma.hostel.create({
          data: {
            schoolId:      sid,
            name:          args.name,
            type:          args.type          || 'boys',
            totalCapacity: args.totalCapacity || 0,
            numberOfRooms: args.numberOfRooms || 0,
            wardenName:    args.wardenName    || null,
            wardenPhone:   args.wardenPhone   || null,
            wardenEmail:   args.wardenEmail   || null,
            address:       args.address       || null,
            description:   args.description   || null,
          },
        })
        logInfo(`[AI] Hostel created: id=${hostel.id} name="${args.name}"`, { filename: 'chatToolsExtended5.js' })
        return { success: true, message: `✅ Hostel **"${args.name}"** created (${args.type || 'boys'}).`, id: hostel.id }
      }

      case 'update_hostel': {
        const existing = await prisma.hostel.findFirst({ where: { id: args.id, schoolId: sid } })
        if (!existing) return { error: `Hostel #${args.id} not found.` }
        const { id, ...updates } = args
        const hostel = await prisma.hostel.update({ where: { id: args.id }, data: updates })
        return { success: true, message: `✅ Hostel **"${hostel.name}"** updated.` }
      }

      case 'delete_hostel': {
        const existing = await prisma.hostel.findFirst({ where: { id: args.id, schoolId: sid } })
        if (!existing) return { error: `Hostel #${args.id} not found.` }
        await prisma.hostel.delete({ where: { id: args.id } })
        return { success: true, message: `✅ Hostel **"${existing.name}"** deleted.` }
      }

      case 'create_hostel_room': {
        const hostel = await prisma.hostel.findFirst({ where: { id: args.hostelId, schoolId: sid } })
        if (!hostel) return { error: `Hostel #${args.hostelId} not found.` }
        const room = await prisma.hostelRoom.create({
          data: {
            schoolId:   sid,
            hostelId:   args.hostelId,
            roomNumber: args.roomNumber,
            floor:      args.floor    || null,
            type:       args.type     || 'double',
            capacity:   args.capacity || 2,
            amenities:  args.amenities || null,
          },
        })
        return { success: true, message: `✅ Room **${args.roomNumber}** added to **${hostel.name}**.`, id: room.id }
      }

      case 'add_hostel_allotment': {
        const allotment = await prisma.hostelAllotment.create({
          data: {
            schoolId:        sid,
            hostelId:        args.hostelId,
            roomId:          args.roomId,
            studentId:       args.studentId    || null,
            studentName:     args.studentName,
            admissionNumber: args.admissionNumber || null,
            allotmentDate:   args.allotmentDate ? new Date(args.allotmentDate) : new Date(),
            roomFee:         args.roomFee         || null,
            messFee:         args.messFee         || null,
            emergencyContact:args.emergencyContact || null,
            remarks:         args.remarks          || null,
          },
        })
        logInfo(`[AI] Hostel allotment created: id=${allotment.id} student="${args.studentName}"`, { filename: 'chatToolsExtended5.js' })
        return { success: true, message: `✅ **${args.studentName}** allotted to hostel room successfully.`, id: allotment.id }
      }

      case 'update_hostel_allotment': {
        const existing = await prisma.hostelAllotment.findFirst({ where: { id: args.id, schoolId: sid } })
        if (!existing) return { error: `Allotment #${args.id} not found.` }
        const { id, ...updates } = args
        if (updates.vacatingDate) updates.vacatingDate = new Date(updates.vacatingDate)
        await prisma.hostelAllotment.update({ where: { id: args.id }, data: updates })
        return { success: true, message: `✅ Allotment for **${existing.studentName}** updated.` }
      }

      // ── Timetable CRUD ─────────────────────────────────────────────────────

      case 'create_timetable_entry': {
        const cls = await prisma.class.findFirst({ where: { id: args.classId, schoolId: sid } })
        if (!cls) return { error: `Class #${args.classId} not found.` }
        const entry = await prisma.timetable.create({
          data: {
            classId:       args.classId,
            day:           args.day,
            periodId:      args.periodId      || 0,
            subject:       args.subject,
            teacher:       args.teacher,
            effectiveFrom: args.effectiveFrom ? new Date(args.effectiveFrom) : new Date(),
          },
        })
        logInfo(`[AI] Timetable entry created: class=${cls.name} day=${args.day} subject=${args.subject}`, { filename: 'chatToolsExtended5.js' })
        return { success: true, message: `✅ Timetable entry added: **${args.subject}** by ${args.teacher} on **${args.day}** for **${cls.name}**.`, id: entry.id }
      }

      case 'update_timetable_entry': {
        const existing = await prisma.timetable.findUnique({ where: { id: args.id } })
        if (!existing) return { error: `Timetable entry #${args.id} not found.` }
        const { id, effectiveFrom, ...rest } = args
        const updates = { ...rest }
        if (effectiveFrom) updates.effectiveFrom = new Date(effectiveFrom)
        await prisma.timetable.update({ where: { id: args.id }, data: updates })
        return { success: true, message: `✅ Timetable entry #${args.id} updated.` }
      }

      case 'delete_timetable_entry': {
        const existing = await prisma.timetable.findUnique({ where: { id: args.id } })
        if (!existing) return { error: `Timetable entry #${args.id} not found.` }
        await prisma.timetable.delete({ where: { id: args.id } })
        return { success: true, message: `✅ Timetable entry (**${existing.subject}** on ${existing.day}) deleted.` }
      }

      // ── Library — delete book ──────────────────────────────────────────────

      case 'delete_book': {
        const book = await prisma.book.findFirst({ where: { id: args.id, schoolId: sid } })
        if (!book) return { error: `Book #${args.id} not found.` }
        const activeIssues = await prisma.bookIssue.count({ where: { bookId: args.id, returnDate: null } })
        if (activeIssues > 0) return { error: `Cannot delete — "${book.title}" has ${activeIssues} copy/copies currently issued. Return them first.` }
        await prisma.book.delete({ where: { id: args.id } })
        logInfo(`[AI] Book deleted: id=${args.id} title="${book.title}"`, { filename: 'chatToolsExtended5.js' })
        return { success: true, message: `✅ **"${book.title}"** removed from the library catalogue.` }
      }

      // ── Classes — update / delete ──────────────────────────────────────────

      case 'update_class': {
        const cls = await prisma.class.findFirst({ where: { id: args.id, schoolId: sid } })
        if (!cls) return { error: `Class #${args.id} not found.` }
        const updated = await prisma.class.update({ where: { id: args.id }, data: { name: args.name } })
        return { success: true, message: `✅ Class renamed to **"${updated.name}"**.` }
      }

      case 'delete_class': {
        const cls = await prisma.class.findFirst({ where: { id: args.id, schoolId: sid } })
        if (!cls) return { error: `Class #${args.id} not found.` }
        const studentCount = await prisma.student.count({ where: { classId: args.id } })
        if (studentCount > 0) return { error: `Cannot delete — **${cls.name}** has ${studentCount} student(s) assigned. Move or remove students first.` }
        await prisma.class.delete({ where: { id: args.id } })
        return { success: true, message: `✅ Class **"${cls.name}"** deleted.` }
      }

      // ── Transfer Certificate ───────────────────────────────────────────────

      case 'get_transfer_certificate': {
        const student = await prisma.student.findFirst({
          where: { id: args.studentId, schoolId: sid },
          include: {
            class:   { select: { name: true } },
            section: { select: { name: true } },
            school:  { select: { name: true, address: true, phone: true, email: true } },
          },
        })
        if (!student) return { error: `Student #${args.studentId} not found.` }

        const attendance = await prisma.attendance.findMany({ where: { studentId: args.studentId } })
        const present = attendance.filter(a => a.status === 'present').length
        const total   = attendance.length
        const attPct  = total > 0 ? Math.round((present / total) * 100) : 0

        const marks = await prisma.marks.findMany({
          where: { studentId: args.studentId },
          include: { exam: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })

        return {
          transferCertificate: {
            school: student.school,
            student: {
              id: student.id,
              name: `${student.firstName} ${student.lastName}`,
              admissionNumber: student.admissionNumber || 'N/A',
              rollNumber: student.rollNumber || 'N/A',
              gender: student.gender,
              dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-IN') : 'N/A',
              class: student.class?.name,
              section: student.section?.name,
              fatherName: student.fatherName || 'N/A',
              motherName: student.motherName || 'N/A',
              bloodGroup: student.bloodGroup || 'N/A',
              address: student.address || 'N/A',
              aadhaarNumber: student.aadhaarNumber || 'N/A',
              category: student.category || 'N/A',
            },
            attendance: { total, present, absent: total - present, percentage: `${attPct}%` },
            recentMarks: marks.map(m => ({ exam: m.exam?.name, subject: m.subject, marks: m.marksObtained, outOf: m.totalMarks })),
          },
        }
      }

      default:
        return { error: `Unknown tool: ${name}` }
    }
  } catch (err) {
    logError(`executeExtendedTool5 [${name}] error: ${err.message}`, { filename: 'chatToolsExtended5.js' })
    return { error: err.message }
  }
}
