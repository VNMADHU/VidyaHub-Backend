/**
 * WhatsApp Routes
 *
 * GET  /whatsapp/status       — current state: disconnected | connecting | qr | ready
 * POST /whatsapp/connect      — open browser window for QR scan
 * POST /whatsapp/disconnect   — destroy session, close browser
 * GET  /whatsapp/recipients   — resolve phone numbers for audience (preview)
 * POST /whatsapp/send         — send messages, browser closes when done
 */

import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { getStatus, initialize, sendMessages, disconnectWA, autoConnectIfSession } from '../services/whatsappService.js'
import { logError } from '../utils/logHelpers.js'

const router = Router()
const prisma = new PrismaClient()
const LOG = { filename: 'whatsappRoutes.js' }

// ── Resolve audience → [{ name, phone }] ──────────────────
const resolveContacts = async (audience, schoolId) => {
  const contacts = []

  if (audience === 'all-parents') {
    const students = await prisma.student.findMany({
      where: { schoolId },
      select: { fatherContact: true, motherContact: true, firstName: true, lastName: true },
    })
    for (const s of students) {
      if (s.fatherContact) contacts.push({ name: `${s.firstName} ${s.lastName} (Father)`, phone: s.fatherContact })
      if (s.motherContact) contacts.push({ name: `${s.firstName} ${s.lastName} (Mother)`, phone: s.motherContact })
    }
  } else if (audience === 'all-teachers') {
    const teachers = await prisma.teacher.findMany({
      where: { schoolId },
      select: { firstName: true, lastName: true, phone: true },
    })
    for (const t of teachers) {
      if (t.phone) contacts.push({ name: `${t.firstName} ${t.lastName}`, phone: t.phone })
    }
  } else if (audience.startsWith('class:')) {
    const classId = parseInt(audience.split(':')[1], 10)
    const students = await prisma.student.findMany({
      where: { schoolId, classId },
      select: { fatherContact: true, motherContact: true, firstName: true, lastName: true },
    })
    for (const s of students) {
      if (s.fatherContact) contacts.push({ name: `${s.firstName} ${s.lastName} (Father)`, phone: s.fatherContact })
      if (s.motherContact) contacts.push({ name: `${s.firstName} ${s.lastName} (Mother)`, phone: s.motherContact })
    }
  }

  return contacts
}

// GET /whatsapp/status
router.get('/status', (req, res) => {
  autoConnectIfSession()   // silently reconnect if session on disk and not yet connected
  res.json(getStatus())
})

// POST /whatsapp/connect
router.post('/connect', async (req, res) => {
  try {
    await initialize()
    res.json({ message: 'WhatsApp browser opening...', status: getStatus().status })
  } catch (err) {
    logError('[WhatsApp] connect error', err, LOG)
    res.status(500).json({ message: err.message })
  }
})

// POST /whatsapp/disconnect
router.post('/disconnect', async (req, res) => {
  try {
    await disconnectWA()
    res.json({ message: 'WhatsApp disconnected' })
  } catch (err) {
    logError('[WhatsApp] disconnect error', err, LOG)
    res.status(500).json({ message: err.message })
  }
})

// GET /whatsapp/recipients?audience=all-parents|all-teachers|class:ID
router.get('/recipients', async (req, res) => {
  try {
    const schoolId = parseInt(req.headers['x-school-id'], 10)
    if (!schoolId) return res.status(400).json({ message: 'Missing X-School-Id' })
    const { audience } = req.query
    if (!audience) return res.status(400).json({ message: 'Missing audience' })
    const contacts = await resolveContacts(audience, schoolId)
    res.json({ contacts, count: contacts.length })
  } catch (err) {
    logError('[WhatsApp] recipients error', err, LOG)
    res.status(500).json({ message: err.message })
  }
})

// POST /whatsapp/send
router.post('/send', async (req, res) => {
  try {
    const schoolId = parseInt(req.headers['x-school-id'], 10)
    const { audience, customNumbers, message, attachments, attachmentB64, attachmentMime, attachmentName } = req.body

    // Normalise: accept either new attachments[] array or old single-field format
    const resolvedAttachments = Array.isArray(attachments) && attachments.length > 0
      ? attachments
      : (attachmentB64 && attachmentMime ? [{ b64: attachmentB64, mime: attachmentMime, name: attachmentName || 'attachment' }] : [])

    if (!message && resolvedAttachments.length === 0) return res.status(400).json({ message: 'message or attachment is required' })

    // Resolve numbers
    let numbers = []
    if (audience === 'custom') {
      // frontend sends customNumbers as an array already
      numbers = Array.isArray(customNumbers)
        ? customNumbers.map((n) => n.toString().trim()).filter(Boolean)
        : (customNumbers || '').split('\n').map((n) => n.trim()).filter(Boolean)
    } else {
      const aud = audience === 'class' ? `class:${req.body.classId}` : audience
      const contacts = await resolveContacts(aud, schoolId)
      numbers = contacts.map((c) => c.phone)
    }

    if (numbers.length === 0) return res.status(400).json({ message: 'No recipients found' })

    const result = await sendMessages({ numbers, message, attachments: resolvedAttachments })
    res.json({
      message: `WhatsApp messages sent: ${result.success} delivered, ${result.failed} failed`,
      ...result,
    })
  } catch (err) {
    logError('[WhatsApp] send error', err, LOG)
    res.status(500).json({ message: err.message })
  }
})

export default router
