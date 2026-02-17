// prisma/seed.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

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

  // Create test users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@vidyahub.edu' },
    update: {},
    create: {
      email: 'admin@vidyahub.edu',
      password: 'password123', // In production, this should be hashed
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
    update: {},
    create: {
      email: 'teacher@vidyahub.edu',
      password: 'password123',
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
    update: {},
    create: {
      email: 'student@vidyahub.edu',
      password: 'password123',
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
