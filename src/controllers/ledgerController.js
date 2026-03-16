import prisma from '../utils/prisma.js'

// Default chart of accounts for Indian schools
const DEFAULT_LEDGERS = [
  // ASSETS
  { name: 'Cash',                  type: 'asset',     group: 'Current Asset',      isSystem: true },
  { name: 'Bank Account',          type: 'asset',     group: 'Current Asset',      isSystem: true },
  { name: 'UPI / Online',          type: 'asset',     group: 'Current Asset',      isSystem: true },
  { name: 'Fixed Deposit',         type: 'asset',     group: 'Fixed Asset',        isSystem: true },
  // INCOME
  { name: 'Student Fee Income',    type: 'income',    group: 'Direct Income',      isSystem: true },
  { name: 'Transport Fee Income',  type: 'income',    group: 'Direct Income',      isSystem: true },
  { name: 'Library Fee Income',    type: 'income',    group: 'Direct Income',      isSystem: true },
  { name: 'Hostel Fee Income',     type: 'income',    group: 'Direct Income',      isSystem: true },
  { name: 'Exam Fee Income',       type: 'income',    group: 'Direct Income',      isSystem: true },
  { name: 'Donation Received',     type: 'income',    group: 'Indirect Income',    isSystem: true },
  { name: 'Grant Received',        type: 'income',    group: 'Indirect Income',    isSystem: true },
  { name: 'Interest Income',       type: 'income',    group: 'Indirect Income',    isSystem: true },
  { name: 'Other Income',          type: 'income',    group: 'Indirect Income',    isSystem: true },
  // EXPENSES
  { name: 'Salary Expense',        type: 'expense',   group: 'Direct Expense',     isSystem: true },
  { name: 'PF Contribution',       type: 'expense',   group: 'Direct Expense',     isSystem: true },
  { name: 'ESI Contribution',      type: 'expense',   group: 'Direct Expense',     isSystem: true },
  { name: 'Electricity Expense',   type: 'expense',   group: 'Indirect Expense',   isSystem: true },
  { name: 'Water Expense',         type: 'expense',   group: 'Indirect Expense',   isSystem: true },
  { name: 'Stationery Expense',    type: 'expense',   group: 'Indirect Expense',   isSystem: true },
  { name: 'Transport Expense',     type: 'expense',   group: 'Indirect Expense',   isSystem: true },
  { name: 'Maintenance Expense',   type: 'expense',   group: 'Indirect Expense',   isSystem: true },
  { name: 'Events & Functions',    type: 'expense',   group: 'Indirect Expense',   isSystem: true },
  { name: 'Printing Expense',      type: 'expense',   group: 'Indirect Expense',   isSystem: true },
  { name: 'Other Expense',         type: 'expense',   group: 'Indirect Expense',   isSystem: true },
  // LIABILITIES
  { name: 'TDS Payable',           type: 'liability', group: 'Current Liability',  isSystem: true },
  { name: 'GST Payable',           type: 'liability', group: 'Current Liability',  isSystem: true },
  { name: 'PF Payable',            type: 'liability', group: 'Current Liability',  isSystem: true },
  { name: 'ESI Payable',           type: 'liability', group: 'Current Liability',  isSystem: true },
  { name: 'Advance Fees Received', type: 'liability', group: 'Current Liability',  isSystem: true },
  { name: 'Salary Payable',        type: 'liability', group: 'Current Liability',  isSystem: true },
]

export const listLedgers = async (req, res) => {
  try {
    const schoolId = parseInt(req.schoolId)
    const ledgers = await prisma.ledger.findMany({
      where: { schoolId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })
    res.json({ data: ledgers })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const seedDefaultLedgers = async (req, res) => {
  try {
    const schoolId = parseInt(req.schoolId)
    const created = await prisma.ledger.createMany({
      data: DEFAULT_LEDGERS.map(l => ({ ...l, schoolId })),
      skipDuplicates: true,
    })
    const all = await prisma.ledger.findMany({ where: { schoolId } })
    res.json({ message: `${created.count} new ledgers added.`, data: all })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const createLedger = async (req, res) => {
  try {
    const { name, type, group, openingBalance, description } = req.body
    const schoolId = parseInt(req.schoolId)
    const ledger = await prisma.ledger.create({
      data: {
        schoolId,
        name,
        type,
        group: group || null,
        openingBalance: parseFloat(openingBalance) || 0,
        description: description || null,
        isSystem: false,
      },
    })
    res.json({ data: ledger })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const updateLedger = async (req, res) => {
  try {
    const { ledgerId } = req.params
    const { name, type, group, openingBalance, description } = req.body
    const ledger = await prisma.ledger.update({
      where: { id: parseInt(ledgerId), schoolId: parseInt(req.schoolId) },
      data: { name, type, group, openingBalance: parseFloat(openingBalance) || 0, description },
    })
    res.json({ data: ledger })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const deleteLedger = async (req, res) => {
  try {
    const { ledgerId } = req.params
    const ledger = await prisma.ledger.findFirst({ where: { id: parseInt(ledgerId), schoolId: parseInt(req.schoolId) } })
    if (!ledger) return res.status(404).json({ error: 'Ledger not found.' })
    if (ledger.isSystem) return res.status(400).json({ error: 'System ledgers cannot be deleted.' })
    await prisma.ledger.delete({ where: { id: parseInt(ledgerId) } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
