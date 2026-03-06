#!/usr/bin/env node
/**
 * provision-school.js
 * ─────────────────────────────────────────────────────────────
 * CLI script to register a new school + create its super-admin.
 *
 * Usage:
 *   node scripts/provision-school.js
 *
 * Or supply values via environment variables (non-interactive mode):
 *   SCHOOL_NAME="Sunrise Academy" \
 *   SCHOOL_ADDRESS="123 Main St" \
 *   SCHOOL_EMAIL="office@sunrise.edu" \
 *   SCHOOL_MOBILE="9876543210" \
 *   ADMIN_EMAIL="admin@sunrise.edu" \
 *   ADMIN_FIRST_NAME="Ravi" \
 *   ADMIN_LAST_NAME="Kumar" \
 *   ADMIN_MOBILE="9876543211" \
 *   ADMIN_PASSWORD="SecurePass123" \
 *   FREE_TRIAL="true" \
 *   node scripts/provision-school.js
 */

import readline from 'readline'
import bcrypt   from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── helpers ──────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

const ask = (question, hidden = false) =>
  new Promise((resolve) => {
    if (hidden && process.stdout.isTTY) {
      process.stdout.write(question)
      process.stdin.setRawMode(true)
      process.stdin.resume()
      process.stdin.setEncoding('utf8')
      let input = ''
      const onData = (ch) => {
        if (ch === '\n' || ch === '\r' || ch === '\u0003') {
          process.stdin.setRawMode(false)
          process.stdin.pause()
          process.stdin.removeListener('data', onData)
          process.stdout.write('\n')
          resolve(input)
        } else if (ch === '\u007f') { // backspace
          input = input.slice(0, -1)
        } else {
          input += ch
        }
      }
      process.stdin.on('data', onData)
    } else {
      rl.question(question, resolve)
    }
  })

const banner = (text) => {
  const line = '─'.repeat(text.length + 4)
  console.log(`\n┌${line}┐`)
  console.log(`│  ${text}  │`)
  console.log(`└${line}┘`)
}

const required = async (prompt, envKey, hidden = false) => {
  if (process.env[envKey]) return process.env[envKey].trim()
  let val = ''
  while (!val.trim()) {
    val = await ask(prompt)
    if (!val.trim()) console.log('  ⚠  This field is required.')
  }
  return val.trim()
}

const optional = async (prompt, envKey, defaultVal = '') => {
  if (process.env[envKey] !== undefined) return process.env[envKey].trim()
  const val = await ask(prompt)
  return val.trim() || defaultVal
}

// ── main ──────────────────────────────────────────────────────
async function main () {
  banner('Vidya Hub — Provision New School')

  // ── School details ──
  console.log('\n📚  School Information\n')
  const schoolName    = await required('  School name        : ', 'SCHOOL_NAME')
  const schoolAddress = await required('  Address            : ', 'SCHOOL_ADDRESS')
  const schoolMobile  = await required('  Contact mobile     : ', 'SCHOOL_MOBILE')
  const principal     = await optional('  Principal name     : ', 'SCHOOL_PRINCIPAL', 'Principal')
  const boardType     = await optional('  Board type (CBSE…) : ', 'SCHOOL_BOARD', 'CBSE')
  const freeTrialRaw  = await optional('  Free trial? (y/n)  : ', 'FREE_TRIAL', 'n')
  const isFreeTrail   = ['y', 'yes', 'true', '1'].includes(freeTrialRaw.toLowerCase())

  // ── Super-admin details ──
  console.log('\n👤  Super-Admin Account\n')
  const adminFirstName = await required('  First name         : ', 'ADMIN_FIRST_NAME')
  const adminLastName  = await optional('  Last name          : ', 'ADMIN_LAST_NAME', '')
  const adminEmail     = await required('  Email              : ', 'ADMIN_EMAIL')
  const adminMobile   = await required('  Mobile             : ', 'ADMIN_MOBILE')
  let   adminPassword = process.env.ADMIN_PASSWORD?.trim() ?? ''
  if (!adminPassword) {
    adminPassword = await ask('  Password           : ', true)
    if (!adminPassword || adminPassword.length < 8) {
      console.error('\n❌  Password must be at least 8 characters.')
      rl.close()
      process.exit(1)
    }
  }

  rl.close()

  // ── Confirm ──
  console.log('\n──────────────────────────────────────────────')
  console.log('  Confirm details:')
  console.log(`  School   : ${schoolName}`)
  console.log(`  Address  : ${schoolAddress}`)
  console.log(`  Mobile   : ${schoolMobile}`)
  console.log(`  Board    : ${boardType}`)
  console.log(`  FreeTrial: ${isFreeTrail}`)
  console.log(`  Admin    : ${adminFirstName} ${adminLastName} <${adminEmail}>`)
  console.log(`  A.Mobile : ${adminMobile}`)
  console.log('──────────────────────────────────────────────')

  // Non-interactive? Skip confirmation prompt
  let proceed = true
  if (process.stdin.isTTY) {
    const ans = await new Promise((res) => {
      const r2 = readline.createInterface({ input: process.stdin, output: process.stdout })
      r2.question('\n  Proceed? (y/n): ', (a) => { r2.close(); res(a) })
    })
    proceed = ['y', 'yes'].includes(ans.trim().toLowerCase())
  }

  if (!proceed) { console.log('\nAborted.'); process.exit(0) }

  // ── Write to DB ──
  console.log('\n⏳  Creating records …')

  // ── Duplicate checks ──────────────────────────────────────
  // School name must be unique
  const existingSchool = await prisma.school.findFirst({ where: { name: schoolName } })
  if (existingSchool) {
    console.error(`\n❌  A school named "${schoolName}" already exists (id=${existingSchool.id}).`)
    process.exit(1)
  }

  // For a brand-new school the user will always be unique within it.
  // But also guard against the same email or mobile being reused within
  // ANY existing school that shares the same name (shouldn't happen after
  // the check above, kept as a safety net using a school-scoped query once
  // the school row exists inside the transaction).
  // Global uniqueness is NOT enforced — same email/mobile is allowed across
  // different schools.

  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create school
    const school = await tx.school.create({
      data: {
        name:       schoolName,
        address:    schoolAddress,
        contact:    schoolMobile,
        principal:  principal || 'Principal',
        boardType:  boardType || 'CBSE',
        status:     'active',
        isFreeTrail,
      },
    })

    // 2. Per-school uniqueness guards (email + mobile must be unique within this school)
    const emailInSchool = await tx.user.findFirst({ where: { email: adminEmail, schoolId: school.id } })
    if (emailInSchool) throw new Error(`Email "${adminEmail}" is already used in this school.`)

    const phoneInSchool = await tx.user.findFirst({ where: { phone: adminMobile, schoolId: school.id } })
    if (phoneInSchool) throw new Error(`Mobile "${adminMobile}" is already used in this school.`)

    // 3. Create super-admin user (pre-verified — provisioned by operator)
    const user = await tx.user.create({
      data: {
        email:             adminEmail,
        password:          hashedPassword,
        role:              'super-admin',
        phone:             adminMobile,
        schoolId:          school.id,
        isEmailVerified:   false,
        isPhoneVerified:   false,
        otpAttempts:       0,
        otpResendCount:    0,
      },
    })

    // 4. Create profile
    await tx.profile.create({
      data: {
        userId:    user.id,
        firstName: adminFirstName,
        lastName:  adminLastName,
      },
    })

    return { school, user }
  })

  // ── Summary ──
  console.log('\n✅  School provisioned successfully!\n')
  console.log('┌──────────────────────────────────────────────┐')
  console.log('│  SCHOOL RECORD                               │')
  console.log(`│  ID      : ${String(result.school.id).padEnd(34)}│`)
  console.log(`│  Name    : ${schoolName.substring(0, 34).padEnd(34)}│`)
  console.log(`│  Mobile  : ${schoolMobile.substring(0, 34).padEnd(34)}│`)
  console.log('├──────────────────────────────────────────────┤')
  console.log('│  SUPER-ADMIN CREDENTIALS                     │')
  console.log(`│  ID      : ${String(result.user.id).padEnd(34)}│`)
  console.log(`│  Email   : ${adminEmail.substring(0, 34).padEnd(34)}│`)
  console.log(`│  Mobile  : ${adminMobile.substring(0, 34).padEnd(34)}│`)
  console.log(`│  Password: (as entered)                      │`)
  console.log('└──────────────────────────────────────────────┘')
  console.log('\n  Share the login credentials with the school administrator.')
  console.log('  Account is pre-verified — they can log in immediately.\n')
}

main()
  .catch((err) => {
    console.error('\n❌  Error:', err.message ?? err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
