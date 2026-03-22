import prisma from '../utils/prisma.js'

// GET /staff-attendance?date=YYYY-MM-DD&employeeType=teacher
export const listStaffAttendance = async (req, res) => {
  try {
    const schoolId = req.user.schoolId
    const { date, employeeType, month, year } = req.query

    const where = { schoolId }
    if (employeeType) where.employeeType = employeeType

    if (date) {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      where.date = { gte: d, lt: next }
    } else if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1)
      const end   = new Date(parseInt(year), parseInt(month), 1)
      where.date  = { gte: start, lt: end }
    }

    const records = await prisma.staffAttendance.findMany({
      where,
      orderBy: [{ date: 'desc' }, { employeeType: 'asc' }, { employeeName: 'asc' }],
    })

    res.json(records)
  } catch (err) {
    console.error('listStaffAttendance error:', err)
    res.status(500).json({ message: 'Failed to fetch attendance' })
  }
}

// POST /staff-attendance/bulk  — mark all employees in one shot
export const bulkMarkAttendance = async (req, res) => {
  try {
    const schoolId = req.user.schoolId
    const markedBy = req.user.email
    const { date, records } = req.body

    // records: [{ employeeType, employeeId, employeeName, status, inTime, outTime, remarks }]
    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'date and records[] are required' })
    }

    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    const upserts = records.map((r) =>
      prisma.staffAttendance.upsert({
        where: {
          employeeType_employeeId_date: {
            employeeType: r.employeeType,
            employeeId:   r.employeeId,
            date:         dateObj,
          },
        },
        update: {
          status:       r.status,
          inTime:       r.inTime  || null,
          outTime:      r.outTime || null,
          remarks:      r.remarks || null,
          employeeName: r.employeeName,
          markedBy,
        },
        create: {
          schoolId,
          employeeType: r.employeeType,
          employeeId:   r.employeeId,
          employeeName: r.employeeName,
          date:         dateObj,
          status:       r.status,
          inTime:       r.inTime  || null,
          outTime:      r.outTime || null,
          remarks:      r.remarks || null,
          markedBy,
        },
      })
    )

    await prisma.$transaction(upserts)
    res.json({ message: `Attendance saved for ${records.length} employees` })
  } catch (err) {
    console.error('bulkMarkAttendance error:', err)
    res.status(500).json({ message: 'Failed to save attendance' })
  }
}

// PATCH /staff-attendance/:id  — update a single record
export const updateStaffAttendance = async (req, res) => {
  try {
    const schoolId = req.user.schoolId
    const { id } = req.params

    const existing = await prisma.staffAttendance.findUnique({ where: { id: parseInt(id) } })
    if (!existing) return res.status(404).json({ message: 'Record not found' })
    if (existing.schoolId !== schoolId) return res.status(403).json({ message: 'Access denied' })

    const { status, inTime, outTime, remarks } = req.body
    const updated = await prisma.staffAttendance.update({
      where: { id: parseInt(id) },
      data: {
        ...(status  !== undefined && { status }),
        ...(inTime  !== undefined && { inTime }),
        ...(outTime !== undefined && { outTime }),
        ...(remarks !== undefined && { remarks }),
      },
    })

    res.json(updated)
  } catch (err) {
    console.error('updateStaffAttendance error:', err)
    res.status(500).json({ message: 'Failed to update attendance' })
  }
}

// DELETE /staff-attendance/:id
export const deleteStaffAttendance = async (req, res) => {
  try {
    const schoolId = req.user.schoolId
    const { id } = req.params

    const existing = await prisma.staffAttendance.findUnique({ where: { id: parseInt(id) } })
    if (!existing) return res.status(404).json({ message: 'Record not found' })
    if (existing.schoolId !== schoolId) return res.status(403).json({ message: 'Access denied' })

    await prisma.staffAttendance.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Record deleted' })
  } catch (err) {
    console.error('deleteStaffAttendance error:', err)
    res.status(500).json({ message: 'Failed to delete record' })
  }
}

// GET /staff-attendance/monthly-summary?month=3&year=2026&employeeType=teacher
export const monthlySummary = async (req, res) => {
  try {
    const schoolId = req.user.schoolId
    const { month, year, employeeType } = req.query

    if (!month || !year) return res.status(400).json({ message: 'month and year are required' })

    const start = new Date(parseInt(year), parseInt(month) - 1, 1)
    const end   = new Date(parseInt(year), parseInt(month), 1)

    const where = { schoolId, date: { gte: start, lt: end } }
    if (employeeType) where.employeeType = employeeType

    const records = await prisma.staffAttendance.findMany({ where })

    // Group by employeeId
    const map = {}
    for (const r of records) {
      const key = `${r.employeeType}-${r.employeeId}`
      if (!map[key]) {
        map[key] = {
          employeeId:   r.employeeId,
          employeeType: r.employeeType,
          employeeName: r.employeeName,
          present: 0, absent: 0, late: 0, halfDay: 0, onLeave: 0, total: 0,
        }
      }
      map[key].total++
      if (r.status === 'present')   map[key].present++
      else if (r.status === 'absent')   map[key].absent++
      else if (r.status === 'late')     map[key].late++
      else if (r.status === 'half-day') map[key].halfDay++
      else if (r.status === 'on-leave') map[key].onLeave++
    }

    res.json(Object.values(map))
  } catch (err) {
    console.error('monthlySummary error:', err)
    res.status(500).json({ message: 'Failed to get monthly summary' })
  }
}
