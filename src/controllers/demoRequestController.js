import { sendEmail } from '../services/emailService.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const PLAN_LABELS = {
  web: 'Web — Online',
  mobile: 'Web + Mobile Apps',
  desktop: 'Desktop — Offline',
  both: 'Multiple Plans',
}

export const submitDemoRequest = async (req, res, next) => {
  try {
    const { schoolName, contactName, phone, email, plan } = req.body

    if (!schoolName || !contactName || !phone) {
      return res.status(400).json({ message: 'School name, contact name, and phone are required.' })
    }

    const planLabel = PLAN_LABELS[plan] || plan || 'Not specified'
    const submittedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#3a66ff;padding:20px 24px;border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:20px">📋 New Demo Request — Vidya Hub</h2>
        </div>
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:24px">
          <table style="border-collapse:collapse;width:100%">
            <tr style="background:#f9fafb">
              <td style="padding:10px 14px;font-weight:600;color:#374151;width:140px">School Name</td>
              <td style="padding:10px 14px;color:#111827">${schoolName}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-weight:600;color:#374151">Contact Name</td>
              <td style="padding:10px 14px;color:#111827">${contactName}</td>
            </tr>
            <tr style="background:#f9fafb">
              <td style="padding:10px 14px;font-weight:600;color:#374151">Phone</td>
              <td style="padding:10px 14px;color:#111827">${phone}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-weight:600;color:#374151">Email</td>
              <td style="padding:10px 14px;color:#111827">${email || '—'}</td>
            </tr>
            <tr style="background:#f9fafb">
              <td style="padding:10px 14px;font-weight:600;color:#374151">Preferred Plan</td>
              <td style="padding:10px 14px;color:#111827">${planLabel}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;font-weight:600;color:#374151">Submitted At</td>
              <td style="padding:10px 14px;color:#111827">${submittedAt} IST</td>
            </tr>
          </table>
          <p style="margin-top:20px;color:#6b7280;font-size:13px">
            This request was submitted via the Vidya Hub website demo form.
          </p>
        </div>
      </div>
    `

    const text = [
      'New Demo Request — Vidya Hub',
      '',
      `School Name   : ${schoolName}`,
      `Contact Name  : ${contactName}`,
      `Phone         : ${phone}`,
      `Email         : ${email || '—'}`,
      `Preferred Plan: ${planLabel}`,
      `Submitted At  : ${submittedAt} IST`,
    ].join('\n')

    const result = await sendEmail({
      to: process.env.DEMO_NOTIFY_EMAIL || 'venkatan847@gmail.com',
      subject: `Demo Request: ${schoolName} — Vidya Hub`,
      text,
      html,
    })

    if (!result.success) {
      logError(`Demo request email failed for ${schoolName}`, {
        filename: 'demoRequestController.js',
        schoolId: 'public',
      })
      return res.status(500).json({ message: 'Failed to send request. Please try again.' })
    }

    logInfo(`Demo request received from ${schoolName} (${phone})`, {
      filename: 'demoRequestController.js',
      schoolId: 'public',
    })

    res.json({ message: 'Demo request received! We will contact you within 24 hours.' })
  } catch (error) {
    logError(`Demo request error: ${error.message}`, {
      filename: 'demoRequestController.js',
      schoolId: 'public',
    })
    next(error)
  }
}
