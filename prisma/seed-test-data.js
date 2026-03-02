import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Diya', 'Myra', 'Sara', 'Aanya', 'Aadhya', 'Ira', 'Saanvi', 'Pari', 'Anika',
  'Kabir', 'Shaurya', 'Atharv', 'Advik', 'Dhruv', 'Ritvik', 'Harsh', 'Arnav', 'Rudra', 'Daksh',
  'Navya', 'Kavya', 'Riya', 'Ishita', 'Tanvi', 'Meera', 'Nisha', 'Pooja', 'Sneha', 'Priya',
  'Rohan', 'Karan', 'Vikram', 'Rahul', 'Amit', 'Nikhil', 'Siddharth', 'Manish', 'Rajesh', 'Suresh',
  'Divya', 'Anjali', 'Shreya', 'Neha', 'Swati', 'Pallavi', 'Sunita', 'Geeta', 'Rekha', 'Lata',
  'Yash', 'Dev', 'Om', 'Laksh', 'Parth', 'Aarush', 'Devansh', 'Pranav', 'Kunal', 'Varun',
  'Tara', 'Kiara', 'Zara', 'Aisha', 'Mahi', 'Nidhi', 'Siya', 'Trisha', 'Bhavya', 'Ridhi',
  'Aryan', 'Kartik', 'Mohit', 'Gaurav', 'Akash', 'Vishal', 'Sachin', 'Deepak', 'Arun', 'Ravi',
  'Simran', 'Jasmine', 'Komal', 'Sapna', 'Mamta', 'Seema', 'Radha', 'Suman', 'Jaya', 'Asha',
]

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Iyer', 'Nair', 'Joshi',
  'Mishra', 'Pandey', 'Chauhan', 'Yadav', 'Thakur', 'Mehta', 'Shah', 'Desai', 'Rao', 'Menon',
  'Pillai', 'Bhat', 'Kulkarni', 'Patil', 'Deshpande', 'Banerjee', 'Chatterjee', 'Mukherjee', 'Das', 'Ghosh',
]

const subjects = ['English', 'Hindi', 'Mathematics', 'Science', 'Social Studies']

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

async function main() {
  console.log('🚀 Seeding test data...\n')

  // --- Ensure school exists ---
  const school = await prisma.school.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Vidya Hub International School',
      address: '42 Knowledge Park, Hyderabad, Telangana 500081',
      contact: '040-2345-6789',
      principal: 'Dr. Ramesh Krishnamurthy',
      boardType: 'CBSE',
      status: 'active',
    },
  })
  console.log('✅ School ready:', school.name)

  // --- Delete old test data (in correct order for FK constraints) ---
  console.log('\n🧹 Cleaning old data...')
  await prisma.mark.deleteMany({})
  await prisma.attendance.deleteMany({})
  await prisma.achievement.deleteMany({})
  await prisma.fee.deleteMany({})
  await prisma.exam.deleteMany({})
  await prisma.bookIssue.deleteMany({})
  await prisma.book.deleteMany({})
  await prisma.homework.deleteMany({})
  await prisma.timetable.deleteMany({})
  await prisma.period.deleteMany({})
  await prisma.expense.deleteMany({})
  await prisma.vehicle.deleteMany({})
  await prisma.driver.deleteMany({})
  await prisma.student.deleteMany({})
  await prisma.teacher.deleteMany({})
  await prisma.section.deleteMany({})
  await prisma.class.deleteMany({})
  await prisma.event.deleteMany({})
  await prisma.announcement.deleteMany({})
  await prisma.sport.deleteMany({})
  await prisma.leave.deleteMany({})
  await prisma.holiday.deleteMany({})
  await prisma.staff.deleteMany({})
  console.log('✅ Old data cleaned')

  // --- Create Classes: LKG, UKG, 1-10 ---
  console.log('\n📚 Creating classes & sections...')
  const classNames = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  const createdClasses = []
  const createdSections = {}

  for (const name of classNames) {
    const cls = await prisma.class.create({
      data: { schoolId: school.id, name },
    })
    createdClasses.push(cls)
    createdSections[cls.id] = []

    // Each class gets sections A and B
    for (const secName of ['A', 'B']) {
      const sec = await prisma.section.create({
        data: { classId: cls.id, name: secName },
      })
      createdSections[cls.id].push(sec)
    }
  }
  console.log(`✅ ${createdClasses.length} classes with 2 sections each`)

  // --- Create 15 Teachers ---
  console.log('\n👨‍🏫 Creating teachers...')
  const teacherData = [
    { firstName: 'Rajesh', lastName: 'Sharma', subject: 'Mathematics', qualification: 'M.Sc Mathematics' },
    { firstName: 'Priya', lastName: 'Verma', subject: 'English', qualification: 'M.A English Literature' },
    { firstName: 'Sunil', lastName: 'Kumar', subject: 'Science', qualification: 'M.Sc Physics' },
    { firstName: 'Anita', lastName: 'Gupta', subject: 'Hindi', qualification: 'M.A Hindi' },
    { firstName: 'Deepak', lastName: 'Patel', subject: 'Social Studies', qualification: 'M.A History' },
    { firstName: 'Kavitha', lastName: 'Reddy', subject: 'Mathematics', qualification: 'M.Sc Applied Maths' },
    { firstName: 'Mohan', lastName: 'Iyer', subject: 'Science', qualification: 'M.Sc Chemistry' },
    { firstName: 'Sunita', lastName: 'Nair', subject: 'English', qualification: 'M.A English' },
    { firstName: 'Ramesh', lastName: 'Joshi', subject: 'Computer Science', qualification: 'M.Tech CS' },
    { firstName: 'Lakshmi', lastName: 'Menon', subject: 'Art', qualification: 'BFA Fine Arts' },
    { firstName: 'Vijay', lastName: 'Thakur', subject: 'Physical Education', qualification: 'B.P.Ed' },
    { firstName: 'Meena', lastName: 'Desai', subject: 'Music', qualification: 'M.A Music' },
    { firstName: 'Arun', lastName: 'Mishra', subject: 'Science', qualification: 'M.Sc Biology' },
    { firstName: 'Geeta', lastName: 'Pandey', subject: 'Sanskrit', qualification: 'M.A Sanskrit' },
    { firstName: 'Sanjay', lastName: 'Chauhan', subject: 'Mathematics', qualification: 'M.Sc Statistics' },
  ]

  const createdTeachers = []
  for (let i = 0; i < teacherData.length; i++) {
    const t = teacherData[i]
    const teacher = await prisma.teacher.create({
      data: {
        schoolId: school.id,
        firstName: t.firstName,
        lastName: t.lastName,
        email: `${t.firstName.toLowerCase()}.${t.lastName.toLowerCase()}@vidyahub.edu`,
        dateOfBirth: randomDate(new Date('1975-01-01'), new Date('1995-12-31')),
        phoneNumber: `98${randomInt(10000000, 99999999)}`,
        subject: t.subject,
        qualification: t.qualification,
        experience: `${randomInt(2, 20)} years`,
        teacherId: `TCH${String(i + 1).padStart(4, '0')}`,
      },
    })
    createdTeachers.push(teacher)
  }
  console.log(`✅ ${createdTeachers.length} teachers created`)

  // --- Create 100 Students distributed across classes ---
  console.log('\n👥 Creating 100 students...')
  const createdStudents = []
  const genders = ['Male', 'Female']
  const fatherFirstNames = ['Ramesh', 'Suresh', 'Mahesh', 'Rajesh', 'Dinesh', 'Ganesh', 'Mukesh', 'Naresh', 'Kamlesh', 'Hitesh']
  const motherFirstNames = ['Sunita', 'Anita', 'Kavita', 'Savita', 'Lalita', 'Sushila', 'Kamala', 'Urmila', 'Nirmala', 'Vimala']

  for (let i = 0; i < 100; i++) {
    const classIndex = Math.floor(i / (100 / createdClasses.length))
    const cls = createdClasses[Math.min(classIndex, createdClasses.length - 1)]
    const secs = createdSections[cls.id]
    const sec = secs[i % 2] // alternate between A and B
    const gender = genders[i % 2]
    const fn = firstNames[i]
    const ln = lastNames[i % lastNames.length]

    const student = await prisma.student.create({
      data: {
        schoolId: school.id,
        firstName: fn,
        lastName: ln,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@student.vidyahub.edu`,
        dateOfBirth: randomDate(new Date('2010-01-01'), new Date('2020-12-31')),
        gender,
        admissionNumber: `ADM${String(2025000 + i + 1)}`,
        rollNumber: `R${String(i + 1).padStart(3, '0')}`,
        classId: cls.id,
        sectionId: sec.id,
        fatherName: `${fatherFirstNames[i % 10]} ${ln}`,
        motherName: `${motherFirstNames[i % 10]} ${ln}`,
        fatherContact: `97${randomInt(10000000, 99999999)}`,
        motherContact: `96${randomInt(10000000, 99999999)}`,
        parentEmail: `parent.${ln.toLowerCase()}${i}@gmail.com`,
      },
    })
    createdStudents.push(student)
  }
  console.log(`✅ ${createdStudents.length} students created`)

  // Print distribution
  for (const cls of createdClasses) {
    const count = createdStudents.filter(s => s.classId === cls.id).length
    console.log(`   Class ${cls.name}: ${count} students`)
  }

  // --- Create Exams: Quarterly, Half-Yearly, Final for each class ---
  console.log('\n📝 Creating exams...')
  const examTypes = ['Quarterly Exam', 'Half-Yearly Exam', 'Final Exam']
  const createdExams = []

  for (const cls of createdClasses) {
    const secs = createdSections[cls.id]
    for (const sec of secs) {
      for (const examName of examTypes) {
        const exam = await prisma.exam.create({
          data: {
            name: examName,
            classId: cls.id,
            sectionId: sec.id,
          },
        })
        createdExams.push(exam)
      }
    }
  }
  console.log(`✅ ${createdExams.length} exams created (3 exams × 2 sections × ${createdClasses.length} classes)`)

  // --- Create Marks for students ---
  console.log('\n📊 Creating marks for students...')
  let marksCount = 0

  for (const student of createdStudents) {
    // Find exams for this student's class & section
    const studentExams = createdExams.filter(
      e => e.classId === student.classId && e.sectionId === student.sectionId
    )

    for (const exam of studentExams) {
      for (const subject of subjects) {
        await prisma.mark.create({
          data: {
            studentId: student.id,
            examId: exam.id,
            subject,
            score: randomInt(35, 100),
            maxScore: 100,
          },
        })
        marksCount++
      }
    }
  }
  console.log(`✅ ${marksCount} mark entries created`)

  // --- Create Attendance (last 30 days) ---
  console.log('\n✓ Creating attendance records...')
  let attendanceCount = 0
  const today = new Date('2026-02-18')

  for (const student of createdStudents) {
    // Generate attendance for last 20 school days
    for (let d = 1; d <= 25; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() - d)

      // Skip weekends
      const day = date.getDay()
      if (day === 0 || day === 6) continue

      const status = Math.random() > 0.15 ? 'present' : 'absent' // ~85% attendance
      try {
        await prisma.attendance.create({
          data: {
            studentId: student.id,
            date,
            status,
          },
        })
        attendanceCount++
      } catch {
        // skip duplicates
      }
    }
  }
  console.log(`✅ ${attendanceCount} attendance records created`)

  // --- Create Events ---
  console.log('\n🎉 Creating events...')
  const events = [
    { title: 'Annual Sports Day', date: '2026-03-15', description: 'Annual inter-house sports competition featuring track & field events, team sports, and fun games for all classes. Parents are welcome to attend and cheer!' },
    { title: 'Science Exhibition', date: '2026-03-22', description: 'Students from classes 6-10 showcase their innovative science projects and working models. Awards for the best projects in each category.' },
    { title: 'Republic Day Celebration', date: '2026-01-26', description: 'Flag hoisting ceremony followed by cultural programs, patriotic songs, and speeches by students. Chief guest: District Education Officer.' },
    { title: 'Parent-Teacher Meeting', date: '2026-02-28', description: 'Term-end PTM to discuss student progress, areas of improvement, and upcoming academic plans. All parents are requested to attend.' },
    { title: 'Children\'s Day Celebration', date: '2025-11-14', description: 'Fun-filled day with games, dance performances, and special activities organized by teachers for students. Fancy dress competition for LKG-2nd class.' },
    { title: 'Annual Day & Prize Distribution', date: '2026-04-10', description: 'Grand annual day celebration with cultural performances, skits, and prize distribution for academic and extracurricular achievements.' },
    { title: 'Inter-School Quiz Competition', date: '2026-03-05', description: 'Students from classes 8-10 participate in inter-school quiz covering Science, Math, GK, and Current Affairs.' },
    { title: 'Art & Craft Workshop', date: '2026-02-20', description: 'Hands-on workshop on painting, clay modeling, and paper craft conducted by professional artists. Open to all students.' },
    { title: 'Math Olympiad', date: '2026-03-10', description: 'School-level Math Olympiad for classes 3-10. Top performers will represent the school at district level.' },
    { title: 'Graduation Day (Class 10)', date: '2026-04-25', description: 'Farewell and graduation ceremony for outgoing Class 10 batch with certificates, awards, and cultural program.' },
    { title: 'Yoga & Wellness Day', date: '2026-02-21', description: 'International Yoga Day celebration with morning yoga session, breathing exercises, and wellness talks for students and staff.' },
    { title: 'Book Fair', date: '2026-03-01', description: 'Week-long book fair in the school library featuring books from leading publishers. Discount for students. Reading competition included.' },
  ]

  for (const evt of events) {
    await prisma.event.create({
      data: {
        schoolId: school.id,
        title: evt.title,
        date: new Date(evt.date),
        description: evt.description,
      },
    })
  }
  console.log(`✅ ${events.length} events created`)

  // --- Create Announcements ---
  console.log('\n📣 Creating announcements...')
  const announcements = [
    { title: 'Half-Yearly Exam Schedule Released', message: 'The half-yearly examination schedule for all classes has been uploaded. Exams begin from March 1st. Please check the timetable on the notice board and prepare accordingly.' },
    { title: 'Fee Payment Reminder', message: 'This is a reminder that Term 2 fees are due by February 28th. Please clear all pending dues to avoid late fee charges. Online payment is available through the portal.' },
    { title: 'New Library Books Added', message: '200+ new books have been added to the school library including fiction, reference materials, and competitive exam guides. Students can start borrowing from tomorrow.' },
    { title: 'Bus Route Change Notice', message: 'Due to road construction, Bus Route #3 (Jubilee Hills) will follow an alternate route from Feb 20th. Pickup timing may vary by 10-15 minutes. We apologize for the inconvenience.' },
    { title: 'Holiday Notice - Maha Shivaratri', message: 'The school will remain closed on February 26th (Thursday) on account of Maha Shivaratri. Regular classes will resume on February 27th.' },
    { title: 'Uniform Code Reminder', message: 'All students must strictly follow the uniform dress code from next week. Students without proper uniform will not be allowed to attend classes. Sports uniform is mandatory on PT days.' },
    { title: 'Extra Classes for Board Exams', message: 'Special revision classes for Class 10 students will be held every Saturday from 9 AM to 1 PM starting March 1st. Attendance is compulsory.' },
    { title: 'School App Launch', message: 'We are excited to launch the Vidya Hub school app! Download it to track attendance, marks, fee payments, and school updates. Login credentials have been shared via email.' },
  ]

  for (const ann of announcements) {
    await prisma.announcement.create({
      data: {
        schoolId: school.id,
        title: ann.title,
        message: ann.message,
      },
    })
  }
  console.log(`✅ ${announcements.length} announcements created`)

  // --- Create Sports ---
  console.log('\n⚽ Creating sports...')
  const sports = [
    { name: 'Cricket', coachName: 'Coach Venkat Raman', schedule: 'Mon, Wed, Fri - 4:00 PM to 5:30 PM', description: 'School cricket team training for inter-school tournaments. Open to classes 5-10. Includes batting, bowling, and fielding practice.' },
    { name: 'Football', coachName: 'Coach Arjun Mehta', schedule: 'Tue, Thu - 4:00 PM to 5:30 PM', description: 'Football training covering dribbling, passing, shooting, and match tactics. Regular practice matches on Saturdays.' },
    { name: 'Badminton', coachName: 'Coach Saina Kumari', schedule: 'Mon, Wed, Fri - 3:30 PM to 5:00 PM', description: 'Indoor badminton coaching for singles and doubles. District-level tournament preparation included.' },
    { name: 'Table Tennis', coachName: 'Coach Sharath Kumar', schedule: 'Tue, Thu, Sat - 3:30 PM to 5:00 PM', description: 'Table tennis training for beginners and advanced players. Two professional tables available in the indoor sports hall.' },
    { name: 'Athletics', coachName: 'Coach Milkha Reddy', schedule: 'Mon to Fri - 6:00 AM to 7:00 AM', description: 'Morning training for track & field events — 100m, 200m, long jump, high jump, shot put. Annual Sports Day preparation.' },
    { name: 'Basketball', coachName: 'Coach Pradeep Singh', schedule: 'Wed, Fri, Sat - 4:00 PM to 5:30 PM', description: 'Basketball practice sessions covering shooting, defense, and team play. Full-size court available.' },
    { name: 'Volleyball', coachName: 'Coach Rakesh Yadav', schedule: 'Tue, Thu - 4:00 PM to 5:00 PM', description: 'Volleyball training for both boys and girls teams. Focus on serving, spiking, and team coordination.' },
    { name: 'Kabaddi', coachName: 'Coach Anup Kumar', schedule: 'Mon, Wed, Sat - 4:00 PM to 5:00 PM', description: 'Traditional Kabaddi training. School team regularly participates in district and state-level competitions.' },
    { name: 'Chess', coachName: 'Coach Viswanath Rao', schedule: 'Mon, Wed, Fri - 3:00 PM to 4:00 PM', description: 'Chess coaching for strategy, openings, endgames, and tournament preparation. Open to all classes.' },
    { name: 'Swimming', coachName: 'Coach Nisha Pillai', schedule: 'Tue, Thu, Sat - 7:00 AM to 8:00 AM', description: 'Swimming training in the school pool. Classes for beginners through advanced. Freestyle, backstroke, and butterfly.' },
  ]

  for (const sport of sports) {
    await prisma.sport.create({
      data: {
        schoolId: school.id,
        name: sport.name,
        coachName: sport.coachName,
        schedule: sport.schedule,
        description: sport.description,
      },
    })
  }
  console.log(`✅ ${sports.length} sports created`)

  // --- Create Achievements ---
  console.log('\n🏆 Creating achievements...')
  const achievementTemplates = [
    { title: '1st Place - District Math Olympiad', category: 'academic', description: 'Won first place in the district-level Mathematics Olympiad 2025-26.' },
    { title: 'Best Science Project Award', category: 'academic', description: 'Awarded best science project for innovative solar-powered water purifier model.' },
    { title: 'Gold Medal - 100m Sprint', category: 'sports', description: 'Won gold medal in 100m sprint at the inter-school athletics meet.' },
    { title: 'State-Level Cricket Tournament Winner', category: 'sports', description: 'Part of the school cricket team that won the state-level tournament.' },
    { title: 'Best Artist Award', category: 'arts', description: 'Won the best artist award in the annual art competition for outstanding painting.' },
    { title: '1st Place - Inter-School Debate', category: 'academic', description: 'Secured first place in the inter-school English debate competition.' },
    { title: 'Perfect Attendance Award', category: 'other', description: 'Maintained 100% attendance throughout the academic year 2025-26.' },
    { title: 'District Chess Championship Runner-Up', category: 'sports', description: 'Achieved runner-up position in the district-level chess championship.' },
    { title: 'Best Essay Writing - Hindi Divas', category: 'academic', description: 'Won first prize in Hindi essay writing competition on Hindi Divas.' },
    { title: 'School Topper - Quarterly Exam', category: 'academic', description: 'Secured highest aggregate marks in the quarterly examination.' },
  ]

  let achievementCount = 0
  for (let i = 0; i < 25; i++) {
    const student = createdStudents[randomInt(0, createdStudents.length - 1)]
    const template = achievementTemplates[i % achievementTemplates.length]
    await prisma.achievement.create({
      data: {
        studentId: student.id,
        title: template.title,
        category: template.category,
        achievementDate: randomDate(new Date('2025-06-01'), new Date('2026-02-18')),
        description: template.description,
      },
    })
    achievementCount++
  }
  console.log(`✅ ${achievementCount} achievements created`)

  // --- Create Fees ---
  console.log('\n💰 Creating fee records...')
  let feeCount = 0
  const feeTypes = [
    { feeType: 'tuition', description: 'Tuition Fee - Term 2', amount: 15000 },
    { feeType: 'exam', description: 'Examination Fee', amount: 2000 },
    { feeType: 'transport', description: 'Transport Fee - Term 2', amount: 5000 },
    { feeType: 'library', description: 'Library Fee', amount: 500 },
    { feeType: 'sports', description: 'Sports & Activities Fee', amount: 1500 },
  ]

  for (const student of createdStudents) {
    for (const fee of feeTypes) {
      const isPaid = Math.random() > 0.35
      await prisma.fee.create({
        data: {
          schoolId: school.id,
          studentId: student.id,
          feeType: fee.feeType,
          description: fee.description,
          amount: fee.amount,
          dueDate: new Date('2026-03-15'),
          status: isPaid ? 'paid' : (Math.random() > 0.5 ? 'pending' : 'overdue'),
          paidAmount: isPaid ? fee.amount : 0,
          paidDate: isPaid ? randomDate(new Date('2026-01-01'), new Date('2026-02-18')) : null,
          paymentMode: isPaid ? ['cash', 'online', 'upi', 'cheque'][randomInt(0, 3)] : null,
          academicYear: '2025-2026',
          term: 'Term 2',
        },
      })
      feeCount++
    }
  }
  console.log(`✅ ${feeCount} fee records created`)

  // --- Create Holidays ---
  console.log('\n🏖️ Creating holidays...')
  const holidays = [
    { title: 'Republic Day', date: '2026-01-26', type: 'national', description: 'National holiday celebrating the adoption of the Indian Constitution.' },
    { title: 'Maha Shivaratri', date: '2026-02-26', type: 'religious', description: 'Hindu festival dedicated to Lord Shiva.' },
    { title: 'Holi', date: '2026-03-17', type: 'religious', description: 'Festival of colours celebrating the arrival of spring.' },
    { title: 'Good Friday', date: '2026-04-03', type: 'religious', description: 'Christian holiday commemorating the crucifixion of Jesus Christ.' },
    { title: 'Ugadi', date: '2026-03-29', type: 'regional', description: 'Telugu New Year celebration.' },
    { title: 'Labour Day', date: '2026-05-01', type: 'national', description: 'International Workers Day.' },
    { title: 'Eid ul-Fitr', date: '2026-03-21', type: 'religious', description: 'Islamic holiday marking the end of Ramadan.' },
    { title: 'Independence Day', date: '2026-08-15', type: 'national', description: 'National holiday celebrating India\'s independence.' },
    { title: 'Ganesh Chaturthi', date: '2026-08-27', type: 'religious', description: 'Hindu festival celebrating the birth of Lord Ganesha.' },
    { title: 'Gandhi Jayanti', date: '2026-10-02', type: 'national', description: 'Birth anniversary of Mahatma Gandhi.' },
    { title: 'Dussehra', date: '2026-10-12', type: 'religious', description: 'Hindu festival celebrating the victory of good over evil.' },
    { title: 'Diwali', date: '2026-11-01', toDate: '2026-11-03', type: 'religious', description: 'Festival of lights - three-day holiday.' },
    { title: 'Christmas', date: '2026-12-25', type: 'religious', description: 'Christian holiday celebrating the birth of Jesus Christ.' },
    { title: 'Summer Vacation', date: '2026-05-15', toDate: '2026-06-14', type: 'school', description: 'Annual summer vacation break for all students and staff.' },
    { title: 'Dasara Vacation', date: '2026-10-10', toDate: '2026-10-19', type: 'school', description: 'Dasara vacation break.' },
    { title: 'Sankranti', date: '2026-01-14', toDate: '2026-01-16', type: 'seasonal', description: 'Harvest festival celebrated across India.' },
  ]

  for (const h of holidays) {
    await prisma.holiday.create({
      data: {
        schoolId: school.id,
        title: h.title,
        date: new Date(h.date),
        toDate: h.toDate ? new Date(h.toDate) : null,
        type: h.type,
        description: h.description,
      },
    })
  }
  console.log(`✅ ${holidays.length} holidays created`)

  // --- Create Leave Records ---
  console.log('\n📋 Creating leave records...')
  const leaveTypes = ['sick', 'casual', 'annual', 'emergency']
  const leaveStatuses = ['pending', 'approved', 'rejected']
  let leaveCount = 0

  // Teacher leaves
  for (let i = 0; i < Math.min(10, createdTeachers.length); i++) {
    const teacher = createdTeachers[i]
    const lt = leaveTypes[randomInt(0, leaveTypes.length - 1)]
    const fromDate = randomDate(new Date('2026-01-05'), new Date('2026-02-20'))
    const daysOff = randomInt(1, 5)
    const toDate = new Date(fromDate)
    toDate.setDate(toDate.getDate() + daysOff - 1)
    const status = leaveStatuses[randomInt(0, 2)]

    await prisma.leave.create({
      data: {
        schoolId: school.id,
        employeeType: 'teacher',
        employeeId: teacher.id,
        employeeName: `${teacher.firstName} ${teacher.lastName}`,
        leaveType: lt,
        fromDate,
        toDate,
        days: daysOff,
        reason: lt === 'sick' ? 'Feeling unwell, need rest' : lt === 'casual' ? 'Personal work at home' : lt === 'annual' ? 'Family vacation planned' : 'Urgent family matter',
        status,
        approvedBy: status !== 'pending' ? 'Dr. Ramesh Krishnamurthy' : null,
        remarks: status === 'rejected' ? 'Insufficient leave balance' : status === 'approved' ? 'Approved. Arrange substitute.' : null,
      },
    })
    leaveCount++
  }

  // Driver leaves
  const driverNames = ['Raju Yadav', 'Suresh Goud', 'Venkatesh Reddy', 'Manoj Kumar', 'Srinivas Rao']
  for (let i = 0; i < driverNames.length; i++) {
    const lt = leaveTypes[randomInt(0, leaveTypes.length - 1)]
    const fromDate = randomDate(new Date('2026-01-10'), new Date('2026-02-25'))
    const daysOff = randomInt(1, 3)
    const toDate = new Date(fromDate)
    toDate.setDate(toDate.getDate() + daysOff - 1)
    const status = leaveStatuses[randomInt(0, 2)]

    await prisma.leave.create({
      data: {
        schoolId: school.id,
        employeeType: 'driver',
        employeeId: null,
        employeeName: driverNames[i],
        leaveType: lt,
        fromDate,
        toDate,
        days: daysOff,
        reason: lt === 'sick' ? 'Down with fever' : lt === 'casual' ? 'Family function' : lt === 'annual' ? 'Going to hometown' : 'Vehicle accident - need recovery time',
        status,
        approvedBy: status !== 'pending' ? 'Dr. Ramesh Krishnamurthy' : null,
        remarks: status === 'rejected' ? 'No backup driver available' : status === 'approved' ? 'Approved. Route reassigned.' : null,
      },
    })
    leaveCount++
  }

  // Staff leaves
  const staffNames = ['Lakshmi Devi (Peon)', 'Ramaiah (Watchman)', 'Padma (Clerk)', 'Sridhar (Lab Assistant)', 'Bhagyamma (Ayah)']
  for (let i = 0; i < staffNames.length; i++) {
    const lt = leaveTypes[randomInt(0, leaveTypes.length - 1)]
    const fromDate = randomDate(new Date('2026-01-15'), new Date('2026-02-22'))
    const daysOff = randomInt(1, 4)
    const toDate = new Date(fromDate)
    toDate.setDate(toDate.getDate() + daysOff - 1)
    const status = leaveStatuses[randomInt(0, 2)]

    await prisma.leave.create({
      data: {
        schoolId: school.id,
        employeeType: 'staff',
        employeeId: null,
        employeeName: staffNames[i],
        leaveType: lt,
        fromDate,
        toDate,
        days: daysOff,
        reason: lt === 'sick' ? 'Medical checkup and rest' : lt === 'casual' ? 'Daughter\'s wedding preparation' : lt === 'annual' ? 'Annual village visit' : 'Emergency hospital visit',
        status,
        approvedBy: status !== 'pending' ? 'Dr. Ramesh Krishnamurthy' : null,
        remarks: status === 'approved' ? 'Approved' : status === 'rejected' ? 'Please reschedule' : null,
      },
    })
    leaveCount++
  }
  console.log(`✅ ${leaveCount} leave records created (teachers, drivers, staff)`)

  // --- Create Non-Teaching Staff ---
  console.log('\n🧹 Creating non-teaching staff...')
  const staffData = [
    { firstName: 'Ramu', lastName: 'Naidu', staffId: 'STF001', designation: 'Watchman', department: 'Security', phoneNumber: '9876543210', gender: 'male', status: 'active' },
    { firstName: 'Shyamu', lastName: 'Yadav', staffId: 'STF002', designation: 'Watchman', department: 'Security', phoneNumber: '9876543211', gender: 'male', status: 'active' },
    { firstName: 'Lakshmi', lastName: 'Devi', staffId: 'STF003', designation: 'Cleaning Staff', department: 'Housekeeping', phoneNumber: '9876543212', gender: 'female', status: 'active' },
    { firstName: 'Padma', lastName: 'Reddy', staffId: 'STF004', designation: 'Cleaning Staff', department: 'Housekeeping', phoneNumber: '9876543213', gender: 'female', status: 'active' },
    { firstName: 'Srinivas', lastName: 'Rao', staffId: 'STF005', designation: 'Lab Assistant', department: 'Laboratory', phoneNumber: '9876543214', gender: 'male', status: 'active' },
    { firstName: 'Ramaiah', lastName: 'Goud', staffId: 'STF006', designation: 'Peon', department: 'Office', phoneNumber: '9876543215', gender: 'male', status: 'active' },
    { firstName: 'Sita', lastName: 'Sharma', staffId: 'STF007', designation: 'Receptionist', department: 'Office', phoneNumber: '9876543216', gender: 'female', status: 'active' },
    { firstName: 'Mohan', lastName: 'Das', staffId: 'STF008', designation: 'Accountant', department: 'Office', phoneNumber: '9876543217', gender: 'male', status: 'active' },
    { firstName: 'Bhagyamma', lastName: 'Pillai', staffId: 'STF009', designation: 'Cook', department: 'Kitchen', phoneNumber: '9876543218', gender: 'female', status: 'active' },
    { firstName: 'Suresh', lastName: 'Patel', staffId: 'STF010', designation: 'Gardener', department: 'Maintenance', phoneNumber: '9876543219', gender: 'male', status: 'active' },
    { firstName: 'Venkat', lastName: 'Krishna', staffId: 'STF011', designation: 'Electrician', department: 'Maintenance', phoneNumber: '9876543220', gender: 'male', status: 'active' },
    { firstName: 'Anitha', lastName: 'Kumari', staffId: 'STF012', designation: 'Nurse', department: 'Office', phoneNumber: '9876543221', gender: 'female', status: 'active' },
  ]

  let createdStaff = []
  for (const s of staffData) {
    const member = await prisma.staff.create({
      data: {
        schoolId: school.id,
        ...s,
        joiningDate: randomDate(new Date('2018-01-01'), new Date('2024-12-31')),
        salary: randomInt(8000, 35000),
      },
    })
    createdStaff.push(member)
  }
  console.log(`✅ ${createdStaff.length} staff members created`)

  // --- Create Periods (school timetable slots) ---
  console.log('\n🕐 Creating periods...')
  const periodData = [
    { name: 'Period 1', startTime: '08:00', endTime: '08:45', sortOrder: 1, isBreak: false },
    { name: 'Period 2', startTime: '08:45', endTime: '09:30', sortOrder: 2, isBreak: false },
    { name: 'Period 3', startTime: '09:30', endTime: '10:15', sortOrder: 3, isBreak: false },
    { name: 'Short Break', startTime: '10:15', endTime: '10:30', sortOrder: 4, isBreak: true },
    { name: 'Period 4', startTime: '10:30', endTime: '11:15', sortOrder: 5, isBreak: false },
    { name: 'Period 5', startTime: '11:15', endTime: '12:00', sortOrder: 6, isBreak: false },
    { name: 'Lunch Break', startTime: '12:00', endTime: '12:40', sortOrder: 7, isBreak: true },
    { name: 'Period 6', startTime: '12:40', endTime: '13:25', sortOrder: 8, isBreak: false },
    { name: 'Period 7', startTime: '13:25', endTime: '14:10', sortOrder: 9, isBreak: false },
    { name: 'Period 8', startTime: '14:10', endTime: '14:55', sortOrder: 10, isBreak: false },
  ]
  const createdPeriods = []
  for (const p of periodData) {
    const period = await prisma.period.create({ data: { schoolId: school.id, ...p } })
    createdPeriods.push(period)
  }
  const teachingPeriods = createdPeriods.filter(p => !p.isBreak)
  console.log(`✅ ${createdPeriods.length} periods created (${teachingPeriods.length} teaching + 2 breaks)`)

  // --- Create Timetable entries for Class 1A as sample ---
  console.log('\n📅 Creating timetable entries...')
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const timetableSubjects = ['English', 'Mathematics', 'Science', 'Hindi', 'Social Studies', 'Computer Science', 'Art', 'Physical Education']
  const teacherNames = createdTeachers.map(t => `${t.firstName} ${t.lastName}`)
  let timetableCount = 0

  // Create timetable for first 3 classes
  for (const cls of createdClasses.slice(0, 3)) {
    for (const day of days) {
      for (let pi = 0; pi < teachingPeriods.length; pi++) {
        const period = teachingPeriods[pi]
        const subject = timetableSubjects[pi % timetableSubjects.length]
        const teacher = teacherNames[pi % teacherNames.length]
        await prisma.timetable.create({
          data: {
            classId: cls.id,
            day,
            periodId: period.id,
            subject,
            teacher,
          },
        })
        timetableCount++
      }
    }
  }
  console.log(`✅ ${timetableCount} timetable entries created (${createdClasses.slice(0,3).map(c=>c.name).join(', ')})`)

  // --- Create Homework ---
  console.log('\n📓 Creating homework assignments...')
  const homeworkData = [
    { subject: 'Mathematics', title: 'Chapter 5 - Fractions Exercise', description: 'Complete exercise 5.1 (Q1-Q10) from NCERT textbook. Show all working steps.' },
    { subject: 'English', title: 'Write a letter to your friend', description: 'Write a 150-word informal letter to your friend about your summer vacation plans. Use proper format.' },
    { subject: 'Science', title: 'Draw and label the parts of a flower', description: 'Draw a neat diagram of a flower and label: petal, sepal, stamen, pistil, receptacle.' },
    { subject: 'Hindi', title: 'निबंध लेखन - मेरा प्रिय त्योहार', description: '200 शब्दों में अपने प्रिय त्योहार पर निबंध लिखें। शुद्ध हिंदी में लिखें।' },
    { subject: 'Social Studies', title: 'Map Activity - Indian States', description: 'On the outline map of India, mark and label all states and their capitals. Use different colours.' },
    { subject: 'Mathematics', title: 'Algebra - Linear Equations', description: 'Solve problems 1-15 from Chapter 7. Show step-by-step working for each problem.' },
    { subject: 'English', title: 'Book Review - Any Story Book', description: 'Read any story book and write a 200-word review covering: plot, characters, and your opinion.' },
    { subject: 'Science', title: 'Experiment Report - Water Evaporation', description: 'Perform the evaporation experiment and write a report with: aim, materials, procedure, observations, and conclusion.' },
    { subject: 'Computer Science', title: 'Create a PowerPoint Presentation', description: 'Create a 5-slide presentation on "Uses of Computers in Daily Life" using MS PowerPoint.' },
    { subject: 'Mathematics', title: 'Practice Test - Geometry', description: 'Complete the practice test paper provided in class. All 20 questions must be attempted.' },
  ]

  let homeworkCount = 0
  for (let i = 0; i < homeworkData.length; i++) {
    const cls = createdClasses[i % createdClasses.length]
    const sec = createdSections[cls.id][0]
    const dueDate = new Date('2026-02-18')
    dueDate.setDate(dueDate.getDate() + randomInt(2, 14))
    const teacher = createdTeachers[i % createdTeachers.length]

    await prisma.homework.create({
      data: {
        schoolId: school.id,
        classId: cls.id,
        sectionId: sec.id,
        subject: homeworkData[i].subject,
        title: homeworkData[i].title,
        description: homeworkData[i].description,
        dueDate,
        assignedBy: `${teacher.firstName} ${teacher.lastName}`,
        status: 'active',
      },
    })
    homeworkCount++
  }
  console.log(`✅ ${homeworkCount} homework assignments created`)

  // --- Create Library Books ---
  console.log('\n📚 Creating library books...')
  const booksData = [
    { title: 'NCERT Mathematics Class 8', author: 'NCERT', isbn: '9788174505071', category: 'textbook', publisher: 'NCERT', totalCopies: 30, shelfLocation: 'Rack A-1' },
    { title: 'NCERT Science Class 8', author: 'NCERT', isbn: '9788174505118', category: 'textbook', publisher: 'NCERT', totalCopies: 30, shelfLocation: 'Rack A-2' },
    { title: 'NCERT English Honeydew Class 8', author: 'NCERT', isbn: '9788174505262', category: 'textbook', publisher: 'NCERT', totalCopies: 25, shelfLocation: 'Rack A-3' },
    { title: 'NCERT Social Science Class 8', author: 'NCERT', isbn: '9788174505194', category: 'textbook', publisher: 'NCERT', totalCopies: 25, shelfLocation: 'Rack A-4' },
    { title: 'Harry Potter and the Philosopher\'s Stone', author: 'J.K. Rowling', isbn: '9780439708180', category: 'fiction', publisher: 'Bloomsbury', totalCopies: 5, shelfLocation: 'Rack B-1' },
    { title: 'The Alchemist', author: 'Paulo Coelho', isbn: '9780062315007', category: 'fiction', publisher: 'HarperCollins', totalCopies: 4, shelfLocation: 'Rack B-1' },
    { title: 'Wings of Fire', author: 'A.P.J. Abdul Kalam', isbn: '9788173711466', category: 'biography', publisher: 'Universities Press', totalCopies: 6, shelfLocation: 'Rack B-2' },
    { title: 'The Jungle Book', author: 'Rudyard Kipling', isbn: '9780141325293', category: 'fiction', publisher: 'Penguin Classics', totalCopies: 4, shelfLocation: 'Rack B-2' },
    { title: 'Panchatantra Stories', author: 'Vishnu Sharma', isbn: '9788126400881', category: 'fiction', publisher: 'Children Book Trust', totalCopies: 8, shelfLocation: 'Rack B-3' },
    { title: 'Malgudi Days', author: 'R.K. Narayan', isbn: '9780140120806', category: 'fiction', publisher: 'Penguin', totalCopies: 3, shelfLocation: 'Rack B-3' },
    { title: 'Oxford Dictionary of English', author: 'Oxford University Press', isbn: '9780199571123', category: 'reference', publisher: 'Oxford', totalCopies: 5, shelfLocation: 'Rack C-1' },
    { title: 'General Knowledge 2026', author: 'Manohar Pandey', isbn: '9789313196847', category: 'reference', publisher: 'Arihant', totalCopies: 10, shelfLocation: 'Rack C-2' },
    { title: 'Atlas of India', author: 'TTK Healthcare', isbn: '9788173388459', category: 'reference', publisher: 'TTK', totalCopies: 6, shelfLocation: 'Rack C-3' },
    { title: 'Diary of a Wimpy Kid', author: 'Jeff Kinney', isbn: '9780810993136', category: 'fiction', publisher: 'Amulet Books', totalCopies: 3, shelfLocation: 'Rack D-1' },
    { title: 'Tinkle Digest Vol. 1', author: 'Anant Pai', isbn: '9788189999001', category: 'magazine', publisher: 'ACK Media', totalCopies: 8, shelfLocation: 'Rack D-2' },
    { title: 'Physics: Principles with Applications', author: 'Douglas Giancoli', isbn: '9780321625922', category: 'reference', publisher: 'Pearson', totalCopies: 4, shelfLocation: 'Rack C-1' },
    { title: 'Godan', author: 'Munshi Premchand', isbn: '9788126704088', category: 'fiction', publisher: 'Rajkamal Prakashan', totalCopies: 4, shelfLocation: 'Rack B-4' },
    { title: 'Discovery of India', author: 'Jawaharlal Nehru', isbn: '9780143031031', category: 'non-fiction', publisher: 'Penguin', totalCopies: 3, shelfLocation: 'Rack B-5' },
    { title: 'The Secret', author: 'Rhonda Byrne', isbn: '9781582701707', category: 'non-fiction', publisher: 'Atria', totalCopies: 2, shelfLocation: 'Rack D-3' },
    { title: 'Competitive Exams Mathematics', author: 'R.S. Aggarwal', isbn: '9789352534807', category: 'reference', publisher: 'S. Chand', totalCopies: 12, shelfLocation: 'Rack C-4' },
  ]

  const createdBooks = []
  for (const book of booksData) {
    const availableCopies = book.totalCopies - randomInt(0, Math.min(3, book.totalCopies - 1))
    const b = await prisma.book.create({
      data: {
        schoolId: school.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        category: book.category,
        publisher: book.publisher,
        edition: '2025-26',
        language: 'English',
        totalCopies: book.totalCopies,
        availableCopies,
        shelfLocation: book.shelfLocation,
        status: availableCopies > 0 ? 'available' : 'all-issued',
      },
    })
    createdBooks.push(b)
  }
  console.log(`✅ ${createdBooks.length} library books created`)

  // --- Create Book Issues (some students have borrowed books) ---
  console.log('\n📖 Creating book issues...')
  let issueCount = 0
  const studentsToIssue = createdStudents.slice(0, 20)
  for (let i = 0; i < studentsToIssue.length; i++) {
    const book = createdBooks[i % createdBooks.length]
    const issueDate = randomDate(new Date('2026-01-10'), new Date('2026-02-10'))
    const dueDate = new Date(issueDate)
    dueDate.setDate(dueDate.getDate() + 14)
    const isReturned = Math.random() > 0.5
    const returnDate = isReturned ? randomDate(issueDate, new Date('2026-02-18')) : null

    await prisma.bookIssue.create({
      data: {
        bookId: book.id,
        studentId: studentsToIssue[i].id,
        issueDate,
        dueDate,
        returnDate,
        status: isReturned ? 'returned' : (dueDate < new Date('2026-02-18') ? 'overdue' : 'issued'),
        fine: !isReturned && dueDate < new Date('2026-02-18') ? randomInt(5, 50) : 0,
      },
    })
    issueCount++
  }
  console.log(`✅ ${issueCount} book issues created`)

  // --- Create Transport (Drivers + Vehicles) ---
  console.log('\n🚌 Creating transport data...')
  const driverData = [
    { firstName: 'Raju', lastName: 'Yadav', phoneNumber: '9876501001', licenseNumber: 'TS-0620150012345', experience: '12 years', aadhaarNumber: '123456789012', bloodGroup: 'B+' },
    { firstName: 'Suresh', lastName: 'Goud', phoneNumber: '9876501002', licenseNumber: 'TS-0520140023456', experience: '8 years', aadhaarNumber: '234567890123', bloodGroup: 'O+' },
    { firstName: 'Venkatesh', lastName: 'Reddy', phoneNumber: '9876501003', licenseNumber: 'TS-0720160034567', experience: '15 years', aadhaarNumber: '345678901234', bloodGroup: 'A+' },
    { firstName: 'Manoj', lastName: 'Kumar', phoneNumber: '9876501004', licenseNumber: 'AP-0820130045678', experience: '10 years', aadhaarNumber: '456789012345', bloodGroup: 'AB+' },
    { firstName: 'Srinivas', lastName: 'Rao', phoneNumber: '9876501005', licenseNumber: 'TS-0920170056789', experience: '6 years', aadhaarNumber: '567890123456', bloodGroup: 'O-' },
  ]
  const createdDrivers = []
  for (const d of driverData) {
    const driver = await prisma.driver.create({
      data: {
        schoolId: school.id,
        ...d,
        licenseType: 'HMV',
        licenseExpiry: new Date('2028-12-31'),
        emergencyContact: `98765${randomInt(10000, 99999)}`,
        status: 'active',
      },
    })
    createdDrivers.push(driver)
  }

  const vehicleData = [
    { vehicleNumber: 'TS 09 EA 1234', vehicleType: 'bus', capacity: 40, routeName: 'Route 1 - Kukatpally', routeStops: 'Kukatpally, KPHB, Balkampet, School' },
    { vehicleNumber: 'TS 09 FB 5678', vehicleType: 'bus', capacity: 45, routeName: 'Route 2 - Miyapur', routeStops: 'Miyapur, Chandanagar, Kondapur, School' },
    { vehicleNumber: 'TS 09 GC 9012', vehicleType: 'bus', capacity: 35, routeName: 'Route 3 - Jubilee Hills', routeStops: 'Jubilee Hills, Banjara Hills, Punjagutta, School' },
    { vehicleNumber: 'TS 09 HD 3456', vehicleType: 'van', capacity: 12, routeName: 'Route 4 - Gachibowli', routeStops: 'Gachibowli, Manikonda, Nanakramguda, School' },
    { vehicleNumber: 'TS 09 IE 7890', vehicleType: 'bus', capacity: 50, routeName: 'Route 5 - LB Nagar', routeStops: 'LB Nagar, Kothapet, Dilsukhnagar, Malakpet, School' },
  ]
  const createdVehicles = []
  for (let i = 0; i < vehicleData.length; i++) {
    const vehicle = await prisma.vehicle.create({
      data: {
        schoolId: school.id,
        ...vehicleData[i],
        driverId: createdDrivers[i].id,
        insuranceExpiry: new Date('2027-03-31'),
        fitnessExpiry: new Date('2026-09-30'),
        permitExpiry: new Date('2027-06-30'),
        status: 'active',
      },
    })
    createdVehicles.push(vehicle)
  }
  console.log(`✅ ${createdDrivers.length} drivers and ${createdVehicles.length} vehicles created`)

  // --- Create Expenses ---
  console.log('\n💸 Creating expense records...')
  const expenseData = [
    { title: 'School Building Maintenance', category: 'maintenance', amount: 45000, paidTo: 'Ramesh Constructions', paymentMode: 'cheque', receiptNo: 'REC-2026-001', description: 'Annual painting and minor repairs of school building', approvedBy: 'Dr. Ramesh Krishnamurthy', date: '2026-01-10' },
    { title: 'January Salary - Teaching Staff', category: 'salary', amount: 385000, paidTo: 'Teaching Staff Account', paymentMode: 'online', receiptNo: 'SAL-2026-JAN-01', description: 'Monthly salary for 15 teaching staff', approvedBy: 'Dr. Ramesh Krishnamurthy', date: '2026-01-31' },
    { title: 'Stationery & Office Supplies', category: 'supplies', amount: 8500, paidTo: 'Krishna Stationery', paymentMode: 'cash', receiptNo: 'REC-2026-002', description: 'Chalk, markers, registers, pens, paper for office and classrooms', approvedBy: 'Mohan Das', date: '2026-01-15' },
    { title: 'Bus Fuel & Maintenance', category: 'transport', amount: 22000, paidTo: 'HP Petrol Pump', paymentMode: 'upi', receiptNo: 'REC-2026-003', description: 'Monthly diesel and minor maintenance for 5 school buses', approvedBy: 'Dr. Ramesh Krishnamurthy', date: '2026-01-20' },
    { title: 'Electricity Bill - January', category: 'utility', amount: 12500, paidTo: 'TSSPDCL', paymentMode: 'online', receiptNo: 'EB-JAN-2026', description: 'Monthly electricity bill for school premises', approvedBy: 'Mohan Das', date: '2026-01-25' },
    { title: 'Science Lab Equipment', category: 'infrastructure', amount: 35000, paidTo: 'Scientific Instruments Ltd', paymentMode: 'cheque', receiptNo: 'REC-2026-004', description: 'New microscopes, beakers, test tubes, and chemicals for science lab', approvedBy: 'Dr. Ramesh Krishnamurthy', date: '2026-01-28' },
    { title: 'Annual Sports Day Expenses', category: 'events', amount: 18000, paidTo: 'Various Vendors', paymentMode: 'cash', receiptNo: 'REC-2026-005', description: 'Trophies, medals, food, decoration, and sound system for Sports Day', approvedBy: 'Dr. Ramesh Krishnamurthy', date: '2026-02-05' },
    { title: 'February Salary - Teaching Staff', category: 'salary', amount: 385000, paidTo: 'Teaching Staff Account', paymentMode: 'online', receiptNo: 'SAL-2026-FEB-01', description: 'Monthly salary for 15 teaching staff', approvedBy: 'Dr. Ramesh Krishnamurthy', date: '2026-02-28' },
    { title: 'Water Purifier AMC', category: 'maintenance', amount: 6000, paidTo: 'Aquaguard Service Centre', paymentMode: 'upi', receiptNo: 'REC-2026-006', description: 'Annual maintenance contract for 4 water purifiers in school', approvedBy: 'Mohan Das', date: '2026-02-08' },
    { title: 'Library Book Purchase', category: 'supplies', amount: 15000, paidTo: 'Crossword Bookstores', paymentMode: 'cheque', receiptNo: 'REC-2026-007', description: 'Purchase of 200 new books for school library — fiction and reference', approvedBy: 'Dr. Ramesh Krishnamurthy', date: '2026-02-10' },
    { title: 'Internet & Broadband Bill', category: 'utility', amount: 3500, paidTo: 'Airtel Business', paymentMode: 'online', receiptNo: 'NET-FEB-2026', description: 'Monthly broadband internet bill for school office and computer lab', approvedBy: 'Mohan Das', date: '2026-02-12' },
    { title: 'CCTV System Installation', category: 'infrastructure', amount: 55000, paidTo: 'Securitas India', paymentMode: 'cheque', receiptNo: 'REC-2026-008', description: 'Installation of 16 CCTV cameras covering classrooms, corridors, and gates', approvedBy: 'Dr. Ramesh Krishnamurthy', date: '2026-02-15' },
  ]

  let expenseCount = 0
  for (const exp of expenseData) {
    await prisma.expense.create({
      data: {
        schoolId: school.id,
        title: exp.title,
        category: exp.category,
        amount: exp.amount,
        date: new Date(exp.date),
        paidTo: exp.paidTo,
        paymentMode: exp.paymentMode,
        receiptNo: exp.receiptNo,
        description: exp.description,
        approvedBy: exp.approvedBy,
        status: 'approved',
      },
    })
    expenseCount++
  }
  console.log(`✅ ${expenseCount} expense records created`)
  console.log('\n' + '='.repeat(50))
  console.log('🎉 TEST DATA SEEDING COMPLETE!')
  console.log('='.repeat(50))
  console.log(`  📚 Classes:        ${createdClasses.length} (LKG to 10)`)
  console.log(`  📎 Sections:       ${createdClasses.length * 2} (A & B each)`)
  console.log(`  👨‍🏫 Teachers:       ${createdTeachers.length}`)
  console.log(`  👥 Students:       ${createdStudents.length}`)
  console.log(`  📝 Exams:          ${createdExams.length}`)
  console.log(`  📊 Marks:          ${marksCount}`)
  console.log(`  ✓  Attendance:     ${attendanceCount}`)
  console.log(`  🎉 Events:         ${events.length}`)
  console.log(`  📣 Announcements:  ${announcements.length}`)
  console.log(`  ⚽ Sports:         ${sports.length}`)
  console.log(`  🏆 Achievements:   ${achievementCount}`)
  console.log(`  💰 Fee Records:    ${feeCount}`)
  console.log(`  🏖️ Holidays:       ${holidays.length}`)
  console.log(`  📋 Leave Records:  ${leaveCount}`)
  console.log(`  🧹 Staff Members:  ${createdStaff.length}`)
  console.log(`  🕐 Periods:        ${createdPeriods.length}`)
  console.log(`  📅 Timetable:      ${timetableCount} entries`)
  console.log(`  📓 Homework:       ${homeworkCount}`)
  console.log(`  📚 Library Books:  ${createdBooks.length}`)
  console.log(`  📖 Book Issues:    ${issueCount}`)
  console.log(`  🚌 Drivers:        ${createdDrivers.length}`)
  console.log(`  🚌 Vehicles:       ${createdVehicles.length}`)
  console.log(`  💸 Expenses:       ${expenseCount}`)
  console.log('='.repeat(50))
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
