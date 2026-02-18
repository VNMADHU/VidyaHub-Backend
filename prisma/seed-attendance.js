import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main() {
  console.log('📅 Adding comprehensive attendance data...\n')

  // Delete existing attendance
  await prisma.attendance.deleteMany({})
  console.log('🧹 Cleared old attendance records')

  // Get all students
  const students = await prisma.student.findMany({ select: { id: true, classId: true } })
  console.log(`👥 Found ${students.length} students`)

  // Generate school days from June 2025 to Feb 2026
  const schoolDays = []
  const startDate = new Date('2025-06-16') // Academic year start
  const endDate = new Date('2026-02-18')   // Today

  // School holidays (no attendance)
  const holidays = [
    // Summer break already excluded by start date
    '2025-08-15', // Independence Day
    '2025-09-05', // Teachers Day
    '2025-10-02', // Gandhi Jayanti
    '2025-10-20', '2025-10-21', '2025-10-22', '2025-10-23', '2025-10-24', // Dussehra break
    '2025-11-01', // Diwali
    '2025-11-03', '2025-11-04', '2025-11-05', // Diwali break
    '2025-11-14', // Children's Day
    '2025-12-22', '2025-12-23', '2025-12-24', '2025-12-25', '2025-12-26', '2025-12-27',
    '2025-12-29', '2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02', // Winter break
    '2026-01-14', // Sankranti
    '2026-01-26', // Republic Day
  ]
  const holidaySet = new Set(holidays)

  const current = new Date(startDate)
  while (current <= endDate) {
    const day = current.getDay()
    const dateStr = current.toISOString().split('T')[0]

    // Skip weekends and holidays
    if (day !== 0 && day !== 6 && !holidaySet.has(dateStr)) {
      schoolDays.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }

  console.log(`📅 ${schoolDays.length} school days (Jun 2025 – Feb 2026)\n`)

  // Create attendance in batches for performance
  let totalCreated = 0
  const batchSize = 500
  let batch = []

  for (const student of students) {
    // Each student gets a base attendance rate (70-98%)
    const baseRate = (randomInt(70, 98)) / 100

    for (const date of schoolDays) {
      // Some variation: students are slightly more absent on Mondays and Fridays
      const dayOfWeek = date.getDay()
      let rate = baseRate
      if (dayOfWeek === 1) rate -= 0.03 // Monday blues
      if (dayOfWeek === 5) rate -= 0.02 // Friday skip

      // Occasional sick streaks (2-3 day absence)
      const status = Math.random() < rate ? 'present' : 'absent'

      batch.push({
        studentId: student.id,
        date: date,
        status: status,
      })

      if (batch.length >= batchSize) {
        await prisma.attendance.createMany({ data: batch, skipDuplicates: true })
        totalCreated += batch.length
        process.stdout.write(`\r  ✏️  ${totalCreated} records created...`)
        batch = []
      }
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    await prisma.attendance.createMany({ data: batch, skipDuplicates: true })
    totalCreated += batch.length
  }

  console.log(`\n\n✅ ${totalCreated} attendance records created!`)

  // Print summary stats
  const presentCount = await prisma.attendance.count({ where: { status: 'present' } })
  const absentCount = await prisma.attendance.count({ where: { status: 'absent' } })
  const overallRate = ((presentCount / (presentCount + absentCount)) * 100).toFixed(1)

  console.log(`\n📊 Summary:`)
  console.log(`  Present: ${presentCount}`)
  console.log(`  Absent:  ${absentCount}`)
  console.log(`  Overall Attendance Rate: ${overallRate}%`)
  console.log(`  School Days: ${schoolDays.length}`)
  console.log(`  Students: ${students.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
