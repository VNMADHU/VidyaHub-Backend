/**
 * WhatsApp Service
 *
 * States: disconnected → connecting → qr → ready
 *                                  ↓ (stale session)
 *                               cleaning → connecting (browser) → qr → ready
 *
 * KEY RULE: autoConnectIfSession and initialize both block on
 * 'cleaning', 'connecting', 'qr', 'ready' — no concurrent clients ever.
 */

import { createRequire } from 'module'
import { existsSync, rmSync, mkdirSync } from 'fs'
import { join } from 'path'
import { logInfo, logError } from '../utils/logHelpers.js'

const require = createRequire(import.meta.url)
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')

// ── Browser discovery — macOS / Windows / Linux ───────────
// WhatsApp Web requires a Chromium-based browser (Chrome, Edge, Brave, Chromium).
// Firefox and Safari are NOT supported by puppeteer/whatsapp-web.js.
// If nothing is found below, puppeteer silently falls back to its own bundled Chromium.
const _BROWSER_PATHS = {
  // macOS
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  ],
  // Windows — checks Program Files, Program Files (x86), and per-user AppData
  win32: [
    join(process.env['PROGRAMFILES']      || 'C:\\Program Files',       'Google\\Chrome\\Application\\chrome.exe'),
    join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
    join(process.env['LOCALAPPDATA']      || '',                         'Google\\Chrome\\Application\\chrome.exe'),
    join(process.env['PROGRAMFILES']      || 'C:\\Program Files',       'Microsoft\\Edge\\Application\\msedge.exe'),
    join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe'),
    join(process.env['LOCALAPPDATA']      || '',                         'Microsoft\\Edge\\Application\\msedge.exe'),
    join(process.env['PROGRAMFILES']      || 'C:\\Program Files',       'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
    join(process.env['LOCALAPPDATA']      || '',                         'BraveSoftware\\Brave-Browser\\Application\\brave.exe'),
  ],
  // Linux
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    '/usr/bin/microsoft-edge',
    '/usr/bin/brave-browser',
  ],
}

const getChromePath = () => {
  const paths = _BROWSER_PATHS[process.platform] || []
  return paths.find((p) => p && existsSync(p)) || null
}

// Session folder written by LocalAuth (clientId: 'bulk-sender')
const SESSION_PATH  = join(process.cwd(), '.wwebjs_auth', 'session-bulk-sender')
// Isolated Chrome profile dir — keeps puppeteer's browser separate from the
// user's own Chrome so they never conflict, and no --new-window needed.
const PROFILE_DIR   = join(process.cwd(), '.wwebjs_chrome_profile')
const hasSession    = () => existsSync(SESSION_PATH)

const clearSession = () => {
  try {
    rmSync(SESSION_PATH, { recursive: true, force: true })
    logInfo('[WhatsApp] Session cleared from disk', { filename: 'whatsappService.js', schoolId: 'system' })
  } catch (e) {
    logError('[WhatsApp] Failed to clear session', e, { filename: 'whatsappService.js', schoolId: 'system' })
  }
}

// ── Singleton state ────────────────────────────────────────
// States: 'disconnected' | 'connecting' | 'qr' | 'ready' | 'cleaning'
let _client       = null
let _status       = 'disconnected'
let _reloginTimer = null
// Only true once we reached 'ready' — ensures 30s auto-relogin fires only
// after a real remote-logout, NOT when the user just closes the QR browser.
let _wasReady     = false

export const getStatus = () => ({
  // Expose 'cleaning' as 'connecting' to the frontend — same spinner
  status: _status === 'cleaning' ? 'connecting' : _status
})

// ── Auto-reconnect on startup if session on disk ───────────
export const autoConnectIfSession = () => {
  // Only act when truly idle — not during cleanup, connecting or already up
  if (_status !== 'disconnected') return
  if (!hasSession()) return
  logInfo('[WhatsApp] Session on disk — auto-connecting headlessly', { filename: 'whatsappService.js', schoolId: 'system' })
  initialize().catch(() => {})
}

// ── Build client (headless if session exists, browser otherwise) ─
function _buildClient() {
  const useSession = hasSession()
  const chromePath = getChromePath()
  logInfo(`[WhatsApp] Building client — ${useSession ? 'headless (session)' : `browser${chromePath ? ` [${chromePath.split(/[/\\]/).pop()}]` : ' [bundled Chromium fallback]'}`}`, { filename: 'whatsappService.js', schoolId: 'system' })

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'bulk-sender' }),
    puppeteer: useSession
      ? { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
      : (() => {
          // Ensure isolated profile dir exists so Chrome starts as its OWN process.
          // WITHOUT this, if Chrome is already open, --new-window just signals the
          // existing app and puppeteer's launched process immediately exits → nothing opens.
          try { mkdirSync(PROFILE_DIR, { recursive: true }) } catch { /* already exists */ }
          return {
            headless: false,
            defaultViewport: null,
            ...(chromePath ? { executablePath: chromePath } : {}),
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              `--user-data-dir=${PROFILE_DIR}`,  // isolated profile = always a new independent process
              '--disable-session-crashed-bubble',
              '--disable-infobars',
            ],
          }
        })(),
  })

  client.on('qr', () => {
    if (useSession) {
      // Fired QR in headless = session is stale. Enter 'cleaning' state to block
      // autoConnectIfSession from spawning more clients while we clean up.
      if (_status === 'cleaning') return  // already handling it
      logInfo('[WhatsApp] Stale headless session — entering cleaning state', { filename: 'whatsappService.js', schoolId: 'system' })
      _status = 'cleaning'
      _client = null
      ;(async () => {
        try { await client.destroy() } catch { /* TargetCloseError expected */ }
        // Wait for Chromium to fully release file locks on the session folder
        await new Promise((r) => setTimeout(r, 3000))
        clearSession()
        await new Promise((r) => setTimeout(r, 500))
        _status = 'disconnected'
        logInfo('[WhatsApp] Cleanup done — opening browser for fresh login', { filename: 'whatsappService.js', schoolId: 'system' })
        await initialize()
      })().catch((e) => {
        _status = 'disconnected'
        logError('[WhatsApp] Cleanup/re-login failed', e, { filename: 'whatsappService.js', schoolId: 'system' })
      })
      return
    }
    _status = 'qr'
    logInfo('[WhatsApp] QR visible in browser — waiting for scan', { filename: 'whatsappService.js', schoolId: 'system' })
  })

  client.on('authenticated', () => {
    logInfo('[WhatsApp] Authenticated — session saved', { filename: 'whatsappService.js', schoolId: 'system' })
  })

  client.on('ready', () => {
    _wasReady = true
    _status = 'ready'
    logInfo('[WhatsApp] READY ✅', { filename: 'whatsappService.js', schoolId: 'system' })

    // Hook the puppeteer page so we detect if the user closes/navigates/crashes
    // the browser window AFTER successful QR scan. Without this, _status stays
    // 'ready' forever while the underlying frame is dead → sendMessage throws
    // "Attempted to use detached Frame".
    try {
      const page = client.pupPage
      if (page) {
        const _handlePageGone = (reason) => {
          if (_status !== 'ready') return  // already handled by disconnected event
          logInfo(`[WhatsApp] Browser page ${reason} — resetting to disconnected`, { filename: 'whatsappService.js', schoolId: 'system' })
          _client = null
          _status = 'disconnected'
          if (_wasReady) _scheduleRelogin()
        }
        page.once('crash',  () => _handlePageGone('crashed'))
        page.once('close',  () => _handlePageGone('closed'))
      }
    } catch { /* pupPage may not be available in all wwebjs versions */ }
  })

  client.on('auth_failure', (msg) => {
    logError('[WhatsApp] Auth failure', new Error(msg), { filename: 'whatsappService.js', schoolId: 'system' })
    _client = null
    _status = 'disconnected'
    // Only schedule auto-relogin if we had an active session — not on a bare QR browser close
    if (_wasReady) _scheduleRelogin()
  })

  client.on('disconnected', (reason) => {
    _client = null
    _status = 'disconnected'
    if (_wasReady) {
      // Remote logout / phone disconnect — wait 30s then reopen browser
      logInfo(`[WhatsApp] Disconnected: ${reason} — will reopen browser in 30 s`, { filename: 'whatsappService.js', schoolId: 'system' })
      _scheduleRelogin()
    } else {
      // Browser was closed before QR was scanned — just stay disconnected, let user click Connect
      logInfo(`[WhatsApp] Browser closed before QR scan — status: disconnected`, { filename: 'whatsappService.js', schoolId: 'system' })
    }
  })

  return client
}

// ── 30-second re-login after remote disconnect ─────────────
function _scheduleRelogin() {
  if (_reloginTimer) clearTimeout(_reloginTimer)
  _reloginTimer = setTimeout(async () => {
    _reloginTimer = null
    // If a batch send is still in progress, wait until it finishes before
    // relaunching the browser — otherwise we get two client instances fighting
    // over the same session and both fire 'ready', corrupting the send loop.
    if (_isSending) {
      logInfo('[WhatsApp] Re-login deferred — batch send in progress, will retry in 15 s', { filename: 'whatsappService.js', schoolId: 'system' })
      _scheduleRelogin()  // reschedule with another 30 s (timer resets)
      return
    }
    logInfo('[WhatsApp] 30 s elapsed — clearing session and reopening browser', { filename: 'whatsappService.js', schoolId: 'system' })
    clearSession()
    try { await initialize() } catch (e) {
      logError('[WhatsApp] Re-login after disconnect failed', e, { filename: 'whatsappService.js', schoolId: 'system' })
    }
  }, 30_000)
}

// ── Initialize ─────────────────────────────────────────────
export const initialize = async () => {
  if (_status !== 'disconnected') {
    logInfo(`[WhatsApp] Skipping initialize — status is '${_status}'`, { filename: 'whatsappService.js', schoolId: 'system' })
    return
  }
  _wasReady = false  // reset — fresh connection attempt
  _status = 'connecting'
  _client = _buildClient()
  _client.initialize().catch((e) => {
    logError('[WhatsApp] initialize() error', e, { filename: 'whatsappService.js', schoolId: 'system' })
  })
}

// ── Manual disconnect ──────────────────────────────────────
export const disconnectWA = async () => {
  if (_reloginTimer) { clearTimeout(_reloginTimer); _reloginTimer = null }
  if (_client) { try { await _client.destroy() } catch { /* ignore */ } }
  _client = null
  _status = 'disconnected'
  logInfo('[WhatsApp] Manually disconnected', { filename: 'whatsappService.js', schoolId: 'system' })
}
// ── Get saved WhatsApp contacts ───────────────────────
/**
 * Returns all contacts that are saved in the connected WhatsApp account.
 * Filters to only real contacts (isMyContact = true, not groups, has name).
 */
export const getWaContacts = async () => {
  if (_status !== 'ready' || !_client) {
    throw new Error('WhatsApp is not connected.')
  }
  const all = await _client.getContacts()
  return all
    .filter((c) => c.isMyContact && !c.isGroup && c.id?.server === 'c.us')
    .map((c) => ({
      name:   c.pushname || c.name || c.verifiedName || c.id.user,
      number: c.id.user,  // E.164 digits without '+', e.g. '919876543210'
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ── Save a new contact to WhatsApp address book ───────────────
/**
 * Saves a new contact into the connected WhatsApp account.
 * @param {string} name   — display name, e.g. "Ravi Kumar"
 * @param {string} number — digits only, e.g. "919876543210" or "9876543210"
 * @returns {{ number: string, name: string }} — the saved contact
 */
export const saveWaContact = async (name, number) => {
  if (_status !== 'ready' || !_client) {
    throw new Error('WhatsApp is not connected.')
  }
  if (!name?.trim()) throw new Error('Contact name is required.')
  if (!number)        throw new Error('Phone number is required.')

  // Normalise: strip non-digits, prepend 91 for 10-digit Indian numbers
  let cleaned = number.toString().replace(/\D/g, '')
  if (!cleaned || cleaned.length < 7) throw new Error('Invalid phone number.')
  if (cleaned.length === 10) cleaned = '91' + cleaned

  const waId = `${cleaned}@c.us`

  // Verify the number is on WhatsApp before saving
  const registered = await _client.isRegisteredUser(waId)
  if (!registered) throw new Error(`+${cleaned} is not registered on WhatsApp.`)

  // Save via WA Web internal API
  await _client.pupPage.evaluate(async (contactId, contactName) => {
    try {
      const WA = window.Store
      if (WA.AddressbookContact) {
        await WA.AddressbookContact.add({ jid: contactId, name: contactName })
      }
      // Also mark the in-memory contact
      const c = WA.Contact.get(contactId)
      if (c) {
        c.type = 'in'
        c.name = contactName
        if (WA.Contact.save) await WA.Contact.save(c)
      }
    } catch (e) {
      throw new Error('WA internal API error: ' + e.message)
    }
  }, waId, name.trim())

  logInfo(`[WhatsApp] 💾 New contact saved: ${name.trim()} (+${cleaned})`, { filename: 'whatsappService.js', schoolId: 'system' })
  return { number: cleaned, name: name.trim() }
}

// ── Save bulk contacts from CSV import ───────────────────
/**
 * Saves multiple contacts at once.
 * @param {{ name: string, number: string }[]} contacts
 * @returns {{ saved: object[], failed: object[] }}
 */
export const saveBulkWaContacts = async (contacts) => {
  if (_status !== 'ready' || !_client) {
    throw new Error('WhatsApp is not connected.')
  }
  const saved  = []
  const failed = []
  const sleep  = (ms) => new Promise((r) => setTimeout(r, ms))

  for (const row of contacts) {
    const rawName   = (row.name   || '').toString().trim()
    const rawNumber = (row.number || '').toString().trim()
    if (!rawName || !rawNumber) {
      failed.push({ name: rawName || '(empty)', number: rawNumber, reason: 'Name or number missing' })
      continue
    }
    try {
      const result = await saveWaContact(rawName, rawNumber)
      saved.push(result)
    } catch (e) {
      failed.push({ name: rawName, number: rawNumber, reason: e.message })
    }
    // Small pause between saves — avoids hammering WA internal API
    await sleep(300)
  }

  logInfo(`[WhatsApp] 📅 Bulk import done: ${saved.length} saved, ${failed.length} failed`, { filename: 'whatsappService.js', schoolId: 'system' })
  return { saved, failed }
}
// ── Send Messages ──────────────────────────────────────────
/**
 * @param {object} opts
 * @param {string[]} opts.numbers
 * @param {string}   opts.message
 * @param {{ b64: string, mime: string, name?: string }[]} [opts.attachments]
 * @param {string}   [opts.attachmentB64]   - legacy single-file compat
 * @param {string}   [opts.attachmentMime]  - legacy single-file compat
 * @param {string}   [opts.attachmentName]  - legacy single-file compat
 */
// Errors that mean the browser page is dead — not a per-contact issue
const _isDeadPageError = (err) => {
  const msg = err?.message || ''
  return (
    msg.includes('detached Frame') ||
    msg.includes('Target closed') ||
    msg.includes('Execution context was destroyed') ||
    msg.includes('Session closed') ||
    msg.includes('Protocol error') ||
    msg.includes('Cannot read properties of null') ||  // _client nulled mid-send
    msg.includes('No LID for user')                   // WA session disrupted / account restricted
  )
}

let _isSending = false  // prevents concurrent batches from hammering the same session

export const sendMessages = async ({ numbers, message, attachments, attachmentB64, attachmentMime, attachmentName, names = {} }) => {
  if (_status !== 'ready' || !_client) {
    throw new Error('WhatsApp is not connected. Please go to Notifications → WhatsApp and reconnect.')
  }
  if (_isSending) {
    throw new Error('A batch is already sending. Please wait for it to finish before starting another.')
  }

  // Normalise: support both new attachments[] and old single-field format
  const mediaList = Array.isArray(attachments) && attachments.length > 0
    ? attachments.map((a) => new MessageMedia(a.mime, a.b64, a.name || 'attachment'))
    : (attachmentB64 && attachmentMime ? [new MessageMedia(attachmentMime, attachmentB64, attachmentName || 'attachment')] : [])

  let successCount = 0
  let failCount = 0
  const errors = []

  // Helper — always awaited so the loop is truly sequential
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  // Batch size fixed for this entire send session so the modulo check fires reliably
  const batchSize = 25 + Math.floor(Math.random() * 11) // random 25–35

  _isSending = true
  try {
    for (let idx = 0; idx < numbers.length; idx++) {
      const raw = numbers[idx]

      let cleaned = raw.toString().replace(/\D/g, '')
      if (!cleaned || cleaned.length < 7) {
        errors.push(`Invalid number: ${raw}`)
        failCount++
        continue
      }
      // 10-digit → Indian number, prepend 91
      if (cleaned.length === 10) cleaned = '91' + cleaned

      const waId = `${cleaned}@c.us`

      // ── 1. Skip numbers not registered on WhatsApp ──────────────────────
      // Sending to non-WA numbers is a primary ban trigger — WA treats it as spam probing
      try {
        const registered = await _client.isRegisteredUser(waId)
        if (!registered) {
          errors.push(`${cleaned}: Not registered on WhatsApp`)
          failCount++
          logInfo(`[WhatsApp] ✗ Skip [${idx + 1}/${numbers.length}] → ${cleaned} (not on WhatsApp)`, { filename: 'whatsappService.js', schoolId: 'system' })
          continue
        }
      } catch (regErr) {
        if (_isDeadPageError(regErr)) {
          logError('[WhatsApp] Browser page is dead during registration check — resetting', regErr, { filename: 'whatsappService.js', schoolId: 'system' })
          _client = null
          _status = 'disconnected'
          if (_wasReady) _scheduleRelogin()
          throw new Error('WhatsApp browser was closed or crashed. Please reconnect and try again.')
        }
        // Non-fatal: if the check fails for other reasons, proceed to send
      }

      // ── 2. Auto-save contact if not already in address book ────────────
      try {
        const contact = await _client.getContactById(waId)
        const displayName = names[cleaned] || cleaned
        if (contact && !contact.isMyContact) {
          await _client.pupPage.evaluate(async (contactId, name) => {
            try {
              const WA = window.Store
              const contact = WA.Contact.get(contactId)
              if (contact) {
                contact.type = 'in'
                contact.name = name
                contact.pushname = contact.pushname || name
                // Try AddressbookContact.add (most reliable internal API)
                if (WA.AddressbookContact) {
                  try { await WA.AddressbookContact.add({ jid: contactId, name }) } catch { /* ignore */ }
                }
                // Fallback: direct save on the contact model
                if (WA.Contact.save) {
                  try { await WA.Contact.save(contact) } catch { /* ignore */ }
                }
              }
            } catch { /* non-fatal — ignore all internal API errors */ }
          }, waId, displayName)
          logInfo(`[WhatsApp] 💾 Saved new contact: ${displayName} (${cleaned})`, { filename: 'whatsappService.js', schoolId: 'system' })
        }
      } catch { /* non-fatal — contact save errors must never block the send */ }

      // ── 3. Typing simulation — mimics human behaviour before sending ────
      try {
        const chat = await _client.getChatById(waId)
        await chat.sendStateTyping()
        const typingMs = 1000 + Math.floor(Math.random() * 1500) // 1–2.5 s
        await sleep(typingMs)
      } catch { /* typing errors are non-fatal */ }

      try {
        if (mediaList.length > 0) {
          // First attachment carries the text caption; rest follow immediately (user-approved)
          await _client.sendMessage(waId, mediaList[0], { caption: message || '' })
          for (let i = 1; i < mediaList.length; i++) {
            await _client.sendMessage(waId, mediaList[i])
          }
        } else {
          await _client.sendMessage(waId, message)
        }
        successCount++
        logInfo(`[WhatsApp] ✓ Sent [${idx + 1}/${numbers.length}] → ${cleaned}`, { filename: 'whatsappService.js', schoolId: 'system' })
      } catch (err) {
        // Dead browser page — no point continuing the loop, reset and surface the error
        if (_isDeadPageError(err)) {
          logError('[WhatsApp] Browser page is dead (detached frame / target closed) — resetting', err, { filename: 'whatsappService.js', schoolId: 'system' })
          _client = null
          _status = 'disconnected'
          if (_wasReady) _scheduleRelogin()
          throw new Error('WhatsApp browser was closed or crashed. Please reconnect and try again.')
        }
        failCount++
        errors.push(`${cleaned}: ${err.message}`)
        logError(`[WhatsApp] ✗ Failed [${idx + 1}/${numbers.length}] → ${cleaned}`, err, { filename: 'whatsappService.js', schoolId: 'system' })
      }

      // ── 4. Delay AFTER sending (mirrors POC structure) ─────────────────
      // Applying delay after send (not before) creates a consistent rhythm:
      // send → wait → send → wait — identical to how a human would message.
      if (idx < numbers.length - 1) {
        const msgDelay = 4000 + Math.floor(Math.random() * 4000) // 4–8 s
        logInfo(`[WhatsApp] Waiting ${msgDelay}ms after message (${idx + 1}/${numbers.length})`, { filename: 'whatsappService.js', schoolId: 'system' })
        await sleep(msgDelay)

        // After every batchSize sends, add extra 60–80 s pause between batches
        if ((idx + 1) % batchSize === 0) {
          const pause = 60_000 + Math.floor(Math.random() * 20_000) // 60–80 s
          logInfo(`[WhatsApp] Batch pause after ${idx + 1} messages — waiting ${Math.round(pause / 1000)} s`, { filename: 'whatsappService.js', schoolId: 'system' })
          await sleep(pause)
        }
      }
    }
  } finally {
    _isSending = false
  }

  // Client stays alive — ready for next batch without re-connecting
  logInfo(`[WhatsApp] Batch done: ${successCount} ok, ${failCount} failed`, { filename: 'whatsappService.js', schoolId: 'system' })

  return { success: successCount, failed: failCount, errors }
}
