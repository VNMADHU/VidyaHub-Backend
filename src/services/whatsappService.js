/**
 * WhatsApp Service — follows the same pattern as test.js POC
 *
 * Flow:
 *   1. initialize() → headless:false browser opens, QR shown
 *   2. User scans QR → status becomes 'ready'
 *   3. sendMessages() → sends via the SAME browser client
 *   4. After send (or on disconnect), destroy() → browser closes
 *
 * No headless restart. No race conditions.
 */

import { createRequire } from 'module'
import { existsSync } from 'fs'
import { join } from 'path'
import { logInfo, logError } from '../utils/logHelpers.js'

const require = createRequire(import.meta.url)
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')

// Session folder written by LocalAuth (clientId: 'bulk-sender')
const SESSION_PATH = join(process.cwd(), '.wwebjs_auth', 'session-bulk-sender')
const hasSession = () => existsSync(SESSION_PATH)

// ── Singleton state ────────────────────────────────────────
let _client = null
let _status = 'disconnected'   // disconnected | connecting | qr | ready

export const getStatus = () => ({ status: _status })

// Auto-reconnect silently if session already saved on disk
export const autoConnectIfSession = () => {
  if (_status === 'disconnected' && hasSession()) {
    logInfo('[WhatsApp] Session found on disk — auto-connecting headlessly...', { filename: 'whatsappService.js', schoolId: 'system' })
    initialize().catch(() => {})
  }
}

// ── Initialize ─────────────────────────────────────────────
export const initialize = async () => {
  if (_status === 'ready' || _status === 'connecting' || _status === 'qr') {
    logInfo(`[WhatsApp] Already ${_status} — skipping`, { filename: 'whatsappService.js', schoolId: 'system' })
    return
  }

  _status = 'connecting'
  const usingSession = hasSession()
  logInfo(`[WhatsApp] Initializing (${usingSession ? 'headless – session found' : 'browser – first login'})...`, { filename: 'whatsappService.js', schoolId: 'system' })

  _client = new Client({
    authStrategy: new LocalAuth({ clientId: 'bulk-sender' }),
    puppeteer: usingSession
      ? {
          headless: true,   // session saved → silent reconnect, no browser window
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        }
      : {
          headless: false,  // no session → open browser for QR scan
          defaultViewport: null,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
        },
  })

  _client.on('qr', () => {
    _status = 'qr'
    logInfo('[WhatsApp] QR shown in browser — waiting for scan', { filename: 'whatsappService.js', schoolId: 'system' })
  })

  _client.on('authenticated', () => {
    logInfo('[WhatsApp] Authenticated — session saved', { filename: 'whatsappService.js', schoolId: 'system' })
  })

  _client.on('ready', () => {
    _status = 'ready'
    logInfo('[WhatsApp] READY ✅', { filename: 'whatsappService.js', schoolId: 'system' })
  })

  _client.on('auth_failure', (msg) => {
    _status = 'disconnected'
    _client = null
    logError('[WhatsApp] Auth failure', new Error(msg), { filename: 'whatsappService.js', schoolId: 'system' })
  })

  _client.on('disconnected', (reason) => {
    _status = 'disconnected'
    _client = null
    logInfo(`[WhatsApp] Disconnected: ${reason}`, { filename: 'whatsappService.js', schoolId: 'system' })
  })

  _client.initialize()
}

// ── Disconnect ─────────────────────────────────────────────
export const disconnectWA = async () => {
  if (_client) {
    try { await _client.destroy() } catch { /* ignore */ }
  }
  _client = null
  _status = 'disconnected'
  logInfo('[WhatsApp] Disconnected by user — browser closed', { filename: 'whatsappService.js', schoolId: 'system' })
}

// ── Send Messages ──────────────────────────────────────────
/**
 * @param {object} opts
 * @param {string[]} opts.numbers
 * @param {string}   opts.message
 * @param {string}   [opts.attachmentB64]
 * @param {string}   [opts.attachmentMime]
 * @param {string}   [opts.attachmentName]
 */
export const sendMessages = async ({ numbers, message, attachmentB64, attachmentMime, attachmentName }) => {
  if (_status !== 'ready' || !_client) {
    throw new Error('WhatsApp is not connected. Please scan the QR code first.')
  }

  let media = null
  if (attachmentB64 && attachmentMime) {
    media = new MessageMedia(attachmentMime, attachmentB64, attachmentName || 'attachment')
  }

  let successCount = 0
  let failCount = 0
  const errors = []

  for (const raw of numbers) {
    let cleaned = raw.toString().replace(/\D/g, '')
    if (!cleaned || cleaned.length < 7) {
      errors.push(`Invalid number: ${raw}`)
      failCount++
      continue
    }
    // 10-digit → Indian number, prepend 91
    if (cleaned.length === 10) cleaned = '91' + cleaned

    const waId = `${cleaned}@c.us`
    try {
      if (media) {
        await _client.sendMessage(waId, media, { caption: message })
      } else {
        await _client.sendMessage(waId, message)
      }
      successCount++
      logInfo(`[WhatsApp] Sent → ${cleaned}`, { filename: 'whatsappService.js', schoolId: 'system' })
    } catch (err) {
      failCount++
      errors.push(`${cleaned}: ${err.message}`)
      logError(`[WhatsApp] Failed → ${cleaned}`, err, { filename: 'whatsappService.js', schoolId: 'system' })
    }

    await new Promise((r) => setTimeout(r, 1500))
  }

  // Client stays alive — ready for next batch without re-connecting
  logInfo(`[WhatsApp] Batch done: ${successCount} ok, ${failCount} failed`, { filename: 'whatsappService.js', schoolId: 'system' })

  return { success: successCount, failed: failCount, errors }
}
