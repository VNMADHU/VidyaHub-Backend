// ═══════════════════════════════════════════════════════════════════════════
//  manage-super-admin.js
//
//  Usage (run from vidya-hub-backend/):
//    DATABASE_URL="file:./prisma/template.db" node prisma/manage-super-admin.js
//
//  ✅ ADD section  — always runs (creates / updates the super admin)
//  ❌ DELETE section — commented out, uncomment when you need to remove
// ═══════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// ┌─────────────────────────────────────────────────────────────────────────┐
// │  ✏️  EDIT THESE VALUES before running / building                        │
// └─────────────────────────────────────────────────────────────────────────┘
const CONFIG = {
  // ── Super Admin login credentials ──────────────────────────────────────
  email:    'venkatan847@gmail.com',
  password: 'SuperAdmin@123',          // change to a strong password

  // ── Super Admin profile ─────────────────────────────────────────────────
  firstName: 'Venkata',
  lastName:  'N',
  phone:     '7386719100',

  // ── School details ───────────────────────────────────────────────────────
  schoolName:    'PMR School',
  schoolAddress: '1st Floor, Vidya Bhavan, Hyderabad, Telangana - 500001',
  schoolContact: '7386719100',
  principal:     'Dr. Principal Name',
  boardType:     'CBSE',              // CBSE | ICSE | State | University
  schoolCode:    'HYD001',            // Affiliation / DISE code
  academicYear:  '2025-26',
}
// ─────────────────────────────────────────────────────────────────────────

async function addSuperAdmin() {
  console.log('\n══════════════════════════════════════════')
  console.log('   Vidya Hub — Super Admin Setup')
  console.log('══════════════════════════════════════════')

  const hashedPassword = await bcrypt.hash(CONFIG.password, 12)

  // Step 1 — Upsert school (id:1 is always the primary/demo school)
  const school = await prisma.school.upsert({
    where:  { id: 1 },
    update: {
      name:         CONFIG.schoolName,
      address:      CONFIG.schoolAddress,
      contact:      CONFIG.schoolContact,
      principal:    CONFIG.principal,
      boardType:    CONFIG.boardType,
      schoolCode:   CONFIG.schoolCode,
      academicYear: CONFIG.academicYear,
      status:       'active',
      isFreeTrail:  false,
    },
    create: {
      name:         CONFIG.schoolName,
      address:      CONFIG.schoolAddress,
      contact:      CONFIG.schoolContact,
      principal:    CONFIG.principal,
      boardType:    CONFIG.boardType,
      schoolCode:   CONFIG.schoolCode,
      academicYear: CONFIG.academicYear,
      status:       'active',
      isFreeTrail:  false,
    },
  })
  console.log(`\n✅ School  : ${school.name} (id: ${school.id})`)

  // Step 2 — Upsert super-admin user
  const existing = await prisma.user.findUnique({ where: { email: CONFIG.email } })

  let user
  if (existing) {
    user = await prisma.user.update({
      where: { email: CONFIG.email },
      data: {
        password:        hashedPassword,
        role:            'super-admin',
        schoolId:        school.id,
        phone:           CONFIG.phone,   // stored on User for OTP SMS delivery
        isEmailVerified: true,   // pre-verified — no email verification step on login
        isPhoneVerified: true,   // pre-verified — no phone OTP step on login
      },
    })
    // Update profile too
    await prisma.profile.upsert({
      where:  { userId: user.id },
      update: { firstName: CONFIG.firstName, lastName: CONFIG.lastName, phone: CONFIG.phone },
      create: { userId: user.id, firstName: CONFIG.firstName, lastName: CONFIG.lastName, phone: CONFIG.phone },
    })
    console.log(`✅ Updated : ${user.email} (role: super-admin)`)
  } else {
    user = await prisma.user.create({
      data: {
        email:           CONFIG.email,
        password:        hashedPassword,
        role:            'super-admin',
        schoolId:        school.id,
        phone:           CONFIG.phone,   // stored on User for OTP SMS delivery
        isEmailVerified: true,   // pre-verified — no email verification step on login
        isPhoneVerified: true,   // pre-verified — no phone OTP step on login
        profile: {
          create: {
            firstName: CONFIG.firstName,
            lastName:  CONFIG.lastName,
            phone:     CONFIG.phone,
          },
        },
      },
    })
    console.log(`✅ Created : ${user.email} (role: super-admin)`)
  }

  console.log('\n┌────────────────────────────────────────┐')
  console.log('│  🔐 Super Admin Login Credentials       │')
  console.log('│                                        │')
  console.log(`│  Email    : ${CONFIG.email.padEnd(27)}│`)
  console.log(`│  Password : ${CONFIG.password.padEnd(27)}│`)
  console.log('│  Role     : super-admin                │')
  console.log('└────────────────────────────────────────┘\n')
}

// ═══════════════════════════════════════════════════════════════════════════
//  ❌ DELETE SUPER ADMIN — uncomment the block below when you want to remove
// ═══════════════════════════════════════════════════════════════════════════
/*
async function deleteSuperAdmin() {
  console.log('\n══════════════════════════════════════════')
  console.log('   Vidya Hub — Delete Super Admin')
  console.log('══════════════════════════════════════════')

  const user = await prisma.user.findUnique({ where: { email: CONFIG.email } })

  if (!user) {
    console.log(`⚠️  No user found with email: ${CONFIG.email}`)
    return
  }

  // Delete profile first (foreign key constraint)
  await prisma.profile.deleteMany({ where: { userId: user.id } })

  // Delete the user
  await prisma.user.delete({ where: { email: CONFIG.email } })

  console.log(`✅ Deleted super admin: ${CONFIG.email}`)
  console.log('\n⚠️  Note: The school record was NOT deleted.')
  console.log('   To also delete the school, uncomment the line below:')
  console.log('   // await prisma.school.delete({ where: { id: 1 } })\n')
}
*/
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  await addSuperAdmin()

  // To DELETE instead, comment out addSuperAdmin() above
  // and uncomment:  await deleteSuperAdmin()
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
