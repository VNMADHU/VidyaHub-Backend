// prisma/seed.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const SALT_ROUNDS = 12

async function main() {
  console.log('Seeding database...')

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', SALT_ROUNDS)
  console.log('✓ Passwords hashed with bcrypt')

  // Create school
  const school = await prisma.school.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Demo School',
      address: '123 Education St, City',
      contact: '1234567890',
      principal: 'Dr. Principal',
      boardType: 'CBSE',
      status: 'active',
    },
  })

  console.log('School:', school)

  // Create test users with hashed passwords
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@vidyahub.edu' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@vidyahub.edu',
      password: hashedPassword,
      role: 'school-admin',
      schoolId: school.id,
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          phone: '9876543210',
        },
      },
    },
  })

  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@vidyahub.edu' },
    update: { password: hashedPassword },
    create: {
      email: 'teacher@vidyahub.edu',
      password: hashedPassword,
      role: 'teacher',
      schoolId: school.id,
      profile: {
        create: {
          firstName: 'Teacher',
          lastName: 'User',
          phone: '9876543211',
        },
      },
    },
  })

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@vidyahub.edu' },
    update: { password: hashedPassword },
    create: {
      email: 'student@vidyahub.edu',
      password: hashedPassword,
      role: 'student',
      schoolId: school.id,
      profile: {
        create: {
          firstName: 'Student',
          lastName: 'User',
          phone: '9876543212',
        },
      },
    },
  })

  console.log('✓ Admin user:', adminUser.email)
  console.log('✓ Teacher user:', teacherUser.email)
  console.log('✓ Student user:', studentUser.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
