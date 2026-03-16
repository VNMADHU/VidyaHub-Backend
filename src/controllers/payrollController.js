import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

export const listPayroll = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const { month, year } = req.query
    const where = { schoolId: parseInt(schoolId) }
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)
    logInfo('Listing payroll', { filename: 'payrollController.js', schoolId, month, year })
    const payroll = await prisma.payroll.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { employeeName: 'asc' }],
    })
    res.json({ data: payroll })
  } catch (error) {
    logError(`List payroll error: ${error.message}`, { filename: 'payrollController.js' })
    next(error)
  }
}

export const generatePayroll = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const { month, year } = req.body
    if (!month || !year) return res.status(400).json({ message: 'month and year are required' })

    logInfo('Generating payroll', { filename: 'payrollController.js', schoolId, month, year })

    // Fetch all employees with salary set
    const [teachers, staff, drivers] = await Promise.all([
      prisma.teacher.findMany({ where: { schoolId: parseInt(schoolId), salary: { not: null, gt: 0 } } }),
      prisma.staff.findMany({ where: { schoolId: parseInt(schoolId), salary: { not: null, gt: 0 } } }),
      prisma.driver.findMany({ where: { schoolId: parseInt(schoolId), salary: { not: null, gt: 0 } } }),
    ])

    const buildEntry = (emp, type) => {
      const basic = emp.salary || 0

      // ── EARNINGS ──────────────────────────────────────────────
      const hra              = Math.round(basic * 0.40) // 40% of basic (non-metro HRA)
      const conveyance       = 1600                     // Rs.1,600/month standard
      const medicalAllowance = 1250                     // Rs.1,250/month standard
      const specialAllowance = 0                        // set manually if needed
      const allowances       = hra + conveyance + medicalAllowance + specialAllowance
      const grossSalary      = basic + allowances

      // ── EMPLOYEE DEDUCTIONS ────────────────────────────────────
      // Employee PF: 12% of basic
      const pfDeduction = Math.round(basic * 0.12)

      // Employee ESI: 0.75% of gross (only if gross <= Rs.21,000)
      const esiDeduction = grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0

      // Professional Tax (Karnataka/general slab)
      let professionalTax = 0
      if (grossSalary > 15000)      professionalTax = 200
      else if (grossSalary > 10000) professionalTax = 175
      else if (grossSalary > 7500)  professionalTax = 150

      // TDS u/s 192 — New Tax Regime FY 2025-26
      // Standard deduction: Rs.75,000 | Rebate u/s 87A: tax=0 if taxable<=12L
      const annualGross    = grossSalary * 12
      const annualTaxable  = Math.max(annualGross - 75000, 0)
      let annualTax = 0
      if      (annualTaxable > 2400000) annualTax = 300000 + (annualTaxable - 2400000) * 0.30
      else if (annualTaxable > 2000000) annualTax = 200000 + (annualTaxable - 2000000) * 0.25
      else if (annualTaxable > 1600000) annualTax = 120000 + (annualTaxable - 1600000) * 0.20
      else if (annualTaxable > 1200000) annualTax =  60000 + (annualTaxable - 1200000) * 0.15
      else if (annualTaxable >  800000) annualTax =  20000 + (annualTaxable -  800000) * 0.10
      else if (annualTaxable >  400000) annualTax =          (annualTaxable -  400000) * 0.05
      // Rebate u/s 87A: nil tax if taxable income <= Rs.12,00,000
      if (annualTaxable <= 1200000) annualTax = 0
      // Add 4% Health & Education Cess
      annualTax = Math.round(annualTax * 1.04)
      const tdsDeduction = Math.round(annualTax / 12)

      const totalDeductions = pfDeduction + esiDeduction + professionalTax + tdsDeduction
      const netSalary       = grossSalary - totalDeductions

      // ── EMPLOYER CONTRIBUTIONS (CTC components, not deducted from employee) ──
      const employerPf  = Math.round(basic * 0.12)
      const employerEsi = grossSalary <= 21000 ? Math.round(grossSalary * 0.0325) : 0
      const ctc         = grossSalary + employerPf + employerEsi

      return {
        schoolId: parseInt(schoolId),
        employeeType: type,
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        designation: emp.designation || emp.subject || null,
        month: parseInt(month),
        year: parseInt(year),
        basicSalary: basic,
        hra,
        conveyance,
        medicalAllowance,
        specialAllowance,
        allowances,
        grossSalary,
        pfDeduction,
        esiDeduction,
        professionalTax,
        tdsDeduction,
        otherDeductions: 0,
        totalDeductions,
        netSalary,
        employerPf,
        employerEsi,
        ctc,
        status: 'pending',
      }
    }

    const entries = [
      ...teachers.map(e => buildEntry(e, 'teacher')),
      ...staff.map(e => buildEntry(e, 'staff')),
      ...drivers.map(e => buildEntry(e, 'driver')),
    ]

    const results = await Promise.all(
      entries.map(entry =>
        prisma.payroll.upsert({
          where: {
            schoolId_employeeType_employeeId_month_year: {
              schoolId: entry.schoolId,
              employeeType: entry.employeeType,
              employeeId: entry.employeeId,
              month: entry.month,
              year: entry.year,
            },
          },
          update: {
            employeeName:    entry.employeeName,
            designation:     entry.designation,
            basicSalary:     entry.basicSalary,
            hra:             entry.hra,
            conveyance:      entry.conveyance,
            medicalAllowance: entry.medicalAllowance,
            specialAllowance: entry.specialAllowance,
            allowances:      entry.allowances,
            grossSalary:     entry.grossSalary,
            pfDeduction:     entry.pfDeduction,
            esiDeduction:    entry.esiDeduction,
            professionalTax: entry.professionalTax,
            tdsDeduction:    entry.tdsDeduction,
            totalDeductions: entry.totalDeductions,
            netSalary:       entry.netSalary,
            employerPf:      entry.employerPf,
            employerEsi:     entry.employerEsi,
            ctc:             entry.ctc,
          },
          create: entry,
        })
      )
    )

    res.json({ data: results, message: `Payroll generated for ${results.length} employees` })
  } catch (error) {
    logError(`Generate payroll error: ${error.message}`, { filename: 'payrollController.js' })
    next(error)
  }
}

export const updatePayroll = async (req, res, next) => {
  try {
    const { payrollId } = req.params
    const data = { ...req.body }
    if (data.paymentDate) data.paymentDate = new Date(data.paymentDate)
    logInfo('Updating payroll', { filename: 'payrollController.js', payrollId })
    const payroll = await prisma.payroll.update({
      where: { id: parseInt(payrollId) },
      data,
    })
    res.json({ data: payroll, message: 'Payroll updated' })
  } catch (error) {
    logError(`Update payroll error: ${error.message}`, { filename: 'payrollController.js' })
    next(error)
  }
}

export const deletePayroll = async (req, res, next) => {
  try {
    const { payrollId } = req.params
    logInfo('Deleting payroll', { filename: 'payrollController.js', payrollId })
    await prisma.payroll.delete({ where: { id: parseInt(payrollId) } })
    res.json({ message: 'Payroll record deleted' })
  } catch (error) {
    logError(`Delete payroll error: ${error.message}`, { filename: 'payrollController.js' })
    next(error)
  }
}
