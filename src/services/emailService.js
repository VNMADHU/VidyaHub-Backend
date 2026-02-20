import nodemailer from 'nodemailer'
import { logInfo, logError } from '../utils/logHelpers.js'

// ── AWS SES SMTP Transporter ──────────────────────────────
// Configure via .env — falls back to ethereal (test) if not set
let transporter = null

const createTransporter = () => {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (host && user && pass) {
    // Production: AWS SES
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465
      auth: { user, pass },
    })
    logInfo('Email transporter configured (AWS SES)', { filename: 'emailService.js', schoolId: 'system' })
  } else {
    // Development: log-only (no real sending)
    transporter = {
      sendMail: async (opts) => {
        logInfo(`[DEV EMAIL] To: ${opts.to} | Subject: ${opts.subject}`, {
          filename: 'emailService.js',
          schoolId: 'system',
        })
        return { messageId: `dev-${Date.now()}`, accepted: [opts.to] }
      },
    }
    logInfo('Email transporter in DEV mode (no SMTP configured — emails will be logged only)', {
      filename: 'emailService.js',
      schoolId: 'system',
    })
  }

  return transporter
}

/**
 * Send an email.
 * @param {{ to: string|string[], subject: string, text?: string, html?: string }} options
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const t = createTransporter()
    const from = process.env.SMTP_FROM || 'Vidya Hub <noreply@vidyahub.in>'

    const toList = Array.isArray(to) ? to : [to]

    const info = await t.sendMail({
      from,
      to: toList.join(', '),
      subject,
      text: text || '',
      html: html || '',
    })

    logInfo(`Email sent: ${info.messageId} → ${toList.join(', ')}`, {
      filename: 'emailService.js',
      schoolId: 'system',
    })

    return { success: true, messageId: info.messageId }
  } catch (err) {
    logError(`Email send failed: ${err.message}`, {
      filename: 'emailService.js',
      schoolId: 'system',
      stack: err.stack,
    })
    return { success: false, error: err.message }
  }
}

/**
 * Send bulk emails (one per recipient for personalization).
 * @param {{ recipients: Array<{ email: string, name: string }>, subject: string, text?: string, html?: string }} options
 * @returns {Promise<{ sent: number, failed: number, errors: string[] }>}
 */
export const sendBulkEmail = async ({ recipients, subject, text, html }) => {
  let sent = 0
  let failed = 0
  const errors = []

  for (const r of recipients) {
    // Personalize: replace {{name}} placeholders
    const personalHtml = html ? html.replace(/\{\{name\}\}/g, r.name || 'Parent') : ''
    const personalText = text ? text.replace(/\{\{name\}\}/g, r.name || 'Parent') : ''

    const result = await sendEmail({
      to: r.email,
      subject,
      text: personalText,
      html: personalHtml,
    })

    if (result.success) {
      sent++
    } else {
      failed++
      errors.push(`${r.email}: ${result.error}`)
    }
  }

  return { sent, failed, errors }
}

export default { sendEmail, sendBulkEmail }
