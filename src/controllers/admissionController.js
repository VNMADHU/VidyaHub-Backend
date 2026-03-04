import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

// ── Validation schema ──────────────────────────────────────────────────────────
const admissionSchema = z.object({
  applicantName:    z.string().min(1, 'Applicant name is required'),
  dateOfBirth:      z.string().optional().nullable(),
  gender:           z.string().optional().nullable(),
  applyingForClass: z.string().min(1, 'Class is required'),
  academicYear:     z.string().optional().default('2025-26'),
  guardianName:     z.string().min(1, 'Guardian name is required'),
  guardianPhone:    z.string().min(1, 'Guardian phone is required'),
  guardianEmail:    z.string().email().optional().nullable().or(z.literal('')),
  address:          z.string().optional().nullable(),
  previousSchool:   z.string().optional().nullable(),
  previousClass:    z.string().optional().nullable(),
  category:         z.string().optional().nullable(),
  status:           z.enum(['pending', 'shortlisted', 'approved', 'rejected', 'enrolled']).default('pending'),
  interviewDate:    z.string().optional().nullable(),
  remarks:          z.string().optional().nullable(),
})

// Generate application number: ADM-<YEAR>-<SEQUENTIAL>
async function generateApplicationNo(schoolId) {
  const year = new Date().getFullYear()
  const count = await prisma.admission.count({ where: { schoolId } })
  const seq = String(count + 1).padStart(3, '0')
  return `ADM-${year}-${seq}`
}

// ── List ───────────────────────────────────────────────────────────────────────
export const listAdmissions = async (req, res, next) => {
  try {
    const schoolId = parseInt(req.schoolId)
    const { status, applyingForClass, academicYear } = req.query

    logInfo('listAdmissions', { schoolId, status, applyingForClass, academicYear })

    const where = {
      schoolId,
      ...(status           ? { status }           : {}),
      ...(applyingForClass ? { applyingForClass }  : {}),
      ...(academicYear     ? { academicYear }      : {}),
    }

    const admissions = await prisma.admission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    res.json({ data: admissions })
  } catch (error) {
    logError('listAdmissions', error)
    next(error)
  }
}

// ── Create ─────────────────────────────────────────────────────────────────────
export const createAdmission = async (req, res, next) => {
  try {
    const schoolId = parseInt(req.schoolId)
    const parsed = admissionSchema.parse(req.body)

    logInfo('createAdmission', { schoolId, applicantName: parsed.applicantName })

    const applicationNo = await generateApplicationNo(schoolId)

    const admission = await prisma.admission.create({
      data: {
        schoolId,
        applicationNo,
        applicantName:    parsed.applicantName,
        dateOfBirth:      parsed.dateOfBirth   ? new Date(parsed.dateOfBirth)   : null,
        gender:           parsed.gender        || null,
        applyingForClass: parsed.applyingForClass,
        academicYear:     parsed.academicYear,
        guardianName:     parsed.guardianName,
        guardianPhone:    parsed.guardianPhone,
        guardianEmail:    parsed.guardianEmail || null,
        address:          parsed.address       || null,
        previousSchool:   parsed.previousSchool|| null,
        previousClass:    parsed.previousClass || null,
        category:         parsed.category      || null,
        status:           parsed.status,
        interviewDate:    parsed.interviewDate ? new Date(parsed.interviewDate) : null,
        remarks:          parsed.remarks       || null,
      },
    })

    res.status(201).json({ data: admission })
  } catch (error) {
    logError('createAdmission', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', issues: error.errors })
    }
    next(error)
  }
}

// ── Update ─────────────────────────────────────────────────────────────────────
export const updateAdmission = async (req, res, next) => {
  try {
    const schoolId = parseInt(req.schoolId)
    const { admissionId } = req.params
    const parsed = admissionSchema.partial().parse(req.body)

    logInfo('updateAdmission', { schoolId, admissionId })

    const existing = await prisma.admission.findFirst({
      where: { id: parseInt(admissionId), schoolId },
    })
    if (!existing) return res.status(404).json({ message: 'Admission not found' })

    const updateData = {
      ...(parsed.applicantName    !== undefined ? { applicantName:    parsed.applicantName }    : {}),
      ...(parsed.dateOfBirth      !== undefined ? { dateOfBirth:      parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : null } : {}),
      ...(parsed.gender           !== undefined ? { gender:           parsed.gender || null }   : {}),
      ...(parsed.applyingForClass !== undefined ? { applyingForClass: parsed.applyingForClass } : {}),
      ...(parsed.academicYear     !== undefined ? { academicYear:     parsed.academicYear }     : {}),
      ...(parsed.guardianName     !== undefined ? { guardianName:     parsed.guardianName }     : {}),
      ...(parsed.guardianPhone    !== undefined ? { guardianPhone:    parsed.guardianPhone }    : {}),
      ...(parsed.guardianEmail    !== undefined ? { guardianEmail:    parsed.guardianEmail || null } : {}),
      ...(parsed.address          !== undefined ? { address:          parsed.address || null }  : {}),
      ...(parsed.previousSchool   !== undefined ? { previousSchool:   parsed.previousSchool || null } : {}),
      ...(parsed.previousClass    !== undefined ? { previousClass:    parsed.previousClass || null }  : {}),
      ...(parsed.category         !== undefined ? { category:         parsed.category || null } : {}),
      ...(parsed.status           !== undefined ? { status:           parsed.status }           : {}),
      ...(parsed.interviewDate    !== undefined ? { interviewDate:    parsed.interviewDate ? new Date(parsed.interviewDate) : null } : {}),
      ...(parsed.remarks          !== undefined ? { remarks:          parsed.remarks || null }  : {}),
    }

    const admission = await prisma.admission.update({
      where: { id: parseInt(admissionId) },
      data: updateData,
    })

    res.json({ data: admission })
  } catch (error) {
    logError('updateAdmission', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation failed', issues: error.errors })
    }
    next(error)
  }
}

// ── Delete ─────────────────────────────────────────────────────────────────────
export const deleteAdmission = async (req, res, next) => {
  try {
    const schoolId = parseInt(req.schoolId)
    const { admissionId } = req.params

    logInfo('deleteAdmission', { schoolId, admissionId })

    const existing = await prisma.admission.findFirst({
      where: { id: parseInt(admissionId), schoolId },
    })
    if (!existing) return res.status(404).json({ message: 'Admission not found' })

    await prisma.admission.delete({ where: { id: parseInt(admissionId) } })

    res.json({ message: 'Admission deleted successfully' })
  } catch (error) {
    logError('deleteAdmission', error)
    next(error)
  }
}
