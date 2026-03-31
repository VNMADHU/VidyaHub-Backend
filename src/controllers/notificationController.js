import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { sendSMS, sendBulkSMS } from '../services/smsService.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const prisma = new PrismaClient()
const LOG = { filename: 'notificationController.js' }

// ── Zod schemas ───────────────────────────────────────────
const sendNotificationSchema = z.object({
  type: z.enum(['announcement', 'event', 'report', 'fee-reminder', 'homework', 'custom']),
  channel: z.enum(['sms']),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
  audience: z.string().min(1, 'Audience is required'), // all-parents, class:5, student:12, custom
  customRecipients: z
    .array(z.object({ phone: z.string().optional(), name: z.string().optional() }))
    .optional(),
})


// ── Helper: gather recipients based on audience ───────────
const gatherRecipients = async (audience, schoolId) => {
  const recipients = [] // { email, phone, name }

  if (audience === 'all-parents') {
    const students = await prisma.student.findMany({
      where: { schoolId },
      select: { firstName: true, lastName: true, parentEmail: true, fatherContact: true, motherContact: true, fatherName: true, motherName: true },
    })
    for (const s of students) {
      const name = s.fatherName || s.motherName || `${s.firstName} ${s.lastName}'s Parent`
      if (s.parentEmail) {
        recipients.push({ email: s.parentEmail, phone: s.fatherContact || s.motherContact || '', name })
      } else if (s.fatherContact || s.motherContact) {
        recipients.push({ email: '', phone: s.fatherContact || s.motherContact, name })
      }
    }
  } else if (audience.startsWith('class:')) {
    const classId = parseInt(audience.split(':')[1], 10)
    const students = await prisma.student.findMany({
      where: { schoolId, classId },
      select: { firstName: true, lastName: true, parentEmail: true, fatherContact: true, motherContact: true, fatherName: true, motherName: true },
    })
    for (const s of students) {
      const name = s.fatherName || s.motherName || `${s.firstName} ${s.lastName}'s Parent`
      if (s.parentEmail || s.fatherContact || s.motherContact) {
        recipients.push({ email: s.parentEmail || '', phone: s.fatherContact || s.motherContact || '', name })
      }
    }
  } else if (audience.startsWith('student:')) {
    const studentId = parseInt(audience.split(':')[1], 10)
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true, parentEmail: true, fatherContact: true, motherContact: true, fatherName: true, motherName: true },
    })
    if (student) {
      const name = student.fatherName || student.motherName || `${student.firstName} ${student.lastName}'s Parent`
      recipients.push({ email: student.parentEmail || '', phone: student.fatherContact || student.motherContact || '', name })
    }
  }

  return recipients
}

// ── POST /notifications/send ──────────────────────────────
export const sendNotification = async (req, res, next) => {
  try {
    const schoolId = parseInt(req.headers['x-school-id'], 10)
    if (!schoolId || isNaN(schoolId)) {
      return res.status(400).json({ message: 'Missing X-School-Id header' })
    }

    const parsed = sendNotificationSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', issues: parsed.error.issues })
    }

    const { type, channel, subject, message, audience, customRecipients } = parsed.data

    // Get school name for email template
    const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { name: true } })

    // Gather recipients
    let recipients =
      audience === 'custom' && customRecipients
        ? customRecipients
        : await gatherRecipients(audience, schoolId)

    if (recipients.length === 0) {
      return res.status(400).json({ message: 'No recipients found for the selected audience. Make sure students have parent phone numbers saved.' })
    }

    let totalSent = 0
    let totalFailed = 0
    let allErrors = []

    // Send SMS
    if (channel === 'sms') {
      const smsRecipients = recipients.filter((r) => r.phone)
      if (smsRecipients.length > 0) {
        const smsText = `${subject}\n\n${message}\n\n- ${school?.name || 'Vidya Hub'}`
        const result = await sendBulkSMS({ recipients: smsRecipients, message: smsText })
        totalSent += result.sent
        totalFailed += result.failed
        allErrors = allErrors.concat(result.errors)
      }
    }

    // Non-blocking: track SMS usage in SchoolConfig
    if (totalSent > 0) {
      prisma.schoolConfig.upsert({
        where: { schoolId },
        update: { totalSmsUsed: { increment: totalSent } },
        create: { schoolId, totalSmsUsed: totalSent },
      }).catch(() => {})
    }

    // Determine overall status
    const status = totalFailed === 0 ? 'sent' : totalSent === 0 ? 'failed' : 'partial'

    // Log notification
    const notification = await prisma.notification.create({
      data: {
        schoolId,
        type,
        channel,
        subject,
        message,
        audience,
        sentBy: req.user?.email || 'system',
        totalSent,
        totalFailed,
        status,
        errors: allErrors.length > 0 ? JSON.stringify(allErrors) : null,
      },
    })

    logInfo(`Notification #${notification.id} sent: ${totalSent} ok, ${totalFailed} failed`, {
      ...LOG,
      schoolId,
    })

    res.status(200).json({
      message: `Notification sent! ${totalSent} delivered, ${totalFailed} failed.`,
      notification,
    })
  } catch (err) {
    logError(`sendNotification error: ${err.message}`, { ...LOG, stack: err.stack })
    next(err)
  }
}

// ── GET /notifications ────────────────────────────────────
export const listNotifications = async (req, res, next) => {
  try {
    const schoolId = parseInt(req.headers['x-school-id'], 10)
    if (!schoolId || isNaN(schoolId)) {
      return res.status(400).json({ message: 'Missing X-School-Id header' })
    }

    const notifications = await prisma.notification.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    res.json(notifications)
  } catch (err) {
    logError(`listNotifications error: ${err.message}`, { ...LOG, stack: err.stack })
    next(err)
  }
}

// ── DELETE /notifications/:id ─────────────────────────────
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.notification.delete({ where: { id: parseInt(id, 10) } })
    res.json({ message: 'Notification log deleted' })
  } catch (err) {
    logError(`deleteNotification error: ${err.message}`, { ...LOG, stack: err.stack })
    next(err)
  }
}

// ── GET /notifications/recipients-count ───────────────────
// Preview how many recipients match an audience filter
export const getRecipientsCount = async (req, res, next) => {
  try {
    const schoolId = parseInt(req.headers['x-school-id'], 10)
    const { audience } = req.query

    if (!audience) return res.json({ count: 0, emailCount: 0, phoneCount: 0 })

    const recipients = await gatherRecipients(audience, schoolId)
    const emailCount = recipients.filter((r) => r.email).length
    const phoneCount = recipients.filter((r) => r.phone).length

    res.json({ count: recipients.length, emailCount, phoneCount })
  } catch (err) {
    next(err)
  }
}
