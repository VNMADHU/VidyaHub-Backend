import { logInfo, logError } from '../utils/logHelpers.js'

/**
 * SMS Service — placeholder until provider credentials are configured.
 *
 * Supports a plug-in architecture:
 *   Set SMS_PROVIDER in .env to one of: "twilio", "msg91", "textlocal", "custom"
 *   and provide the corresponding credentials.
 *
 * For now, all SMS sends are logged only (dev mode).
 */

/**
 * Send an SMS.
 * @param {{ to: string|string[], message: string }} options
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export const sendSMS = async ({ to, message }) => {
  const provider = process.env.SMS_PROVIDER || ''
  const toList = Array.isArray(to) ? to : [to]

  try {
    switch (provider.toLowerCase()) {
      // ── Twilio ──────────────────────────────────────────
      // Set: SMS_PROVIDER=twilio, TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
      // npm install twilio
      case 'twilio': {
        const twilio = await import('twilio')
        const client = twilio.default(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)
        const results = []
        for (const phone of toList) {
          const msg = await client.messages.create({
            body: message,
            from: process.env.TWILIO_FROM,
            to: phone,
          })
          results.push(msg.sid)
        }
        logInfo(`SMS sent via Twilio: ${results.join(', ')}`, { filename: 'smsService.js', schoolId: 'system' })
        return { success: true, messageId: results.join(', ') }
      }

      // ── MSG91 ───────────────────────────────────────────
      // Set: SMS_PROVIDER=msg91, MSG91_AUTH_KEY, MSG91_SENDER_ID, MSG91_ROUTE
      case 'msg91': {
        const fetch = globalThis.fetch || (await import('node-fetch')).default
        const authKey = process.env.MSG91_AUTH_KEY
        const senderId = process.env.MSG91_SENDER_ID || 'VIDYAH'
        const route = process.env.MSG91_ROUTE || '4' // Transactional
        const mobiles = toList.map((n) => n.replace('+', '')).join(',')
        const url = `https://api.msg91.com/api/sendhttp.php?authkey=${authKey}&mobiles=${mobiles}&message=${encodeURIComponent(message)}&sender=${senderId}&route=${route}&country=91`
        const res = await fetch(url)
        const text = await res.text()
        logInfo(`SMS sent via MSG91: ${text}`, { filename: 'smsService.js', schoolId: 'system' })
        return { success: true, messageId: text }
      }

      // ── No provider configured (dev mode) ──────────────
      default: {
        logInfo(`[DEV SMS] To: ${toList.join(', ')} | Message: ${message.substring(0, 100)}...`, {
          filename: 'smsService.js',
          schoolId: 'system',
        })
        return { success: true, messageId: `dev-sms-${Date.now()}` }
      }
    }
  } catch (err) {
    logError(`SMS send failed: ${err.message}`, {
      filename: 'smsService.js',
      schoolId: 'system',
      stack: err.stack,
    })
    return { success: false, error: err.message }
  }
}

/**
 * Send bulk SMS (one per recipient for personalization).
 * @param {{ recipients: Array<{ phone: string, name: string }>, message: string }} options
 * @returns {Promise<{ sent: number, failed: number, errors: string[] }>}
 */
export const sendBulkSMS = async ({ recipients, message }) => {
  let sent = 0
  let failed = 0
  const errors = []

  for (const r of recipients) {
    const personalMessage = message.replace(/\{\{name\}\}/g, r.name || 'Parent')
    const result = await sendSMS({ to: r.phone, message: personalMessage })
    if (result.success) {
      sent++
    } else {
      failed++
      errors.push(`${r.phone}: ${result.error}`)
    }
  }

  return { sent, failed, errors }
}

export default { sendSMS, sendBulkSMS }
