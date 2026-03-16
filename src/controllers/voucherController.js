import prisma from '../utils/prisma.js'

const PREFIXES = { receipt: 'RCP', payment: 'PMT', journal: 'JNL', contra: 'CTR' }

const genVoucherNo = async (schoolId, type) => {
  const prefix = PREFIXES[type] || 'VCH'
  const count = await prisma.voucher.count({ where: { schoolId: parseInt(schoolId), voucherType: type } })
  return `${prefix}-${String(count + 1).padStart(4, '0')}`
}

export const listVouchers = async (req, res) => {
  try {
    const { fromDate, toDate, type } = req.query
    const where = { schoolId: parseInt(req.schoolId) }
    if (type) where.voucherType = type
    if (fromDate || toDate) {
      where.date = {}
      if (fromDate) where.date.gte = new Date(fromDate)
      if (toDate) {
        const d = new Date(toDate)
        d.setHours(23, 59, 59, 999)
        where.date.lte = d
      }
    }
    const vouchers = await prisma.voucher.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        entries: {
          include: { ledger: { select: { id: true, name: true, type: true } } },
        },
      },
    })
    res.json({ data: vouchers })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const createVoucher = async (req, res) => {
  try {
    const { voucherType, date, narration, entries, refType, refId, createdBy } = req.body
    if (!entries || entries.length < 2) {
      return res.status(400).json({ error: 'At least 2 entry rows are required.' })
    }
    const totalDebit = entries.filter(e => e.type === 'debit').reduce((s, e) => s + Number(e.amount), 0)
    const totalCredit = entries.filter(e => e.type === 'credit').reduce((s, e) => s + Number(e.amount), 0)
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ error: `Debit (₹${totalDebit.toFixed(2)}) ≠ Credit (₹${totalCredit.toFixed(2)}). Voucher must balance.` })
    }
    const voucherNo = await genVoucherNo(req.schoolId, voucherType)
    const voucher = await prisma.voucher.create({
      data: {
        schoolId: parseInt(req.schoolId),
        voucherType,
        voucherNo,
        date: new Date(date),
        narration: narration || null,
        totalAmount: totalDebit,
        status: 'posted',
        refType: refType || null,
        refId: refId ? parseInt(refId) : null,
        createdBy: createdBy || null,
        entries: {
          create: entries.map(e => ({
            ledgerId: parseInt(e.ledgerId),
            type: e.type,
            amount: parseFloat(e.amount),
          })),
        },
      },
      include: {
        entries: { include: { ledger: true } },
      },
    })
    res.json({ data: voucher })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const updateVoucherStatus = async (req, res) => {
  try {
    const { voucherId } = req.params
    const { status } = req.body
    const voucher = await prisma.voucher.update({
      where: { id: parseInt(voucherId), schoolId: parseInt(req.schoolId) },
      data: { status },
    })
    res.json({ data: voucher })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const deleteVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params
    await prisma.voucher.delete({ where: { id: parseInt(voucherId), schoolId: parseInt(req.schoolId) } })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Aggregate debit/credit per ledger across all posted vouchers
export const getLedgerBalances = async (req, res) => {
  try {
    const entries = await prisma.voucherEntry.findMany({
      where: { voucher: { schoolId: parseInt(req.schoolId), status: 'posted' } },
      include: { ledger: true },
    })
    const map = {}
    entries.forEach(e => {
      if (!map[e.ledgerId]) {
        map[e.ledgerId] = { ledger: e.ledger, debit: 0, credit: 0 }
      }
      if (e.type === 'debit') map[e.ledgerId].debit += e.amount
      else map[e.ledgerId].credit += e.amount
    })
    res.json({ data: Object.values(map) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
