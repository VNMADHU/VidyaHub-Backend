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

    // Only super-admin can approve or reject an admission
    if ((parsed.status === 'approved' || parsed.status === 'rejected') && req.user?.role !== 'super-admin') {
      return res.status(403).json({ message: 'Only Super Admin can approve or reject admission applications.' })
    }

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

    // ── Auto-create Student when approved ──────────────────────────────────
    if (parsed.status === 'approved' && existing.status !== 'approved' && !existing.linkedStudentId) {
      try {
        const nameParts   = existing.applicantName.trim().split(' ')
        const firstName   = nameParts[0] || existing.applicantName
        const lastName    = nameParts.slice(1).join(' ') || ''
        const admCount    = await prisma.student.count({ where: { schoolId } })
        const admNumber   = existing.applicationNo || `ADM-${schoolId}-${Date.now()}`
        const rollNumber  = String(admCount + 1).padStart(5, '0')
        const email       = `${firstName.toLowerCase()}.${rollNumber}@school.local`

        // Find matching class if applyingForClass matches a class name
        const matchedClass = await prisma.class.findFirst({
          where: { schoolId, name: { equals: existing.applyingForClass, mode: 'insensitive' } },
        })

        const student = await prisma.student.create({
          data: {
            schoolId,
            firstName,
            lastName,
            email,
            admissionNumber:  admNumber,
            rollNumber,
            gender:           existing.gender           || null,
            dateOfBirth:      existing.dateOfBirth      || null,
            category:         existing.category         || null,
            address:          existing.address          || null,
            previousSchool:   existing.previousSchool   || null,
            guardianName:     existing.guardianName     || null,
            guardianContact:  existing.guardianPhone    || null,
            parentEmail:      existing.guardianEmail    || null,
            classId:          matchedClass?.id          || null,
          },
        })

        // Link the new student back to the admission
        await prisma.admission.update({
          where: { id: parseInt(admissionId) },
          data: { linkedStudentId: student.id, status: 'enrolled' },
        })

        logInfo(`Auto-created Student #${student.id} from Admission #${admissionId}`, { schoolId })

        return res.json({
          data: { ...admission, status: 'enrolled', linkedStudentId: student.id },
          student,
          message: `Admission approved and student "${student.firstName} ${student.lastName}" added to the student portal (Admission No: ${admNumber}).`,
        })
      } catch (studentErr) {
        logError(`Auto-create student failed for admission #${admissionId}: ${studentErr.message}`, { schoolId })
        // Return the admission update success even if student creation failed
        return res.json({
          data: admission,
          message: 'Admission approved but student portal record could not be created automatically. Please add the student manually.',
        })
      }
    }

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
