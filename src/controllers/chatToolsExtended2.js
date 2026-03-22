/**
 * chatToolsExtended2.js
 *
 * Second extension file for VidyaBot AI tools.
 * Covers gaps found in the full module audit:
 *   - Student search, delete
 *   - Teacher full report, delete
 *   - Fee creation (single + bulk class assignment), delete
 *   - Per-student attendance history, school-wide date-range report
 *   - Class creation
 *   - Delete operations: exam, homework, event, announcement,
 *     expense, income, staff, admission, sport, achievement,
 *     vehicle, driver, leave, holiday
 *   - Update: sport, achievement
 *   - Add vehicle, full expense/income listings
 *
 * Chained from chatToolsExtended.js default case.
 */

import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'
import { executeExtendedTool3 } from './chatToolsExtended3.js'

// ── Tool declarations ─────────────────────────────────────────────────────────
export const extendedToolDeclarations2 = [

  // ═══════════════════════════════════════════════════════════════════════════
  // STUDENTS — extended
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'search_student',
    description: 'Search students by name, roll number, or admission number. Returns matching records with class info and IDs.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query:   { type: 'STRING', description: 'Name, roll number, or admission number to search' },
        classId: { type: 'NUMBER', description: 'Limit results to a specific class ID (optional)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'delete_student',
    description: 'Permanently delete a student and all related records. Call list_students first to confirm the student ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        studentId: { type: 'NUMBER', description: 'ID of the student to delete' },
      },
      required: ['studentId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TEACHERS — extended
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_teacher_report',
    description: 'Get a comprehensive report for one teacher: profile details, salary, leave history, and current status.',
    parameters: {
      type: 'OBJECT',
      properties: {
        teacherId: { type: 'NUMBER', description: 'Teacher ID. Call list_teachers first if you do not know it.' },
      },
      required: ['teacherId'],
    },
  },
  {
    name: 'delete_teacher',
    description: 'Permanently delete a teacher record. Call list_teachers first to confirm the teacher ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        teacherId: { type: 'NUMBER', description: 'ID of the teacher to delete' },
      },
      required: ['teacherId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FEES — extended (create + bulk + delete)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'create_fee',
    description: 'Assign a new fee record to a specific student (e.g. tuition, exam fee, activity fee). Use record_fee_payment to mark it paid later.',
    parameters: {
      type: 'OBJECT',
      properties: {
        studentId:    { type: 'NUMBER', description: 'Student ID to assign the fee to' },
        feeType:      { type: 'STRING', description: 'e.g. Tuition Fee, Exam Fee, Activity Fee, Transport Fee, Library Fee' },
        amount:       { type: 'NUMBER', description: 'Fee amount in rupees' },
        dueDate:      { type: 'STRING', description: 'Due date in YYYY-MM-DD format' },
        discount:     { type: 'NUMBER', description: 'Discount in rupees (optional, default 0)' },
        term:         { type: 'STRING', description: 'Term: Term 1, Term 2, Annual, etc. (optional)' },
        academicYear: { type: 'STRING', description: 'e.g. 2025-26 (optional)' },
        description:  { type: 'STRING', description: 'Additional notes (optional)' },
      },
      required: ['studentId', 'feeType', 'amount', 'dueDate'],
    },
  },
  {
    name: 'bulk_assign_fee',
    description: 'Assign the same fee to ALL students in a class at once. Ideal for term fees, exam fees, activity fees, etc.',
    parameters: {
      type: 'OBJECT',
      properties: {
        classId:      { type: 'NUMBER', description: 'Class ID. Call list_classes to find it.' },
        feeType:      { type: 'STRING', description: 'e.g. Tuition Fee, Exam Fee, Activity Fee' },
        amount:       { type: 'NUMBER', description: 'Fee amount per student in rupees' },
        dueDate:      { type: 'STRING', description: 'Due date in YYYY-MM-DD format' },
        discount:     { type: 'NUMBER', description: 'Discount in rupees per student (optional, default 0)' },
        term:         { type: 'STRING', description: 'Term: Term 1, Term 2, Annual (optional)' },
        academicYear: { type: 'STRING', description: 'e.g. 2025-26 (optional)' },
      },
      required: ['classId', 'feeType', 'amount', 'dueDate'],
    },
  },
  {
    name: 'delete_fee',
    description: 'Delete a fee record. Call list_student_fees first to get the fee ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        feeId: { type: 'NUMBER', description: 'Fee record ID to delete' },
      },
      required: ['feeId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ATTENDANCE — extended reports
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_student_attendance',
    description: 'Get attendance history for a specific student over a date range. Returns day-by-day records plus summary stats (present %, absent count, late count).',
    parameters: {
      type: 'OBJECT',
      properties: {
        studentId: { type: 'NUMBER', description: 'Student ID' },
        fromDate:  { type: 'STRING', description: 'Start date YYYY-MM-DD' },
        toDate:    { type: 'STRING', description: 'End date YYYY-MM-DD' },
      },
      required: ['studentId', 'fromDate', 'toDate'],
    },
  },
  {
    name: 'get_attendance_report',
    description: 'School-wide attendance report for a date range. Shows overall present/absent/late totals and lists students who were absent.',
    parameters: {
      type: 'OBJECT',
      properties: {
        fromDate: { type: 'STRING', description: 'Start date YYYY-MM-DD' },
        toDate:   { type: 'STRING', description: 'End date YYYY-MM-DD' },
        classId:  { type: 'NUMBER', description: 'Filter by class ID (optional)' },
      },
      required: ['fromDate', 'toDate'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CLASSES — create
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'create_class',
    description: 'Create a new class for the school (e.g. "Class 11", "Grade 1", "Nursery"). Call list_classes first to check existing ones.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'Class name e.g. "Class 11", "Grade 1", "Nursery"' },
      },
      required: ['name'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXAMS — delete
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'delete_exam',
    description: 'Delete an exam record and all its marks. Call list_exams first to confirm the exam ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        examId: { type: 'NUMBER', description: 'Exam ID to delete' },
      },
      required: ['examId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOMEWORK — delete
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'delete_homework',
    description: 'Delete a homework assignment. Call list_homework first to confirm the homework ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        homeworkId: { type: 'NUMBER', description: 'Homework ID to delete' },
      },
      required: ['homeworkId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENTS — delete
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'delete_event',
    description: 'Delete a school event. Call list_events first to confirm the event ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        eventId: { type: 'NUMBER', description: 'Event ID to delete' },
      },
      required: ['eventId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANNOUNCEMENTS — delete
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'delete_announcement',
    description: 'Delete an announcement. Call list_announcements first to confirm the announcement ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        announcementId: { type: 'NUMBER', description: 'Announcement ID to delete' },
      },
      required: ['announcementId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPENSES — full listing + delete
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_expenses',
    description: 'List all expense records with full details. Use get_expense_summary for totals only.',
    parameters: {
      type: 'OBJECT',
      properties: {
        category: { type: 'STRING', description: 'Filter by category (optional)' },
        fromDate: { type: 'STRING', description: 'Start date YYYY-MM-DD (optional)' },
        toDate:   { type: 'STRING', description: 'End date YYYY-MM-DD (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'delete_expense',
    description: 'Delete an expense record. Call list_expenses first to get the expense ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        expenseId: { type: 'NUMBER', description: 'Expense ID to delete' },
      },
      required: ['expenseId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INCOME — full listing + delete
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_incomes',
    description: 'List all income records with full details. Use get_income_summary for totals only.',
    parameters: {
      type: 'OBJECT',
      properties: {
        category: { type: 'STRING', description: 'Filter by category (optional)' },
        fromDate: { type: 'STRING', description: 'Start date YYYY-MM-DD (optional)' },
        toDate:   { type: 'STRING', description: 'End date YYYY-MM-DD (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'delete_income',
    description: 'Delete an income record. Call list_incomes first to get the income ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        incomeId: { type: 'NUMBER', description: 'Income ID to delete' },
      },
      required: ['incomeId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF — delete
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'delete_staff',
    description: 'Permanently delete a staff member record. Call list_staff first to confirm the staff ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        staffId: { type: 'NUMBER', description: 'Staff member ID to delete' },
      },
      required: ['staffId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMISSIONS — delete
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'delete_admission',
    description: 'Delete an admission application. Call list_admissions first to confirm the admission ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        admissionId: { type: 'NUMBER', description: 'Admission ID to delete' },
      },
      required: ['admissionId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPORTS — update + delete
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'update_sport',
    description: 'Update sport details such as coach name, schedule, or description. Call list_sports first to get the sport ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        sportId:     { type: 'NUMBER', description: 'Sport ID (required)' },
        name:        { type: 'STRING', description: 'Updated sport name (optional)' },
        coachName:   { type: 'STRING', description: 'Updated coach name (optional)' },
        schedule:    { type: 'STRING', description: 'Updated practice schedule (optional)' },
        description: { type: 'STRING', description: 'Updated description (optional)' },
      },
      required: ['sportId'],
    },
  },
  {
    name: 'delete_sport',
    description: 'Delete a sport from the school. Call list_sports first to confirm the sport ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        sportId: { type: 'NUMBER', description: 'Sport ID to delete' },
      },
      required: ['sportId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ACHIEVEMENTS — update + delete
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'update_achievement',
    description: 'Update an achievement record. Call list_achievements first to get the achievement ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        achievementId: { type: 'NUMBER', description: 'Achievement ID (required)' },
        title:         { type: 'STRING', description: 'Updated title (optional)' },
        category:      { type: 'STRING', description: 'academic, sports, cultural, other (optional)' },
        description:   { type: 'STRING', description: 'Updated description (optional)' },
        date:          { type: 'STRING', description: 'Updated date YYYY-MM-DD (optional)' },
      },
      required: ['achievementId'],
    },
  },
  {
    name: 'delete_achievement',
    description: 'Delete an achievement record. Call list_achievements first to confirm the achievement ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        achievementId: { type: 'NUMBER', description: 'Achievement ID to delete' },
      },
      required: ['achievementId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSPORT — add vehicle + delete vehicle + delete driver
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'add_vehicle',
    description: 'Add a new vehicle to the school transport fleet.',
    parameters: {
      type: 'OBJECT',
      properties: {
        vehicleNumber:   { type: 'STRING', description: 'Registration number e.g. KA01AB1234' },
        vehicleType:     { type: 'STRING', description: 'Bus, Van, Auto, Mini Bus, etc.' },
        capacity:        { type: 'NUMBER', description: 'Seating capacity' },
        routeName:       { type: 'STRING', description: 'Route name (optional)' },
        routeStops:      { type: 'STRING', description: 'Comma-separated stops (optional)' },
        driverId:        { type: 'NUMBER', description: 'Assign an existing driver ID (optional)' },
        insuranceExpiry: { type: 'STRING', description: 'Insurance expiry date YYYY-MM-DD (optional)' },
        fitnessExpiry:   { type: 'STRING', description: 'Fitness certificate expiry YYYY-MM-DD (optional)' },
        permitExpiry:    { type: 'STRING', description: 'Permit expiry date YYYY-MM-DD (optional)' },
        status:          { type: 'STRING', description: 'active, maintenance, inactive (optional, default active)' },
      },
      required: ['vehicleNumber', 'vehicleType', 'capacity'],
    },
  },
  {
    name: 'update_vehicle',
    description: 'Update an existing vehicle details. Call list_vehicles first to get the vehicle ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id:              { type: 'NUMBER', description: 'Vehicle ID (required)' },
        vehicleNumber:   { type: 'STRING', description: 'New registration number' },
        vehicleType:     { type: 'STRING', description: 'Bus, Van, Auto, Mini Bus' },
        capacity:        { type: 'NUMBER', description: 'New seating capacity' },
        routeName:       { type: 'STRING', description: 'New route name' },
        routeStops:      { type: 'STRING', description: 'Comma-separated stops' },
        driverId:        { type: 'NUMBER', description: 'Assign a driver by ID' },
        insuranceExpiry: { type: 'STRING', description: 'Insurance expiry YYYY-MM-DD' },
        fitnessExpiry:   { type: 'STRING', description: 'Fitness cert expiry YYYY-MM-DD' },
        permitExpiry:    { type: 'STRING', description: 'Permit expiry YYYY-MM-DD' },
        status:          { type: 'STRING', description: 'active, maintenance, inactive' },
      },
      required: ['id'],
    },
  },
  {
    name: 'update_driver',
    description: 'Update an existing driver details. Call list_drivers first to get the driver ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id:               { type: 'NUMBER', description: 'Driver ID (required)' },
        firstName:        { type: 'STRING', description: 'New first name' },
        lastName:         { type: 'STRING', description: 'New last name' },
        phoneNumber:      { type: 'STRING', description: 'New phone number' },
        licenseNumber:    { type: 'STRING', description: 'New license number' },
        licenseType:      { type: 'STRING', description: 'LMV, HMV, HTV, HGMV' },
        licenseExpiry:    { type: 'STRING', description: 'License expiry YYYY-MM-DD' },
        salary:           { type: 'NUMBER', description: 'New monthly salary' },
        experience:       { type: 'STRING', description: 'Years of experience' },
        dateOfBirth:      { type: 'STRING', description: 'Date of birth YYYY-MM-DD' },
        address:          { type: 'STRING', description: 'Residential address' },
        aadhaarNumber:    { type: 'STRING', description: '12-digit Aadhaar number' },
        badgeNumber:      { type: 'STRING', description: 'RTO badge number' },
        bloodGroup:       { type: 'STRING', description: 'Blood group' },
        emergencyContact: { type: 'STRING', description: 'Emergency contact number' },
        status:           { type: 'STRING', description: 'active, on-leave, inactive' },
      },
      required: ['id'],
    },
  },
  {
    name: 'update_book',
    description: 'Update an existing library book details. Call list_books first to get the book ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id:            { type: 'NUMBER', description: 'Book ID (required)' },
        title:         { type: 'STRING', description: 'New title' },
        author:        { type: 'STRING', description: 'New author name' },
        isbn:          { type: 'STRING', description: 'New ISBN' },
        category:      { type: 'STRING', description: 'fiction, non-fiction, textbook, reference, magazine' },
        publisher:     { type: 'STRING', description: 'Publisher name' },
        edition:       { type: 'STRING', description: 'Edition e.g. 3rd Edition' },
        language:      { type: 'STRING', description: 'Language' },
        totalCopies:   { type: 'NUMBER', description: 'Total number of copies' },
        shelfLocation: { type: 'STRING', description: 'Rack/shelf location' },
        status:        { type: 'STRING', description: 'available, all-issued, damaged, lost' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_vehicle',
    description: 'Remove a vehicle from the transport fleet. Call list_vehicles first to get the vehicle ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        vehicleId: { type: 'NUMBER', description: 'Vehicle ID to delete' },
      },
      required: ['vehicleId'],
    },
  },
  {
    name: 'delete_driver',
    description: 'Delete a driver record. Call list_drivers first to confirm the driver ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        driverId: { type: 'NUMBER', description: 'Driver ID to delete' },
      },
      required: ['driverId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEAVES — delete
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'delete_leave',
    description: 'Delete a leave application. Call list_leaves first to confirm the leave ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        leaveId: { type: 'NUMBER', description: 'Leave record ID to delete' },
      },
      required: ['leaveId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOLIDAYS — delete
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'delete_holiday',
    description: 'Delete a holiday entry. Call list_holidays first to confirm the holiday ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        holidayId: { type: 'NUMBER', description: 'Holiday ID to delete' },
      },
      required: ['holidayId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FEES — list all + dues report + update
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_all_fees',
    description: 'List all fee records for the school. Filter by status, class, fee type, academic year. Shows student name, amount, paid, pending.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status:       { type: 'STRING', description: 'pending, paid, overdue, partial (optional)' },
        classId:      { type: 'NUMBER', description: 'Filter by class ID (optional)' },
        feeType:      { type: 'STRING', description: 'e.g. Tuition Fee, Exam Fee (optional)' },
        academicYear: { type: 'STRING', description: 'e.g. 2025-26 (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'get_fee_dues_report',
    description: 'Show students with pending or overdue fees, sorted by largest amount due first. Best for "who owes money?" queries.',
    parameters: {
      type: 'OBJECT',
      properties: {
        classId:      { type: 'NUMBER', description: 'Limit to a specific class (optional)' },
        academicYear: { type: 'STRING', description: 'e.g. 2025-26 (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'update_fee',
    description: 'Edit an existing fee record: change amount, due date, discount, fee type, status, payment details or description. Call list_student_fees to get the fee ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        feeId:         { type: 'NUMBER', description: 'Fee record ID (required)' },
        feeType:       { type: 'STRING', description: 'New fee type (optional)' },
        amount:        { type: 'NUMBER', description: 'New amount in rupees (optional)' },
        discount:      { type: 'NUMBER', description: 'New discount in rupees (optional)' },
        dueDate:       { type: 'STRING', description: 'New due date YYYY-MM-DD (optional)' },
        description:   { type: 'STRING', description: 'New description (optional)' },
        term:          { type: 'STRING', description: 'New term e.g. Term 1, Annual (optional)' },
        academicYear:  { type: 'STRING', description: 'Academic year e.g. 2025-26 (optional)' },
        status:        { type: 'STRING', description: 'New status: pending, paid, overdue, partial (optional)' },
        paidAmount:    { type: 'NUMBER', description: 'Total paid amount in rupees (optional)' },
        paymentMode:   { type: 'STRING', description: 'Payment mode: cash, online, cheque, upi (optional)' },
        transactionId: { type: 'STRING', description: 'Transaction or receipt ID (optional)' },
      },
      required: ['feeId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INCOME — update
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'update_income',
    description: 'Edit an existing income record: change title, category, amount, date or source. Call list_incomes to get the income ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        incomeId:     { type: 'NUMBER', description: 'Income record ID (required)' },
        title:        { type: 'STRING', description: 'New title (optional)' },
        category:     { type: 'STRING', description: 'New category: donation, grant, rental, sponsorship, other (optional)' },
        amount:       { type: 'NUMBER', description: 'New amount in rupees (optional)' },
        date:         { type: 'STRING', description: 'New date YYYY-MM-DD (optional)' },
        receivedFrom: { type: 'STRING', description: 'New source/donor name (optional)' },
        paymentMode:  { type: 'STRING', description: 'cash, online, cheque, upi (optional)' },
        receiptNo:    { type: 'STRING', description: 'Receipt number (optional)' },
        description:  { type: 'STRING', description: 'New description/notes (optional)' },
        status:       { type: 'STRING', description: 'New status: received or pending (optional)' },
      },
      required: ['incomeId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPENSES — update
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'update_expense',
    description: 'Edit an existing expense record: change title, category, amount, date or vendor. Call list_expenses to get the expense ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        expenseId:   { type: 'NUMBER', description: 'Expense record ID (required)' },
        title:       { type: 'STRING', description: 'New title (optional)' },
        category:    { type: 'STRING', description: 'New category: maintenance, salary, supplies, transport, utility, events, other (optional)' },
        amount:      { type: 'NUMBER', description: 'New amount in rupees (optional)' },
        date:        { type: 'STRING', description: 'New date YYYY-MM-DD (optional)' },
        paidTo:      { type: 'STRING', description: 'New vendor/payee name (optional)' },
        paymentMode: { type: 'STRING', description: 'cash, online, cheque, upi (optional)' },
        receiptNo:   { type: 'STRING', description: 'Receipt or bill number (optional)' },
        description: { type: 'STRING', description: 'New description/notes (optional)' },
        approvedBy:  { type: 'STRING', description: 'Name of the approving person (optional)' },
        status:      { type: 'STRING', description: 'New status: pending, approved, rejected (optional)' },
      },
      required: ['expenseId'],
    },
  },
]

// ── Executor ──────────────────────────────────────────────────────────────────
export const executeExtendedTool2 = async (name, args, schoolId) => {
  const sid = parseInt(schoolId)
  try {
    switch (name) {

      // ═══════════════════════════════════════════════════════════════════════
      // STUDENTS
      // ═══════════════════════════════════════════════════════════════════════
      case 'search_student': {
        const q = (args.query || '').toLowerCase()
        const where = {
          schoolId: sid,
          ...(args.classId ? { classId: parseInt(args.classId) } : {}),
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName:  { contains: q, mode: 'insensitive' } },
            { rollNumber:      { contains: q, mode: 'insensitive' } },
            { admissionNumber: { contains: q, mode: 'insensitive' } },
          ],
        }
        const students = await prisma.student.findMany({
          where,
          include: {
            class:   { select: { name: true } },
            section: { select: { name: true } },
          },
          take: 20,
        })
        if (!students.length) return { message: `No students found matching "${args.query}"` }
        const list = students.map(s =>
          `**${s.firstName} ${s.lastName}** | Roll: ${s.rollNumber || 'N/A'} | Adm: ${s.admissionNumber || 'N/A'} | ${s.class?.name || ''} ${s.section?.name || ''} | ID: ${s.id}`
        ).join('\n')
        return { message: `Found **${students.length}** student(s):\n${list}` }
      }

      case 'delete_student': {
        const student = await prisma.student.findUnique({
          where: { id: parseInt(args.studentId) },
          select: { firstName: true, lastName: true, schoolId: true },
        })
        if (!student) return { error: 'Student not found' }
        if (student.schoolId !== sid) return { error: 'Student does not belong to this school' }
        await prisma.student.delete({ where: { id: parseInt(args.studentId) } })
        logInfo(`Student deleted: ${args.studentId}`, { filename: 'chatToolsExtended2.js' })
        return { success: true, message: `🗑️ Student **${student.firstName} ${student.lastName}** has been permanently deleted.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // TEACHERS
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_teacher_report': {
        const teacher = await prisma.teacher.findUnique({
          where: { id: parseInt(args.teacherId) },
        })
        if (!teacher) return { error: 'Teacher not found' }

        const [totalLeaves, approvedLeaves, pendingLeaves] = await Promise.all([
          prisma.leave.count({ where: { schoolId: sid, employeeId: teacher.id, employeeType: 'teacher' } }),
          prisma.leave.count({ where: { schoolId: sid, employeeId: teacher.id, employeeType: 'teacher', status: 'approved' } }),
          prisma.leave.count({ where: { schoolId: sid, employeeId: teacher.id, employeeType: 'teacher', status: 'pending' } }),
        ])

        return {
          message:
            `👨‍🏫 **Teacher Report: ${teacher.firstName} ${teacher.lastName}**\n` +
            `**ID:** ${teacher.id}  |  **Teacher ID:** ${teacher.teacherId || 'N/A'}\n` +
            `**Subject:** ${teacher.subject || 'N/A'}  |  **Designation:** ${teacher.designation || 'N/A'}\n` +
            `**Qualification:** ${teacher.qualification || 'N/A'}  |  **Experience:** ${teacher.experience || 'N/A'}\n` +
            `**Department:** ${teacher.department || 'N/A'}\n` +
            `**Joined:** ${teacher.joiningDate ? new Date(teacher.joiningDate).toLocaleDateString('en-IN') : 'N/A'}\n` +
            `**Phone:** ${teacher.phoneNumber || 'N/A'}  |  **Email:** ${teacher.email || 'N/A'}\n` +
            `**Salary:** ₹${teacher.salary?.toLocaleString('en-IN') || 'Not set'}  |  **Status:** ${teacher.status || 'active'}\n` +
            `**Gender:** ${teacher.gender || 'N/A'}  |  **Blood Group:** ${teacher.bloodGroup || 'N/A'}\n` +
            `**Leaves:** ${totalLeaves} total  |  ${approvedLeaves} approved  |  ${pendingLeaves} pending`,
        }
      }

      case 'delete_teacher': {
        const teacher = await prisma.teacher.findUnique({
          where: { id: parseInt(args.teacherId) },
          select: { firstName: true, lastName: true, schoolId: true },
        })
        if (!teacher) return { error: 'Teacher not found' }
        if (teacher.schoolId !== sid) return { error: 'Teacher does not belong to this school' }
        await prisma.teacher.delete({ where: { id: parseInt(args.teacherId) } })
        logInfo(`Teacher deleted: ${args.teacherId}`, { filename: 'chatToolsExtended2.js' })
        return { success: true, message: `🗑️ Teacher **${teacher.firstName} ${teacher.lastName}** has been permanently deleted.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // FEES
      // ═══════════════════════════════════════════════════════════════════════
      case 'create_fee': {
        const student = await prisma.student.findUnique({
          where: { id: parseInt(args.studentId) },
          select: { firstName: true, lastName: true, schoolId: true },
        })
        if (!student) return { error: 'Student not found' }
        if (student.schoolId !== sid) return { error: 'Student does not belong to this school' }

        const amount   = parseFloat(args.amount)
        const discount = parseFloat(args.discount || 0)
        const net      = amount - discount

        const fee = await prisma.fee.create({
          data: {
            schoolId:     sid,
            studentId:    parseInt(args.studentId),
            feeType:      args.feeType,
            amount,
            discount,
            dueDate:      new Date(args.dueDate),
            status:       'pending',
            paidAmount:   0,
            term:         args.term         || null,
            academicYear: args.academicYear || null,
            description:  args.description  || null,
          },
        })
        logInfo(`Fee created for student ${args.studentId}`, { filename: 'chatToolsExtended2.js' })
        return {
          success: true,
          message: `✅ Fee assigned: **${args.feeType}** of ₹${net.toLocaleString('en-IN')} for **${student.firstName} ${student.lastName}**, due ${new Date(args.dueDate).toLocaleDateString('en-IN')} (Fee ID: ${fee.id})`,
        }
      }

      case 'bulk_assign_fee': {
        const students = await prisma.student.findMany({
          where: { schoolId: sid, classId: parseInt(args.classId) },
          select: { id: true, firstName: true, lastName: true },
        })
        if (!students.length) return { error: 'No students found in this class. Call list_classes to verify the class ID.' }

        const amount   = parseFloat(args.amount)
        const discount = parseFloat(args.discount || 0)
        const net      = amount - discount
        const dueDate  = new Date(args.dueDate)

        await prisma.fee.createMany({
          data: students.map(s => ({
            schoolId:     sid,
            studentId:    s.id,
            feeType:      args.feeType,
            amount,
            discount,
            dueDate,
            status:       'pending',
            paidAmount:   0,
            term:         args.term         || null,
            academicYear: args.academicYear || null,
          })),
          skipDuplicates: false,
        })
        logInfo(`Bulk fee assigned to ${students.length} students in class ${args.classId}`, { filename: 'chatToolsExtended2.js' })
        return {
          success: true,
          message: `✅ Bulk fee assigned: **${args.feeType}** of ₹${net.toLocaleString('en-IN')} per student assigned to **${students.length}** students in the class, due ${dueDate.toLocaleDateString('en-IN')}`,
        }
      }

      case 'delete_fee': {
        const fee = await prisma.fee.findUnique({
          where: { id: parseInt(args.feeId) },
          include: { student: { select: { firstName: true, lastName: true } } },
        })
        if (!fee) return { error: 'Fee record not found' }
        if (fee.schoolId !== sid) return { error: 'Fee does not belong to this school' }
        await prisma.fee.delete({ where: { id: parseInt(args.feeId) } })
        return { success: true, message: `🗑️ Fee record **${fee.feeType}** (₹${fee.amount?.toLocaleString('en-IN')}) deleted for **${fee.student?.firstName} ${fee.student?.lastName}**` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // ATTENDANCE
      // ═══════════════════════════════════════════════════════════════════════
      case 'get_student_attendance': {
        const student = await prisma.student.findUnique({
          where: { id: parseInt(args.studentId) },
          select: { firstName: true, lastName: true, schoolId: true },
        })
        if (!student) return { error: 'Student not found' }
        if (student.schoolId !== sid) return { error: 'Student does not belong to this school' }

        const records = await prisma.attendance.findMany({
          where: {
            studentId: parseInt(args.studentId),
            date: { gte: new Date(args.fromDate), lte: new Date(args.toDate) },
          },
          orderBy: { date: 'asc' },
        })

        if (!records.length) return { message: `No attendance records found for **${student.firstName} ${student.lastName}** between ${args.fromDate} and ${args.toDate}.` }

        const total   = records.length
        const present = records.filter(r => r.status === 'present').length
        const absent  = records.filter(r => r.status === 'absent').length
        const late    = records.filter(r => r.status === 'late').length
        const pct     = Math.round((present / total) * 100)

        // Show last 10 records as a sample
        const sample = records.slice(-10).map(r =>
          `${new Date(r.date).toLocaleDateString('en-IN')}: **${r.status}**`
        ).join('  |  ')

        return {
          message:
            `📊 **Attendance: ${student.firstName} ${student.lastName}**\n` +
            `Period: ${args.fromDate} → ${args.toDate}\n` +
            `Total Days: **${total}**  |  Present: **${present}**  |  Absent: **${absent}**  |  Late: **${late}**\n` +
            `**Attendance Percentage: ${pct}%**\n\n` +
            `Recent records (last ${Math.min(10, total)}):\n${sample}`,
        }
      }

      case 'get_attendance_report': {
        const studentFilter = { schoolId: sid }
        if (args.classId) studentFilter.classId = parseInt(args.classId)

        const records = await prisma.attendance.findMany({
          where: {
            student: studentFilter,
            date: { gte: new Date(args.fromDate), lte: new Date(args.toDate) },
          },
          include: {
            student: { select: { firstName: true, lastName: true } },
          },
          orderBy: { date: 'asc' },
        })

        if (!records.length) return { message: `No attendance records found between ${args.fromDate} and ${args.toDate}.` }

        const total   = records.length
        const present = records.filter(r => r.status === 'present').length
        const absent  = records.filter(r => r.status === 'absent').length
        const late    = records.filter(r => r.status === 'late').length
        const pct     = Math.round((present / total) * 100)

        // Unique students who were absent at least once
        const absentSet = new Set(
          records.filter(r => r.status === 'absent')
            .map(r => `${r.student?.firstName} ${r.student?.lastName}`)
        )
        const absentList = [...absentSet].slice(0, 20)

        return {
          message:
            `📊 **School Attendance Report**${args.classId ? ` (Class filtered)` : ''}\n` +
            `Period: ${args.fromDate} → ${args.toDate}\n` +
            `Total Records: **${total}**  |  Present: **${present}**  |  Absent: **${absent}**  |  Late: **${late}**\n` +
            `**Overall Attendance: ${pct}%**\n\n` +
            (absentSet.size > 0
              ? `Students with absences (${absentSet.size}):\n${absentList.join(', ')}${absentSet.size > 20 ? ` ... and ${absentSet.size - 20} more` : ''}`
              : '✅ No absences in this period'),
        }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // CLASSES
      // ═══════════════════════════════════════════════════════════════════════
      case 'create_class': {
        const existing = await prisma.class.findFirst({
          where: { schoolId: sid, name: { equals: args.name, mode: 'insensitive' } },
        })
        if (existing) return { error: `Class **"${args.name}"** already exists (ID: ${existing.id}).` }

        const newClass = await prisma.class.create({
          data: { name: args.name, schoolId: sid },
          include: { sections: true },
        })
        logInfo(`Class created: ${newClass.name}`, { filename: 'chatToolsExtended2.js' })
        return { success: true, message: `✅ Class **"${newClass.name}"** created successfully (ID: ${newClass.id})` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // EXAMS
      // ═══════════════════════════════════════════════════════════════════════
      case 'delete_exam': {
        const exam = await prisma.exam.findUnique({
          where: { id: parseInt(args.examId) },
          select: { name: true },
        })
        if (!exam) return { error: 'Exam not found' }
        await prisma.exam.delete({ where: { id: parseInt(args.examId) } })
        return { success: true, message: `🗑️ Exam **"${exam.name}"** and all its marks have been deleted.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // HOMEWORK
      // ═══════════════════════════════════════════════════════════════════════
      case 'delete_homework': {
        const hw = await prisma.homework.findUnique({
          where: { id: parseInt(args.homeworkId) },
          select: { title: true, subject: true },
        })
        if (!hw) return { error: 'Homework not found' }
        await prisma.homework.delete({ where: { id: parseInt(args.homeworkId) } })
        return { success: true, message: `🗑️ Homework **"${hw.title}"** (${hw.subject}) has been deleted.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // EVENTS
      // ═══════════════════════════════════════════════════════════════════════
      case 'delete_event': {
        const event = await prisma.event.findUnique({
          where: { id: parseInt(args.eventId) },
          select: { title: true },
        })
        if (!event) return { error: 'Event not found' }
        await prisma.event.delete({ where: { id: parseInt(args.eventId) } })
        return { success: true, message: `🗑️ Event **"${event.title}"** has been deleted.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // ANNOUNCEMENTS
      // ═══════════════════════════════════════════════════════════════════════
      case 'delete_announcement': {
        const ann = await prisma.announcement.findUnique({
          where: { id: parseInt(args.announcementId) },
          select: { title: true },
        })
        if (!ann) return { error: 'Announcement not found' }
        await prisma.announcement.delete({ where: { id: parseInt(args.announcementId) } })
        return { success: true, message: `🗑️ Announcement **"${ann.title}"** has been deleted.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // EXPENSES
      // ═══════════════════════════════════════════════════════════════════════
      case 'list_expenses': {
        const where = { schoolId: sid }
        if (args.category) where.category = { contains: args.category, mode: 'insensitive' }
        if (args.fromDate || args.toDate) {
          where.date = {}
          if (args.fromDate) where.date.gte = new Date(args.fromDate)
          if (args.toDate)   where.date.lte = new Date(args.toDate)
        }
        const expenses = await prisma.expense.findMany({
          where,
          orderBy: { date: 'desc' },
          take: 50,
        })
        if (!expenses.length) return { message: 'No expense records found.' }
        const total = expenses.reduce((s, e) => s + (e.amount || 0), 0)
        const list  = expenses.slice(0, 20).map(e =>
          `**${e.title}** (${e.category}) — ₹${e.amount?.toLocaleString('en-IN')} on ${new Date(e.date).toLocaleDateString('en-IN')} | ID: ${e.id}`
        ).join('\n')
        return {
          message: `📋 **Expenses** (${expenses.length} records):\n${list}${expenses.length > 20 ? `\n...and ${expenses.length - 20} more` : ''}\n\n**Total: ₹${total.toLocaleString('en-IN')}**`,
        }
      }

      case 'delete_expense': {
        const expense = await prisma.expense.findUnique({
          where: { id: parseInt(args.expenseId) },
          select: { title: true, amount: true, schoolId: true },
        })
        if (!expense) return { error: 'Expense record not found' }
        if (expense.schoolId !== sid) return { error: 'Expense does not belong to this school' }
        await prisma.expense.delete({ where: { id: parseInt(args.expenseId) } })
        return { success: true, message: `🗑️ Expense **"${expense.title}"** (₹${expense.amount?.toLocaleString('en-IN')}) deleted.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // INCOME
      // ═══════════════════════════════════════════════════════════════════════
      case 'list_incomes': {
        const where = { schoolId: sid }
        if (args.category) where.category = { contains: args.category, mode: 'insensitive' }
        if (args.fromDate || args.toDate) {
          where.date = {}
          if (args.fromDate) where.date.gte = new Date(args.fromDate)
          if (args.toDate)   where.date.lte = new Date(args.toDate)
        }
        const incomes = await prisma.income.findMany({
          where,
          orderBy: { date: 'desc' },
          take: 50,
        })
        if (!incomes.length) return { message: 'No income records found.' }
        const total = incomes.reduce((s, i) => s + (i.amount || 0), 0)
        const list  = incomes.slice(0, 20).map(i =>
          `**${i.title}** (${i.category}) — ₹${i.amount?.toLocaleString('en-IN')} on ${new Date(i.date).toLocaleDateString('en-IN')} | ID: ${i.id}`
        ).join('\n')
        return {
          message: `💰 **Income Records** (${incomes.length} records):\n${list}${incomes.length > 20 ? `\n...and ${incomes.length - 20} more` : ''}\n\n**Total: ₹${total.toLocaleString('en-IN')}**`,
        }
      }

      case 'delete_income': {
        const income = await prisma.income.findUnique({
          where: { id: parseInt(args.incomeId) },
          select: { title: true, amount: true, schoolId: true },
        })
        if (!income) return { error: 'Income record not found' }
        if (income.schoolId !== sid) return { error: 'Income record does not belong to this school' }
        await prisma.income.delete({ where: { id: parseInt(args.incomeId) } })
        return { success: true, message: `🗑️ Income **"${income.title}"** (₹${income.amount?.toLocaleString('en-IN')}) deleted.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // STAFF
      // ═══════════════════════════════════════════════════════════════════════
      case 'delete_staff': {
        const staff = await prisma.staff.findUnique({
          where: { id: parseInt(args.staffId) },
          select: { firstName: true, lastName: true, designation: true, schoolId: true },
        })
        if (!staff) return { error: 'Staff member not found' }
        if (staff.schoolId !== sid) return { error: 'Staff member does not belong to this school' }
        await prisma.staff.delete({ where: { id: parseInt(args.staffId) } })
        logInfo(`Staff deleted: ${args.staffId}`, { filename: 'chatToolsExtended2.js' })
        return { success: true, message: `🗑️ Staff member **${staff.firstName} ${staff.lastName}** (${staff.designation}) has been permanently deleted.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // ADMISSIONS
      // ═══════════════════════════════════════════════════════════════════════
      case 'delete_admission': {
        const adm = await prisma.admission.findUnique({
          where: { id: parseInt(args.admissionId) },
          select: { applicantName: true, applicationNo: true, schoolId: true },
        })
        if (!adm) return { error: 'Admission record not found' }
        if (adm.schoolId !== sid) return { error: 'Admission does not belong to this school' }
        await prisma.admission.delete({ where: { id: parseInt(args.admissionId) } })
        return { success: true, message: `🗑️ Admission application for **${adm.applicantName}** (${adm.applicationNo}) has been deleted.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // SPORTS
      // ═══════════════════════════════════════════════════════════════════════
      case 'update_sport': {
        const data = {}
        if (args.name        !== undefined) data.name        = args.name
        if (args.coachName   !== undefined) data.coachName   = args.coachName
        if (args.schedule    !== undefined) data.schedule    = args.schedule
        if (args.description !== undefined) data.description = args.description
        const sport = await prisma.sport.update({
          where: { id: parseInt(args.sportId) },
          data,
        })
        return { success: true, message: `✅ Sport **"${sport.name}"** updated successfully.` }
      }

      case 'delete_sport': {
        const sport = await prisma.sport.findUnique({
          where: { id: parseInt(args.sportId) },
          select: { name: true, schoolId: true },
        })
        if (!sport) return { error: 'Sport not found' }
        if (sport.schoolId !== sid) return { error: 'Sport does not belong to this school' }
        await prisma.sport.delete({ where: { id: parseInt(args.sportId) } })
        return { success: true, message: `🗑️ Sport **"${sport.name}"** has been deleted.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // ACHIEVEMENTS
      // ═══════════════════════════════════════════════════════════════════════
      case 'update_achievement': {
        const data = {}
        if (args.title       !== undefined) data.title           = args.title
        if (args.category    !== undefined) data.category        = args.category
        if (args.description !== undefined) data.description     = args.description
        if (args.date        !== undefined) data.achievementDate = new Date(args.date)
        const ach = await prisma.achievement.update({
          where: { id: parseInt(args.achievementId) },
          data,
          include: { student: { select: { firstName: true, lastName: true } } },
        })
        return { success: true, message: `✅ Achievement **"${ach.title}"** for **${ach.student?.firstName} ${ach.student?.lastName}** updated.` }
      }

      case 'delete_achievement': {
        const ach = await prisma.achievement.findUnique({
          where: { id: parseInt(args.achievementId) },
          select: { title: true },
        })
        if (!ach) return { error: 'Achievement not found' }
        await prisma.achievement.delete({ where: { id: parseInt(args.achievementId) } })
        return { success: true, message: `🗑️ Achievement **"${ach.title}"** has been deleted.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // TRANSPORT
      // ═══════════════════════════════════════════════════════════════════════
      case 'add_vehicle': {
        const vehicle = await prisma.vehicle.create({
          data: {
            schoolId:        sid,
            vehicleNumber:   args.vehicleNumber,
            vehicleType:     args.vehicleType,
            capacity:        parseInt(args.capacity),
            routeName:       args.routeName       || null,
            routeStops:      args.routeStops      || null,
            driverId:        args.driverId        ? parseInt(args.driverId)           : null,
            insuranceExpiry: args.insuranceExpiry ? new Date(args.insuranceExpiry)    : null,
            fitnessExpiry:   args.fitnessExpiry   ? new Date(args.fitnessExpiry)      : null,
            permitExpiry:    args.permitExpiry    ? new Date(args.permitExpiry)       : null,
            status:          args.status          || 'active',
          },
        })
        return { success: true, message: `🚌 Vehicle **${vehicle.vehicleNumber}** (${vehicle.vehicleType}, capacity ${vehicle.capacity}) added to transport fleet.` }
      }

      case 'delete_vehicle': {
        const v = await prisma.vehicle.findUnique({
          where: { id: parseInt(args.vehicleId) },
          select: { vehicleNumber: true, schoolId: true },
        })
        if (!v) return { error: 'Vehicle not found' }
        if (v.schoolId !== sid) return { error: 'Vehicle does not belong to this school' }
        await prisma.vehicle.delete({ where: { id: parseInt(args.vehicleId) } })
        return { success: true, message: `🗑️ Vehicle **${v.vehicleNumber}** removed from transport fleet.` }
      }

      case 'delete_driver': {
        const d = await prisma.driver.findUnique({
          where: { id: parseInt(args.driverId) },
          select: { firstName: true, lastName: true, schoolId: true },
        })
        if (!d) return { error: 'Driver not found' }
        if (d.schoolId !== sid) return { error: 'Driver does not belong to this school' }
        await prisma.driver.delete({ where: { id: parseInt(args.driverId) } })
        return { success: true, message: `🗑️ Driver **${d.firstName} ${d.lastName}** has been removed.` }
      }

      case 'update_vehicle': {
        const data = {}
        if (args.vehicleNumber   !== undefined) data.vehicleNumber   = args.vehicleNumber
        if (args.vehicleType     !== undefined) data.vehicleType     = args.vehicleType
        if (args.capacity        !== undefined) data.capacity        = parseInt(args.capacity)
        if (args.routeName       !== undefined) data.routeName       = args.routeName
        if (args.routeStops      !== undefined) data.routeStops      = args.routeStops
        if (args.driverId        !== undefined) data.driverId        = parseInt(args.driverId)
        if (args.insuranceExpiry !== undefined) data.insuranceExpiry = new Date(args.insuranceExpiry)
        if (args.fitnessExpiry   !== undefined) data.fitnessExpiry   = new Date(args.fitnessExpiry)
        if (args.permitExpiry    !== undefined) data.permitExpiry    = new Date(args.permitExpiry)
        if (args.status          !== undefined) data.status          = args.status
        const v = await prisma.vehicle.update({ where: { id: parseInt(args.id) }, data })
        return { success: true, message: `✅ Vehicle **${v.vehicleNumber}** updated successfully` }
      }

      case 'update_driver': {
        const data = {}
        if (args.firstName        !== undefined) data.firstName        = args.firstName
        if (args.lastName         !== undefined) data.lastName         = args.lastName
        if (args.phoneNumber      !== undefined) data.phoneNumber      = args.phoneNumber
        if (args.licenseNumber    !== undefined) data.licenseNumber    = args.licenseNumber
        if (args.licenseType      !== undefined) data.licenseType      = args.licenseType
        if (args.licenseExpiry    !== undefined) data.licenseExpiry    = new Date(args.licenseExpiry)
        if (args.salary           !== undefined) data.salary           = parseFloat(args.salary)
        if (args.experience       !== undefined) data.experience       = args.experience
        if (args.dateOfBirth      !== undefined) data.dateOfBirth      = new Date(args.dateOfBirth)
        if (args.address          !== undefined) data.address          = args.address
        if (args.aadhaarNumber    !== undefined) data.aadhaarNumber    = args.aadhaarNumber
        if (args.badgeNumber      !== undefined) data.badgeNumber      = args.badgeNumber
        if (args.bloodGroup       !== undefined) data.bloodGroup       = args.bloodGroup
        if (args.emergencyContact !== undefined) data.emergencyContact = args.emergencyContact
        if (args.status           !== undefined) data.status           = args.status
        const dr = await prisma.driver.update({ where: { id: parseInt(args.id) }, data })
        return { success: true, message: `✅ Driver **${dr.firstName} ${dr.lastName}** updated successfully` }
      }

      case 'update_book': {
        const book = await prisma.book.findUnique({ where: { id: parseInt(args.id) }, select: { schoolId: true, title: true } })
        if (!book) return { error: 'Book not found' }
        if (book.schoolId !== sid) return { error: 'Book does not belong to this school' }
        const data = {}
        if (args.title         !== undefined) data.title         = args.title
        if (args.author        !== undefined) data.author        = args.author
        if (args.isbn          !== undefined) data.isbn          = args.isbn
        if (args.category      !== undefined) data.category      = args.category
        if (args.publisher     !== undefined) data.publisher     = args.publisher
        if (args.edition       !== undefined) data.edition       = args.edition
        if (args.language      !== undefined) data.language      = args.language
        if (args.totalCopies   !== undefined) data.totalCopies   = parseInt(args.totalCopies)
        if (args.shelfLocation !== undefined) data.shelfLocation = args.shelfLocation
        if (args.status        !== undefined) data.status        = args.status
        const updated = await prisma.book.update({ where: { id: parseInt(args.id) }, data })
        return { success: true, message: `✅ Book **"${updated.title}"** updated successfully.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // LEAVES
      // ═══════════════════════════════════════════════════════════════════════
      case 'delete_leave': {
        const leave = await prisma.leave.findUnique({
          where: { id: parseInt(args.leaveId) },
          select: { employeeName: true, leaveType: true, schoolId: true },
        })
        if (!leave) return { error: 'Leave record not found' }
        if (leave.schoolId !== sid) return { error: 'Leave does not belong to this school' }
        await prisma.leave.delete({ where: { id: parseInt(args.leaveId) } })
        return { success: true, message: `🗑️ Leave application for **${leave.employeeName}** (${leave.leaveType}) deleted.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // HOLIDAYS
      // ═══════════════════════════════════════════════════════════════════════
      case 'delete_holiday': {
        const holiday = await prisma.holiday.findUnique({
          where: { id: parseInt(args.holidayId) },
          select: { title: true, schoolId: true },
        })
        if (!holiday) return { error: 'Holiday not found' }
        if (holiday.schoolId !== sid) return { error: 'Holiday does not belong to this school' }
        await prisma.holiday.delete({ where: { id: parseInt(args.holidayId) } })
        return { success: true, message: `🗑️ Holiday **"${holiday.title}"** has been deleted.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // FEES — list all + dues report + update
      // ═══════════════════════════════════════════════════════════════════════
      case 'list_all_fees': {
        const where = { schoolId: sid }
        if (args.status)       where.status       = args.status
        if (args.classId)      where.classId       = parseInt(args.classId)
        if (args.feeType)      where.feeType        = { contains: args.feeType, mode: 'insensitive' }
        if (args.academicYear) where.academicYear   = args.academicYear
        const fees = await prisma.fee.findMany({
          where,
          include: {
            student: { select: { firstName: true, lastName: true, rollNumber: true } },
            class:   { select: { name: true } },
          },
          orderBy: { dueDate: 'asc' },
          take: 60,
        })
        if (!fees.length) return { message: 'No fee records found matching the filters.' }
        const totalDue  = fees.reduce((s, f) => s + (f.amount || 0), 0)
        const totalPaid = fees.reduce((s, f) => s + (f.paidAmount || 0), 0)
        const pending   = totalDue - totalPaid
        const list = fees.slice(0, 25).map(f =>
          `**${f.student?.firstName} ${f.student?.lastName}** | ${f.feeType} | ₹${(f.amount||0).toLocaleString('en-IN')} | Paid: ₹${(f.paidAmount||0).toLocaleString('en-IN')} | **${f.status}** | Due: ${new Date(f.dueDate).toLocaleDateString('en-IN')} | ID: ${f.id}`
        ).join('\n')
        return {
          message:
            `📋 **Fee Records** (${fees.length} total${fees.length > 25 ? ', showing 25' : ''}):\n${list}` +
            (fees.length > 25 ? `\n...and ${fees.length - 25} more` : '') +
            `\n\n**Total Due:** ₹${totalDue.toLocaleString('en-IN')}  |  **Collected:** ₹${totalPaid.toLocaleString('en-IN')}  |  **Pending:** ₹${pending.toLocaleString('en-IN')}`,
        }
      }

      case 'get_fee_dues_report': {
        const where = { schoolId: sid, status: { in: ['pending', 'overdue', 'partial'] } }
        if (args.classId)      where.classId      = parseInt(args.classId)
        if (args.academicYear) where.academicYear  = args.academicYear
        const fees = await prisma.fee.findMany({
          where,
          include: {
            student: { select: { firstName: true, lastName: true, rollNumber: true } },
            class:   { select: { name: true } },
          },
          orderBy: { dueDate: 'asc' },
          take: 200,
        })
        if (!fees.length) return { message: '✅ No pending or overdue fees found — all students are clear!' }

        // Group by student, sum pending
        const byStudent = {}
        for (const f of fees) {
          const key = `${f.studentId}`
          if (!byStudent[key]) byStudent[key] = { name: `${f.student?.firstName} ${f.student?.lastName}`, roll: f.student?.rollNumber, class: f.class?.name, totalPending: 0, fees: [] }
          const pendingAmt = (f.amount - (f.discount || 0) - (f.paidAmount || 0))
          byStudent[key].totalPending += pendingAmt
          byStudent[key].fees.push(`${f.feeType} ₹${Math.round(pendingAmt).toLocaleString('en-IN')} (due ${new Date(f.dueDate).toLocaleDateString('en-IN')})`)
        }
        const sorted = Object.values(byStudent).sort((a, b) => b.totalPending - a.totalPending)
        const grandTotal = sorted.reduce((s, x) => s + x.totalPending, 0)
        const list = sorted.slice(0, 20).map(s =>
          `**${s.name}** (Roll: ${s.roll || 'N/A'} | ${s.class || 'N/A'}) — **₹${Math.round(s.totalPending).toLocaleString('en-IN')} pending** → ${s.fees.join(', ')}`
        ).join('\n')
        return {
          message:
            `⚠️ **Fee Dues Report** — ${sorted.length} students with pending fees:\n${list}` +
            (sorted.length > 20 ? `\n...and ${sorted.length - 20} more` : '') +
            `\n\n**Grand Total Pending: ₹${Math.round(grandTotal).toLocaleString('en-IN')}**`,
        }
      }

      case 'update_fee': {
        const fee = await prisma.fee.findUnique({
          where: { id: parseInt(args.feeId) },
          select: { schoolId: true, feeType: true },
        })
        if (!fee) return { error: 'Fee record not found' }
        if (fee.schoolId !== sid) return { error: 'Fee does not belong to this school' }
        const data = {}
        if (args.feeType       !== undefined) data.feeType       = args.feeType
        if (args.amount        !== undefined) data.amount        = parseFloat(args.amount)
        if (args.discount      !== undefined) data.discount      = parseFloat(args.discount)
        if (args.dueDate       !== undefined) data.dueDate       = new Date(args.dueDate)
        if (args.description   !== undefined) data.description   = args.description
        if (args.term          !== undefined) data.term          = args.term
        if (args.academicYear  !== undefined) data.academicYear  = args.academicYear
        if (args.status        !== undefined) data.status        = args.status
        if (args.paidAmount    !== undefined) data.paidAmount    = parseFloat(args.paidAmount)
        if (args.paymentMode   !== undefined) data.paymentMode   = args.paymentMode
        if (args.transactionId !== undefined) data.transactionId = args.transactionId
        await prisma.fee.update({ where: { id: parseInt(args.feeId) }, data })
        return { success: true, message: `✅ Fee record **#${args.feeId}** (${fee.feeType}) updated successfully.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // INCOME — update
      // ═══════════════════════════════════════════════════════════════════════
      case 'update_income': {
        const income = await prisma.income.findUnique({
          where: { id: parseInt(args.incomeId) },
          select: { schoolId: true, title: true },
        })
        if (!income) return { error: 'Income record not found' }
        if (income.schoolId !== sid) return { error: 'Income does not belong to this school' }
        const data = {}
        if (args.title        !== undefined) data.title        = args.title
        if (args.category     !== undefined) data.category     = args.category
        if (args.amount       !== undefined) data.amount       = parseFloat(args.amount)
        if (args.date         !== undefined) data.date         = new Date(args.date)
        if (args.receivedFrom !== undefined) data.receivedFrom = args.receivedFrom
        if (args.paymentMode  !== undefined) data.paymentMode  = args.paymentMode
        if (args.receiptNo    !== undefined) data.receiptNo    = args.receiptNo
        if (args.description  !== undefined) data.description  = args.description
        if (args.status       !== undefined) data.status       = args.status
        const updated = await prisma.income.update({ where: { id: parseInt(args.incomeId) }, data })
        return { success: true, message: `✅ Income **"${updated.title}"** (₹${updated.amount?.toLocaleString('en-IN')}) updated successfully.` }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // EXPENSES — update
      // ═══════════════════════════════════════════════════════════════════════
      case 'update_expense': {
        const expense = await prisma.expense.findUnique({
          where: { id: parseInt(args.expenseId) },
          select: { schoolId: true, title: true },
        })
        if (!expense) return { error: 'Expense record not found' }
        if (expense.schoolId !== sid) return { error: 'Expense does not belong to this school' }
        const data = {}
        if (args.title       !== undefined) data.title       = args.title
        if (args.category    !== undefined) data.category    = args.category
        if (args.amount      !== undefined) data.amount      = parseFloat(args.amount)
        if (args.date        !== undefined) data.date        = new Date(args.date)
        if (args.paidTo      !== undefined) data.paidTo      = args.paidTo
        if (args.paymentMode !== undefined) data.paymentMode = args.paymentMode
        if (args.receiptNo   !== undefined) data.receiptNo   = args.receiptNo
        if (args.description !== undefined) data.description = args.description
        if (args.approvedBy  !== undefined) data.approvedBy  = args.approvedBy
        if (args.status      !== undefined) data.status      = args.status
        const updated = await prisma.expense.update({ where: { id: parseInt(args.expenseId) }, data })
        return { success: true, message: `✅ Expense **"${updated.title}"** (₹${updated.amount?.toLocaleString('en-IN')}) updated successfully.` }
      }

      default:
        return executeExtendedTool3(name, args, schoolId)
    }
  } catch (err) {
    logError(`executeExtendedTool2 [${name}] error: ${err.message}`, { filename: 'chatToolsExtended2.js' })
    return { error: err.message }
  }
}
