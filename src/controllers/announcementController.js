import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'
import { sendSMS, fillTemplate } from '../services/smsService.js'


const announcementSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  targetAudience: z.string().optional().default('All'),
})

export const listAnnouncements = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    logInfo('Listing all announcements', {
      filename: 'announcementController.js',
      line: 16,
      schoolId,
    })
    const announcements = await prisma.announcement.findMany({
      where: { schoolId: parseInt(schoolId) },
    })
    res.json({ data: announcements, message: 'List of announcements' })
  } catch (error) {
    logError(`List announcements error: ${error.message}`, {
      filename: 'announcementController.js',
      line: 26,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const createAnnouncement = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const payload = announcementSchema.parse(req.body)
    
    const announcement = await prisma.announcement.create({
      data: {
        ...payload,
        schoolId: parseInt(schoolId),
      },
    })
    
    logInfo(`Announcement created: ${payload.title}`, {
      filename: 'announcementController.js',
      line: 48,
      schoolId,
    })

    // Send SMS to all parents + staff + teachers on announcement (fire-and-forget)
    setImmediate(async () => {
      try {
        const school = await prisma.school.findUnique({ where: { id: parseInt(schoolId) }, select: { name: true, smsEnabled: true, smsOnAnnouncement: true } })
        if (school?.smsEnabled && school?.smsOnAnnouncement) {
          const [students, teachers, staff] = await Promise.all([
            prisma.student.findMany({ where: { schoolId: parseInt(schoolId) }, select: { fatherContact: true, motherContact: true, guardianContact: true } }),
            prisma.teacher.findMany({ where: { schoolId: parseInt(schoolId) }, select: { phoneNumber: true } }),
            prisma.staff.findMany({ where: { schoolId: parseInt(schoolId) }, select: { phoneNumber: true } }),
          ])
          const phonesSet = new Set()
          for (const s of students) {
            if (s.fatherContact) phonesSet.add(s.fatherContact.trim())
            if (s.motherContact) phonesSet.add(s.motherContact.trim())
            if (s.guardianContact) phonesSet.add(s.guardianContact.trim())
          }
          for (const t of teachers) { if (t.phoneNumber) phonesSet.add(t.phoneNumber.trim()) }
          for (const st of staff) { if (st.phoneNumber) phonesSet.add(st.phoneNumber.trim()) }
          const allPhones = [...phonesSet].filter(Boolean)
          if (allPhones.length > 0) {
            // Keep exact DLT template format — text is read from SAPTELE_ANNOUNCEMENT_TEMPLATE
            const tpl = process.env.SAPTELE_ANNOUNCEMENT_TEMPLATE || '{schoolName} Announcement: {title} - {message}'
            const msg = fillTemplate(tpl, { schoolName: school.name, title: payload.title, message: payload.message })
            for (const phone of allPhones) {
              await sendSMS({ to: phone, message: msg, templateId: process.env.SAPTELE_ANNOUNCEMENT_TEMPLATE_ID }).catch(() => {})
            }
          }
        }
      } catch (e) { /* SMS failure must not break the main response */ }
    })

    res.status(201).json({ message: 'Announcement created', data: announcement })
  } catch (error) {
    logError(`Create announcement error: ${error.message}`, {
      filename: 'announcementController.js',
      line: 55,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const updateAnnouncement = async (req, res, next) => {
  try {
    const { announcementId } = req.params
    const schoolId = req.schoolId
    const payload = announcementSchema.partial().parse(req.body)
    
    const announcement = await prisma.announcement.update({
      where: { id: parseInt(announcementId) },
      data: payload,
    })
    
    logInfo(`Announcement updated: ${announcementId}`, {
      filename: 'announcementController.js',
      line: 72,
      schoolId,
    })
    res.json({ message: 'Announcement updated', data: announcement })
  } catch (error) {
    logError(`Update announcement error: ${error.message}`, {
      filename: 'announcementController.js',
      line: 79,
      schoolId: req.schoolId,
    })
    next(error)
  }
}

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { announcementId } = req.params
    const schoolId = req.schoolId
    
    await prisma.announcement.delete({
      where: { id: parseInt(announcementId) },
    })
    
    logInfo(`Announcement deleted: ${announcementId}`, {
      filename: 'announcementController.js',
      line: 95,
      schoolId,
    })
    res.json({ message: 'Announcement deleted successfully' })
  } catch (error) {
    logError(`Delete announcement error: ${error.message}`, {
      filename: 'announcementController.js',
      line: 102,
      schoolId: req.schoolId,
    })
    next(error)
  }
}
