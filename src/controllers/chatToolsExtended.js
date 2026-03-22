/**
 * chatToolsExtended.js
 *
 * Extended AI tool declarations + executors for VidyaBot.
 * Covers every module not yet handled in chatController.js:
 *   Admissions, Library, Transport, Staff, Marks/Results,
 *   Income, Expenses (create), Fees (extended), Sports,
 *   Achievements, Hostel, Timetable, Financial Summary,
 *   Payroll (mark-paid), Create Leave, Create Holiday.
 *
 * This file is imported by chatController.js — do NOT modify chatController.js tools array directly.
 */

import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'
import { executeExtendedTool2 } from './chatToolsExtended2.js'

// ── Tool declarations ─────────────────────────────────────────────────────────
export const extendedToolDeclarations = [

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMISSIONS MODULE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_admissions',
    description: 'List admission applications. Filter by status or class applying for.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status:           { type: 'STRING', description: 'pending, shortlisted, approved, rejected, enrolled' },
        applyingForClass: { type: 'STRING', description: 'Class e.g. "Class 6" (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'create_admission',
    description: 'Register a new admission application for a prospective student.',
    parameters: {
      type: 'OBJECT',
      properties: {
        applicantName:    { type: 'STRING', description: 'Full name of the applicant' },
        applyingForClass: { type: 'STRING', description: 'Class applying for e.g. "Class 1"' },
        guardianName:     { type: 'STRING', description: "Parent / guardian full name" },
        guardianPhone:    { type: 'STRING', description: 'Parent / guardian phone number' },
        gender:           { type: 'STRING', description: 'Male, Female, or Other' },
        dateOfBirth:      { type: 'STRING', description: 'YYYY-MM-DD (optional)' },
        guardianEmail:    { type: 'STRING', description: 'Parent email (optional)' },
        address:          { type: 'STRING', description: 'Home address (optional)' },
        previousSchool:   { type: 'STRING', description: 'Previous school (optional)' },
        previousClass:    { type: 'STRING', description: 'Previous class the student was in (optional)' },
        category:         { type: 'STRING', description: 'General, OBC, SC, ST, EWS (optional)' },
        academicYear:     { type: 'STRING', description: 'e.g. 2025-26 (optional)' },
        interviewDate:    { type: 'STRING', description: 'Interview date YYYY-MM-DD (optional)' },
        remarks:          { type: 'STRING', description: 'Initial notes or remarks (optional)' },
      },
      required: ['applicantName', 'applyingForClass', 'guardianName', 'guardianPhone'],
    },
  },
  {
    name: 'update_admission',
    description: 'Update admission status, interview date, or any details. Call list_admissions first to get the ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id:               { type: 'NUMBER', description: 'Admission record ID (required)' },
        status:           { type: 'STRING', description: 'pending, shortlisted, approved, rejected, enrolled' },
        interviewDate:    { type: 'STRING', description: 'Interview date YYYY-MM-DD' },
        remarks:          { type: 'STRING', description: 'Notes or remarks' },
        applicantName:    { type: 'STRING', description: 'Updated applicant full name' },
        applyingForClass: { type: 'STRING', description: 'Class applying for e.g. "Class 6"' },
        guardianName:     { type: 'STRING', description: 'Parent / guardian full name' },
        guardianPhone:    { type: 'STRING', description: 'Parent / guardian phone number' },
        guardianEmail:    { type: 'STRING', description: 'Parent / guardian email' },
        dateOfBirth:      { type: 'STRING', description: 'Date of birth YYYY-MM-DD' },
        gender:           { type: 'STRING', description: 'Male, Female, Other' },
        address:          { type: 'STRING', description: 'Home address' },
        previousSchool:   { type: 'STRING', description: 'Previous school name' },
        previousClass:    { type: 'STRING', description: 'Previous class' },
        category:         { type: 'STRING', description: 'General, OBC, SC, ST, EWS' },
        academicYear:     { type: 'STRING', description: 'e.g. 2025-26' },
      },
      required: ['id'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LIBRARY MODULE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_books',
    description: 'List all library books with availability. Can search by title / author or filter by category.',
    parameters: {
      type: 'OBJECT',
      properties: {
        search:   { type: 'STRING', description: 'Search by title or author (optional)' },
        category: { type: 'STRING', description: 'fiction, non-fiction, textbook, reference, magazine (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'add_book',
    description: 'Add a new book to the school library.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title:         { type: 'STRING', description: 'Book title' },
        author:        { type: 'STRING', description: 'Author name' },
        isbn:          { type: 'STRING', description: 'ISBN (optional)' },
        category:      { type: 'STRING', description: 'fiction, non-fiction, textbook, reference, magazine' },
        totalCopies:   { type: 'NUMBER', description: 'Number of copies (default 1)' },
        publisher:     { type: 'STRING', description: 'Publisher name (optional)' },
        edition:       { type: 'STRING', description: 'Edition e.g. "3rd Edition" (optional)' },
        language:      { type: 'STRING', description: 'Language, default English (optional)' },
        shelfLocation: { type: 'STRING', description: 'Rack / shelf e.g. "Rack A-3" (optional)' },
        status:        { type: 'STRING', description: 'available, all-issued, damaged, lost (optional)' },
      },
      required: ['title', 'author'],
    },
  },
  {
    name: 'issue_book',
    description: 'Issue a library book to a student. Call list_books and list_students first to get IDs.',
    parameters: {
      type: 'OBJECT',
      properties: {
        bookId:    { type: 'NUMBER', description: 'Book ID' },
        studentId: { type: 'NUMBER', description: 'Student ID' },
        dueDate:   { type: 'STRING', description: 'Return due date YYYY-MM-DD' },
      },
      required: ['bookId', 'studentId', 'dueDate'],
    },
  },
  {
    name: 'return_book',
    description: 'Mark a library book as returned. Call list_issued_books first to get the issue ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        issueId: { type: 'NUMBER', description: 'BookIssue record ID' },
        fine:    { type: 'NUMBER', description: 'Overdue fine amount in ₹ (optional, default 0)' },
      },
      required: ['issueId'],
    },
  },
  {
    name: 'list_issued_books',
    description: 'List currently issued or overdue library books.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', description: 'issued, returned, or overdue (defaults to issued)' },
      },
      required: [],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSPORT MODULE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_vehicles',
    description: 'List all school vehicles with route, capacity, and assigned driver.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'list_drivers',
    description: 'List all school bus / van drivers with license and contact details.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'add_driver',
    description: 'Add a new driver to the school transport team.',
    parameters: {
      type: 'OBJECT',
      properties: {
        firstName:        { type: 'STRING', description: 'First name' },
        lastName:         { type: 'STRING', description: 'Last name' },
        phoneNumber:      { type: 'STRING', description: 'Phone number' },
        licenseNumber:    { type: 'STRING', description: 'Driving license number' },
        licenseType:      { type: 'STRING', description: 'License type: LMV, HMV, HTV, HGMV (optional)' },
        licenseExpiry:    { type: 'STRING', description: 'License expiry date YYYY-MM-DD (optional)' },
        salary:           { type: 'NUMBER', description: 'Monthly salary (optional)' },
        experience:       { type: 'STRING', description: 'Years of experience (optional)' },
        dateOfBirth:      { type: 'STRING', description: 'Date of birth YYYY-MM-DD (optional)' },
        address:          { type: 'STRING', description: 'Residential address (optional)' },
        aadhaarNumber:    { type: 'STRING', description: '12-digit Aadhaar number (optional)' },
        badgeNumber:      { type: 'STRING', description: 'RTO conductor/driver badge number (optional)' },
        bloodGroup:       { type: 'STRING', description: 'Blood group: A+, A-, B+, B-, AB+, AB-, O+, O- (optional)' },
        emergencyContact: { type: 'STRING', description: 'Emergency contact number (optional)' },
      },
      required: ['firstName', 'lastName', 'phoneNumber', 'licenseNumber'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NON-TEACHING STAFF MODULE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_staff',
    description: 'List non-teaching staff: Watchman, Cleaner, Accountant, Lab Assistant, etc.',
    parameters: {
      type: 'OBJECT',
      properties: {
        designation: { type: 'STRING', description: 'Filter by designation (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'add_staff',
    description: 'Add a new non-teaching staff member.',
    parameters: {
      type: 'OBJECT',
      properties: {
        firstName:        { type: 'STRING', description: 'First name' },
        lastName:         { type: 'STRING', description: 'Last name' },
        designation:      { type: 'STRING', description: 'e.g. Watchman, Cleaner, Accountant, Lab Assistant' },
        phoneNumber:      { type: 'STRING', description: 'Phone number (optional)' },
        department:       { type: 'STRING', description: 'Office, Lab, Security, Kitchen (optional)' },
        salary:           { type: 'NUMBER', description: 'Monthly salary (optional)' },
        gender:           { type: 'STRING', description: 'male, female, other (optional)' },
        staffId:          { type: 'STRING', description: 'Staff employee code e.g. STF001 (optional)' },
        email:            { type: 'STRING', description: 'Email address (optional)' },
        dateOfBirth:      { type: 'STRING', description: 'Date of birth YYYY-MM-DD (optional)' },
        address:          { type: 'STRING', description: 'Residential address (optional)' },
        aadhaarNumber:    { type: 'STRING', description: '12-digit Aadhaar number (optional)' },
        joiningDate:      { type: 'STRING', description: 'Date of joining YYYY-MM-DD (optional)' },
        bloodGroup:       { type: 'STRING', description: 'Blood group: A+, A-, B+, B-, AB+, AB-, O+, O- (optional)' },
        emergencyContact: { type: 'STRING', description: 'Emergency contact number (optional)' },
      },
      required: ['firstName', 'lastName', 'designation'],
    },
  },
  {
    name: 'update_staff',
    description: 'Update a non-teaching staff member\'s details. Call list_staff first to get ID.',
    parameters: {
      type: 'OBJECT',
      properties: {
        id:               { type: 'NUMBER', description: 'Staff ID (required)' },
        firstName:        { type: 'STRING', description: 'New first name' },
        lastName:         { type: 'STRING', description: 'New last name' },
        staffId:          { type: 'STRING', description: 'Staff employee code' },
        designation:      { type: 'STRING', description: 'New designation' },
        department:       { type: 'STRING', description: 'New department' },
        phoneNumber:      { type: 'STRING', description: 'New phone number' },
        email:            { type: 'STRING', description: 'New email address' },
        gender:           { type: 'STRING', description: 'male, female, other' },
        dateOfBirth:      { type: 'STRING', description: 'Date of birth YYYY-MM-DD' },
        address:          { type: 'STRING', description: 'Residential address' },
        aadhaarNumber:    { type: 'STRING', description: '12-digit Aadhaar number' },
        joiningDate:      { type: 'STRING', description: 'Date of joining YYYY-MM-DD' },
        bloodGroup:       { type: 'STRING', description: 'Blood group: A+, A-, B+, B-, AB+, AB-, O+, O-' },
        emergencyContact: { type: 'STRING', description: 'Emergency contact number' },
        salary:           { type: 'NUMBER', description: 'New monthly salary' },
        status:           { type: 'STRING', description: 'active, on-leave, inactive, terminated' },
      },
      required: ['id'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKS / RESULTS MODULE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'add_marks',
    description: 'Record exam marks for a student. Call list_exams and list_students first to get IDs.',
    parameters: {
      type: 'OBJECT',
      properties: {
        studentId: { type: 'NUMBER', description: 'Student ID' },
        examId:    { type: 'NUMBER', description: 'Exam ID' },
        subject:   { type: 'STRING', description: 'Subject name' },
        score:     { type: 'NUMBER', description: 'Marks obtained' },
        maxScore:  { type: 'NUMBER', description: 'Maximum marks (default 100)' },
      },
      required: ['studentId', 'examId', 'subject', 'score'],
    },
  },
  {
    name: 'get_exam_results',
    description: 'Get all student marks / scores for a specific exam with rankings and class average.',
    parameters: {
      type: 'OBJECT',
      properties: {
        examId: { type: 'NUMBER', description: 'Exam ID. Call list_exams first.' },
      },
      required: ['examId'],
    },
  },
  {
    name: 'get_class_results',
    description: 'Get combined results for all students in a class — optionally filtered to one exam.',
    parameters: {
      type: 'OBJECT',
      properties: {
        classId: { type: 'NUMBER', description: 'Class ID. Call list_classes first.' },
        examId:  { type: 'NUMBER', description: 'Filter to one exam (optional)' },
      },
      required: ['classId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INCOME MODULE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_income_summary',
    description: 'Get school income summary: total received, breakdown by category, recent entries.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'add_income',
    description: 'Record a new income entry (donation, grant, rental, sponsorship, etc.).',
    parameters: {
      type: 'OBJECT',
      properties: {
        title:        { type: 'STRING', description: 'Income title' },
        category:     { type: 'STRING', description: 'donation, grant, rental, sponsorship, other' },
        amount:       { type: 'NUMBER', description: 'Amount in rupees' },
        date:         { type: 'STRING', description: 'Date YYYY-MM-DD' },
        receivedFrom: { type: 'STRING', description: 'Donor / source name (optional)' },
        paymentMode:  { type: 'STRING', description: 'cash, online, cheque, upi (optional)' },
        receiptNo:    { type: 'STRING', description: 'Receipt number (optional)' },
        description:  { type: 'STRING', description: 'Additional notes or details (optional)' },
        status:       { type: 'STRING', description: 'received or pending (optional, default: received)' },
      },
      required: ['title', 'category', 'amount', 'date'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPENSES — CREATE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'add_expense',
    description: 'Record a new expense entry.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title:       { type: 'STRING', description: 'Expense title' },
        category:    { type: 'STRING', description: 'maintenance, salary, supplies, transport, utility, infrastructure, events, other' },
        amount:      { type: 'NUMBER', description: 'Amount in rupees' },
        date:        { type: 'STRING', description: 'Date YYYY-MM-DD' },
        paidTo:      { type: 'STRING', description: 'Vendor / person name (optional)' },
        paymentMode: { type: 'STRING', description: 'cash, online, cheque, upi (optional)' },
        receiptNo:   { type: 'STRING', description: 'Receipt or bill number (optional)' },
        description: { type: 'STRING', description: 'Additional details (optional)' },
        approvedBy:  { type: 'STRING', description: 'Name of the approving person (optional)' },
        status:      { type: 'STRING', description: 'pending, approved, rejected (optional, default: approved)' },
      },
      required: ['title', 'category', 'amount', 'date'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FEES — EXTENDED (per-student view + payment recording)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_student_fees',
    description: 'List all fee records for a specific student with paid / pending breakdown.',
    parameters: {
      type: 'OBJECT',
      properties: {
        studentId: { type: 'NUMBER', description: 'Student ID. Call list_students first.' },
      },
      required: ['studentId'],
    },
  },
  {
    name: 'record_fee_payment',
    description: 'Record a fee payment for a student. Automatically updates status to paid / partial.',
    parameters: {
      type: 'OBJECT',
      properties: {
        feeId:         { type: 'NUMBER', description: 'Fee record ID. Call list_student_fees first.' },
        paidAmount:    { type: 'NUMBER', description: 'Amount being paid now' },
        paymentMode:   { type: 'STRING', description: 'cash, online, cheque, upi (optional)' },
        transactionId: { type: 'STRING', description: 'Transaction / receipt ID (optional)' },
      },
      required: ['feeId', 'paidAmount'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPORTS MODULE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_sports',
    description: 'List all sports activities offered by the school with coach and schedule.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'add_sport',
    description: 'Add a new sport or physical activity to the school.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name:        { type: 'STRING', description: 'Sport name e.g. Cricket, Kabaddi, Chess' },
        coachName:   { type: 'STRING', description: 'Coach name (optional)' },
        schedule:    { type: 'STRING', description: 'Schedule e.g. "Mon/Wed 4-5pm" (optional)' },
        description: { type: 'STRING', description: 'Additional details (optional)' },
      },
      required: ['name'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ACHIEVEMENTS MODULE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_achievements',
    description: 'List student achievements (academic, sports, cultural). Can filter by student.',
    parameters: {
      type: 'OBJECT',
      properties: {
        studentId: { type: 'NUMBER', description: 'Filter by student ID (optional)' },
      },
      required: [],
    },
  },
  {
    name: 'add_achievement',
    description: 'Record a new achievement for a student.',
    parameters: {
      type: 'OBJECT',
      properties: {
        studentId:       { type: 'NUMBER', description: 'Student ID' },
        title:           { type: 'STRING', description: 'Achievement title e.g. "Won District Chess Championship"' },
        category:        { type: 'STRING', description: 'academic, sports, cultural, other' },
        achievementDate: { type: 'STRING', description: 'Date YYYY-MM-DD' },
        description:     { type: 'STRING', description: 'Details about the achievement' },
      },
      required: ['studentId', 'title', 'achievementDate'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOSTEL MODULE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'list_hostels',
    description: 'List all school hostels with occupancy, room count, and warden details.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },
  {
    name: 'list_hostel_allotments',
    description: 'List current hostel room allotments — who is in which room.',
    parameters: {
      type: 'OBJECT',
      properties: {
        hostelId: { type: 'NUMBER', description: 'Filter by hostel ID (optional)' },
      },
      required: [],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMETABLE MODULE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_timetable',
    description: 'Get the class timetable for a specific class. Can filter by day.',
    parameters: {
      type: 'OBJECT',
      properties: {
        classId: { type: 'NUMBER', description: 'Class ID. Call list_classes first.' },
        day:     { type: 'STRING', description: 'Day e.g. Monday (optional — returns all days if omitted)' },
      },
      required: ['classId'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FINANCIAL OVERVIEW
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_financial_summary',
    description: 'Get a complete financial overview: income, expenses, fee collection, and net position.',
    parameters: { type: 'OBJECT', properties: {}, required: [] },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYROLL — mark paid
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'mark_payroll_paid',
    description: 'Mark payroll as paid for a month. Can target all employees or a specific type.',
    parameters: {
      type: 'OBJECT',
      properties: {
        month:        { type: 'NUMBER', description: 'Month number 1-12' },
        year:         { type: 'NUMBER', description: 'Year e.g. 2026' },
        employeeType: { type: 'STRING', description: 'teacher, staff, or driver (optional — omit for all)' },
        paymentMode:  { type: 'STRING', description: 'cash, bank transfer, cheque, upi (optional)' },
      },
      required: ['month', 'year'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEAVE — create
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'create_leave',
    description: 'Apply / register a new leave request for a teacher, staff member, or driver.',
    parameters: {
      type: 'OBJECT',
      properties: {
        employeeType: { type: 'STRING', description: 'teacher, staff, or driver' },
        employeeName: { type: 'STRING', description: 'Full name of the employee' },
        leaveType:    { type: 'STRING', description: 'sick, casual, annual, maternity, paternity, emergency, unpaid' },
        fromDate:     { type: 'STRING', description: 'Start date YYYY-MM-DD' },
        toDate:       { type: 'STRING', description: 'End date YYYY-MM-DD' },
        days:         { type: 'NUMBER', description: 'Number of leave days' },
        reason:       { type: 'STRING', description: 'Reason for leave' },
        employeeId:   { type: 'NUMBER', description: 'Employee DB ID for reference (optional)' },
        status:       { type: 'STRING', description: 'pending, approved, rejected (default: pending)' },
        approvedBy:   { type: 'STRING', description: 'Name of approving person (optional)' },
        remarks:      { type: 'STRING', description: 'Additional remarks (optional)' },
      },
      required: ['employeeType', 'employeeName', 'leaveType', 'fromDate', 'toDate', 'days', 'reason'],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOLIDAY — create
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'create_holiday',
    description: 'Add a new holiday to the school calendar.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title:       { type: 'STRING', description: 'Holiday name e.g. "Diwali", "Republic Day"' },
        date:        { type: 'STRING', description: 'Date YYYY-MM-DD' },
        toDate:      { type: 'STRING', description: 'End date for multi-day holiday YYYY-MM-DD (optional)' },
        type:        { type: 'STRING', description: 'national, regional, school, religious, seasonal' },
        description: { type: 'STRING', description: 'Additional notes (optional)' },
      },
      required: ['title', 'date'],
    },
  },
]

// ── Extended tool executor ────────────────────────────────────────────────────
export const executeExtendedTool = async (name, args, schoolId) => {
  const sid = parseInt(schoolId)
  logInfo(`[Extended] Executing tool: ${name}`, { filename: 'chatToolsExtended.js' })

  switch (name) {

    // ═══════════════════════════════════════════════════════════════════════
    // ADMISSIONS
    // ═══════════════════════════════════════════════════════════════════════
    case 'list_admissions': {
      const where = { schoolId: sid }
      if (args.status) where.status = args.status
      if (args.applyingForClass) where.applyingForClass = { contains: args.applyingForClass, mode: 'insensitive' }
      const admissions = await prisma.admission.findMany({ where, orderBy: { createdAt: 'desc' }, take: 30 })
      return {
        count: admissions.length,
        admissions: admissions.map(a => ({
          id: a.id, applicationNo: a.applicationNo, name: a.applicantName,
          applyingFor: a.applyingForClass, status: a.status, guardian: a.guardianName,
          phone: a.guardianPhone,
          interviewDate: a.interviewDate ? new Date(a.interviewDate).toLocaleDateString('en-IN') : null,
          remarks: a.remarks,
        })),
      }
    }

    case 'create_admission': {
      const year = new Date().getFullYear()
      const count = await prisma.admission.count({ where: { schoolId: sid } })
      const applicationNo = `ADM-${year}-${String(count + 1).padStart(3, '0')}`
      const adm = await prisma.admission.create({
        data: {
          schoolId: sid, applicationNo,
          applicantName:    args.applicantName,
          applyingForClass: args.applyingForClass,
          guardianName:     args.guardianName,
          guardianPhone:    args.guardianPhone,
          gender:           args.gender         || null,
          dateOfBirth:      args.dateOfBirth     ? new Date(args.dateOfBirth)     : null,
          guardianEmail:    args.guardianEmail   || null,
          address:          args.address         || null,
          previousSchool:   args.previousSchool  || null,
          previousClass:    args.previousClass   || null,
          category:         args.category        || null,
          academicYear:     args.academicYear    || '2025-26',
          interviewDate:    args.interviewDate   ? new Date(args.interviewDate)   : null,
          remarks:          args.remarks         || null,
          status: 'pending',
        },
      })
      return { success: true, message: `✅ Admission application created for **"${adm.applicantName}"** — Application No: **${adm.applicationNo}**` }
    }

    case 'update_admission': {
      const data = {}
      if (args.status           !== undefined) data.status           = args.status
      if (args.interviewDate    !== undefined) data.interviewDate    = new Date(args.interviewDate)
      if (args.remarks          !== undefined) data.remarks          = args.remarks
      if (args.applicantName    !== undefined) data.applicantName    = args.applicantName
      if (args.applyingForClass !== undefined) data.applyingForClass = args.applyingForClass
      if (args.guardianName     !== undefined) data.guardianName     = args.guardianName
      if (args.guardianPhone    !== undefined) data.guardianPhone    = args.guardianPhone
      if (args.guardianEmail    !== undefined) data.guardianEmail    = args.guardianEmail
      if (args.dateOfBirth      !== undefined) data.dateOfBirth      = new Date(args.dateOfBirth)
      if (args.gender           !== undefined) data.gender           = args.gender
      if (args.address          !== undefined) data.address          = args.address
      if (args.previousSchool   !== undefined) data.previousSchool   = args.previousSchool
      if (args.previousClass    !== undefined) data.previousClass    = args.previousClass
      if (args.category         !== undefined) data.category         = args.category
      if (args.academicYear     !== undefined) data.academicYear     = args.academicYear
      const adm = await prisma.admission.update({ where: { id: parseInt(args.id) }, data })
      const emoji = { shortlisted: '📋', approved: '✅', rejected: '❌', enrolled: '🎓', pending: '⏳' }[adm.status] || '📝'
      return { success: true, message: `${emoji} Admission for **"${adm.applicantName}"** updated successfully` }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LIBRARY
    // ═══════════════════════════════════════════════════════════════════════
    case 'list_books': {
      const where = { schoolId: sid }
      if (args.category) where.category = { contains: args.category, mode: 'insensitive' }
      if (args.search) {
        where.OR = [
          { title:  { contains: args.search, mode: 'insensitive' } },
          { author: { contains: args.search, mode: 'insensitive' } },
        ]
      }
      const books = await prisma.book.findMany({
        where, take: 30, orderBy: { title: 'asc' },
        select: { id: true, title: true, author: true, category: true, totalCopies: true, availableCopies: true, shelfLocation: true, status: true },
      })
      return {
        count: books.length,
        books: books.map(b => ({
          id: b.id, title: b.title, author: b.author, category: b.category || 'N/A',
          available: b.availableCopies, total: b.totalCopies, shelf: b.shelfLocation, status: b.status,
        })),
      }
    }

    case 'add_book': {
      const copies = args.totalCopies ? parseInt(args.totalCopies) : 1
      const book = await prisma.book.create({
        data: {
          schoolId: sid, title: args.title, author: args.author,
          isbn: args.isbn || null, category: args.category || null,
          publisher: args.publisher || null,
          edition: args.edition || null,
          language: args.language || 'English',
          totalCopies: copies, availableCopies: copies,
          shelfLocation: args.shelfLocation || null,
          status: args.status || 'available',
        },
      })
      return { success: true, message: `📚 Book **"${book.title}"** by ${book.author} added (${copies} cop${copies > 1 ? 'ies' : 'y'})` }
    }

    case 'issue_book': {
      const book = await prisma.book.findFirst({ where: { id: parseInt(args.bookId), schoolId: sid } })
      if (!book) return { error: 'Book not found' }
      if (book.availableCopies < 1) return { error: `No available copies of "${book.title}" — all issued` }
      const issue = await prisma.bookIssue.create({
        data: { bookId: parseInt(args.bookId), studentId: parseInt(args.studentId), dueDate: new Date(args.dueDate), status: 'issued' },
        include: { student: { select: { firstName: true, lastName: true } } },
      })
      await prisma.book.update({ where: { id: parseInt(args.bookId) }, data: { availableCopies: book.availableCopies - 1 } })
      return { success: true, message: `📖 **"${book.title}"** issued to ${issue.student.firstName} ${issue.student.lastName} — due ${new Date(args.dueDate).toLocaleDateString('en-IN')}` }
    }

    case 'return_book': {
      const issue = await prisma.bookIssue.findFirst({
        where: { id: parseInt(args.issueId) },
        include: { book: true, student: { select: { firstName: true, lastName: true } } },
      })
      if (!issue) return { error: 'Issue record not found' }
      const fine = args.fine ? parseFloat(args.fine) : 0
      await prisma.bookIssue.update({ where: { id: parseInt(args.issueId) }, data: { status: 'returned', returnDate: new Date(), fine } })
      await prisma.book.update({ where: { id: issue.bookId }, data: { availableCopies: { increment: 1 } } })
      return { success: true, message: `✅ **"${issue.book.title}"** returned by ${issue.student.firstName} ${issue.student.lastName}${fine > 0 ? ` — Fine: ₹${fine}` : ''}` }
    }

    case 'list_issued_books': {
      const status = args.status || 'issued'
      const issues = await prisma.bookIssue.findMany({
        where: { status, book: { schoolId: sid } },
        take: 30, orderBy: { dueDate: 'asc' },
        include: { book: { select: { title: true } }, student: { select: { firstName: true, lastName: true } } },
      })
      const today = new Date()
      return {
        count: issues.length,
        issues: issues.map(i => ({
          id: i.id, book: i.book.title,
          student: `${i.student.firstName} ${i.student.lastName}`,
          issueDate: new Date(i.issueDate).toLocaleDateString('en-IN'),
          dueDate:   new Date(i.dueDate).toLocaleDateString('en-IN'),
          status: i.status,
          overdue: i.status === 'issued' && new Date(i.dueDate) < today,
        })),
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSPORT
    // ═══════════════════════════════════════════════════════════════════════
    case 'list_vehicles': {
      const vehicles = await prisma.vehicle.findMany({
        where: { schoolId: sid }, orderBy: { vehicleNumber: 'asc' },
        include: { driver: { select: { firstName: true, lastName: true, phoneNumber: true } } },
      })
      return {
        count: vehicles.length,
        vehicles: vehicles.map(v => ({
          id: v.id, number: v.vehicleNumber, type: v.vehicleType, capacity: v.capacity,
          route: v.routeName, stops: v.routeStops, status: v.status,
          driver: v.driver ? `${v.driver.firstName} ${v.driver.lastName} (${v.driver.phoneNumber})` : 'Not assigned',
        })),
      }
    }

    case 'list_drivers': {
      const drivers = await prisma.driver.findMany({ where: { schoolId: sid }, orderBy: { firstName: 'asc' } })
      return {
        count: drivers.length,
        drivers: drivers.map(d => ({
          id: d.id, name: `${d.firstName} ${d.lastName}`, phone: d.phoneNumber,
          license: d.licenseNumber, experience: d.experience, status: d.status,
          licenseExpiry: d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString('en-IN') : 'N/A',
          salary: d.salary ? `₹${d.salary.toLocaleString('en-IN')}` : 'Not set',
        })),
      }
    }

    case 'add_driver': {
      const driver = await prisma.driver.create({
        data: {
          schoolId: sid, firstName: args.firstName, lastName: args.lastName,
          phoneNumber: args.phoneNumber, licenseNumber: args.licenseNumber,
          licenseType:      args.licenseType      || null,
          licenseExpiry:    args.licenseExpiry    ? new Date(args.licenseExpiry)    : null,
          salary:           args.salary           ? parseFloat(args.salary)         : null,
          experience:       args.experience       || null,
          dateOfBirth:      args.dateOfBirth      ? new Date(args.dateOfBirth)      : null,
          address:          args.address          || null,
          aadhaarNumber:    args.aadhaarNumber    || null,
          badgeNumber:      args.badgeNumber      || null,
          bloodGroup:       args.bloodGroup       || null,
          emergencyContact: args.emergencyContact || null,
        },
      })
      return { success: true, message: `🚌 Driver **${driver.firstName} ${driver.lastName}** added to the transport team` }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // NON-TEACHING STAFF
    // ═══════════════════════════════════════════════════════════════════════
    case 'list_staff': {
      const where = { schoolId: sid }
      if (args.designation) where.designation = { contains: args.designation, mode: 'insensitive' }
      const staff = await prisma.staff.findMany({ where, orderBy: { firstName: 'asc' } })
      return {
        count: staff.length,
        staff: staff.map(s => ({
          id: s.id, name: `${s.firstName} ${s.lastName}`, designation: s.designation,
          department: s.department, phone: s.phoneNumber, status: s.status,
          salary: s.salary ? `₹${s.salary.toLocaleString('en-IN')}` : 'Not set',
        })),
      }
    }

    case 'add_staff': {
      const member = await prisma.staff.create({
        data: {
          schoolId: sid, firstName: args.firstName, lastName: args.lastName,
          designation: args.designation, phoneNumber: args.phoneNumber || null,
          department:       args.department      || null,
          salary:           args.salary          ? parseFloat(args.salary) : null,
          gender:           args.gender          || null,
          staffId:          args.staffId         || null,
          email:            args.email           || null,
          dateOfBirth:      args.dateOfBirth     ? new Date(args.dateOfBirth)  : null,
          address:          args.address         || null,
          aadhaarNumber:    args.aadhaarNumber   || null,
          joiningDate:      args.joiningDate     ? new Date(args.joiningDate)  : null,
          bloodGroup:       args.bloodGroup      || null,
          emergencyContact: args.emergencyContact || null,
        },
      })
      return { success: true, message: `✅ **${member.firstName} ${member.lastName}** (${member.designation}) added to staff` }
    }

    case 'update_staff': {
      const data = {}
      if (args.firstName        !== undefined) data.firstName        = args.firstName
      if (args.lastName         !== undefined) data.lastName         = args.lastName
      if (args.staffId          !== undefined) data.staffId          = args.staffId
      if (args.designation      !== undefined) data.designation      = args.designation
      if (args.department       !== undefined) data.department       = args.department
      if (args.phoneNumber      !== undefined) data.phoneNumber      = args.phoneNumber
      if (args.email            !== undefined) data.email            = args.email
      if (args.gender           !== undefined) data.gender           = args.gender
      if (args.dateOfBirth      !== undefined) data.dateOfBirth      = new Date(args.dateOfBirth)
      if (args.address          !== undefined) data.address          = args.address
      if (args.aadhaarNumber    !== undefined) data.aadhaarNumber    = args.aadhaarNumber
      if (args.joiningDate      !== undefined) data.joiningDate      = new Date(args.joiningDate)
      if (args.bloodGroup       !== undefined) data.bloodGroup       = args.bloodGroup
      if (args.emergencyContact !== undefined) data.emergencyContact = args.emergencyContact
      if (args.salary           !== undefined) data.salary           = parseFloat(args.salary)
      if (args.status           !== undefined) data.status           = args.status
      const s = await prisma.staff.update({ where: { id: parseInt(args.id) }, data })
      return { success: true, message: `✅ Staff member **${s.firstName} ${s.lastName}** updated successfully` }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MARKS / RESULTS
    // ═══════════════════════════════════════════════════════════════════════
    case 'add_marks': {
      const maxScore = args.maxScore ? parseFloat(args.maxScore) : 100
      const mark = await prisma.mark.upsert({
        where: { studentId_examId_subject: { studentId: parseInt(args.studentId), examId: parseInt(args.examId), subject: args.subject } },
        update: { score: parseFloat(args.score), maxScore },
        create: { studentId: parseInt(args.studentId), examId: parseInt(args.examId), subject: args.subject, score: parseFloat(args.score), maxScore },
        include: { student: { select: { firstName: true, lastName: true } }, exam: { select: { name: true } } },
      })
      return { success: true, message: `✅ Marks recorded: **${mark.student.firstName} ${mark.student.lastName}** — ${mark.subject}: ${mark.score}/${mark.maxScore} in ${mark.exam.name}` }
    }

    case 'get_exam_results': {
      const marks = await prisma.mark.findMany({
        where: { examId: parseInt(args.examId) },
        include: { student: { select: { firstName: true, lastName: true, class: { select: { name: true } } } }, exam: { select: { name: true } } },
        orderBy: { score: 'desc' },
      })
      if (!marks.length) return { message: 'No marks recorded for this exam yet' }
      const subjects = [...new Set(marks.map(m => m.subject))]
      const avg = marks.reduce((s, m) => s + (m.maxScore > 0 ? (m.score / m.maxScore) * 100 : 0), 0) / marks.length
      return {
        exam: marks[0].exam.name, totalRecords: marks.length, subjects,
        classAverage: `${avg.toFixed(1)}%`,
        results: marks.map(m => ({
          student: `${m.student.firstName} ${m.student.lastName}`, class: m.student.class?.name,
          subject: m.subject, score: `${m.score}/${m.maxScore}`,
          percentage: `${((m.score / m.maxScore) * 100).toFixed(1)}%`,
        })),
      }
    }

    case 'get_class_results': {
      const where = { student: { classId: parseInt(args.classId) } }
      if (args.examId) where.examId = parseInt(args.examId)
      const marks = await prisma.mark.findMany({
        where,
        include: { student: { select: { firstName: true, lastName: true } }, exam: { select: { name: true } } },
        orderBy: [{ student: { firstName: 'asc' } }, { subject: 'asc' }],
      })
      if (!marks.length) return { message: 'No marks found for this class' }
      const byStudent = {}
      marks.forEach(m => {
        const key = `${m.student.firstName} ${m.student.lastName}`
        if (!byStudent[key]) byStudent[key] = { name: key, subjects: [], totalScore: 0, totalMax: 0 }
        byStudent[key].subjects.push({ exam: m.exam.name, subject: m.subject, score: m.score, max: m.maxScore })
        byStudent[key].totalScore += m.score
        byStudent[key].totalMax   += m.maxScore
      })
      return {
        totalStudents: Object.keys(byStudent).length,
        results: Object.values(byStudent).map(r => ({
          ...r,
          overall: r.totalMax > 0 ? `${((r.totalScore / r.totalMax) * 100).toFixed(1)}%` : 'N/A',
        })),
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // INCOME
    // ═══════════════════════════════════════════════════════════════════════
    case 'get_income_summary': {
      const incomes = await prisma.income.findMany({
        where: { schoolId: sid }, take: 100,
        select: { title: true, category: true, amount: true, date: true, receivedFrom: true },
        orderBy: { date: 'desc' },
      })
      const total = incomes.reduce((s, i) => s + (i.amount || 0), 0)
      const byCategory = {}
      incomes.forEach(i => { byCategory[i.category] = (byCategory[i.category] || 0) + i.amount })
      return {
        totalRecords: incomes.length,
        totalAmount: `₹${total.toLocaleString('en-IN')}`,
        byCategory,
        recent: incomes.slice(0, 5).map(i => ({
          title: i.title, category: i.category,
          amount: `₹${i.amount.toLocaleString('en-IN')}`,
          from: i.receivedFrom, date: new Date(i.date).toLocaleDateString('en-IN'),
        })),
      }
    }

    case 'add_income': {
      await prisma.income.create({
        data: {
          schoolId: sid, title: args.title, category: args.category,
          amount: parseFloat(args.amount), date: new Date(args.date),
          receivedFrom: args.receivedFrom || null,
          paymentMode:  args.paymentMode  || null,
          receiptNo:    args.receiptNo    || null,
          description:  args.description  || null,
          status:       args.status       || 'received',
        },
      })
      return { success: true, message: `💰 Income **₹${parseFloat(args.amount).toLocaleString('en-IN')}** (${args.category}) recorded from ${args.receivedFrom || args.title}` }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPENSES — CREATE
    // ═══════════════════════════════════════════════════════════════════════
    case 'add_expense': {
      await prisma.expense.create({
        data: {
          schoolId: sid, title: args.title, category: args.category,
          amount: parseFloat(args.amount), date: new Date(args.date),
          paidTo:      args.paidTo      || null,
          paymentMode: args.paymentMode || null,
          receiptNo:   args.receiptNo   || null,
          description: args.description || null,
          approvedBy:  args.approvedBy  || null,
          status:      args.status      || 'approved',
        },
      })
      return { success: true, message: `💸 Expense **₹${parseFloat(args.amount).toLocaleString('en-IN')}** (${args.category}) recorded for "${args.title}"` }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FEES — EXTENDED
    // ═══════════════════════════════════════════════════════════════════════
    case 'list_student_fees': {
      const fees = await prisma.fee.findMany({
        where: { studentId: parseInt(args.studentId), schoolId: sid },
        include: { student: { select: { firstName: true, lastName: true } } },
        orderBy: { dueDate: 'desc' },
      })
      if (!fees.length) return { message: 'No fee records found for this student' }
      const totalDue  = fees.reduce((s, f) => s + (f.amount    || 0), 0)
      const totalPaid = fees.reduce((s, f) => s + (f.paidAmount || 0), 0)
      return {
        student: `${fees[0].student.firstName} ${fees[0].student.lastName}`,
        totalDue:  `₹${totalDue.toLocaleString('en-IN')}`,
        totalPaid: `₹${totalPaid.toLocaleString('en-IN')}`,
        pending:   `₹${(totalDue - totalPaid).toLocaleString('en-IN')}`,
        fees: fees.map(f => ({
          id: f.id, type: f.feeType,
          amount: `₹${(f.amount||0).toLocaleString('en-IN')}`,
          paid:   `₹${(f.paidAmount||0).toLocaleString('en-IN')}`,
          status: f.status, due: new Date(f.dueDate).toLocaleDateString('en-IN'),
        })),
      }
    }

    case 'record_fee_payment': {
      const fee = await prisma.fee.findFirst({ where: { id: parseInt(args.feeId), schoolId: sid } })
      if (!fee) return { error: 'Fee record not found' }
      const newPaid  = (fee.paidAmount || 0) + parseFloat(args.paidAmount)
      const newStatus = newPaid >= fee.amount ? 'paid' : newPaid > 0 ? 'partial' : 'pending'
      const updated = await prisma.fee.update({
        where: { id: parseInt(args.feeId) },
        data: { paidAmount: newPaid, status: newStatus, paidDate: new Date(), paymentMode: args.paymentMode || null, transactionId: args.transactionId || null },
        include: { student: { select: { firstName: true, lastName: true } } },
      })
      const emoji = newStatus === 'paid' ? '✅' : '🔄'
      return { success: true, message: `${emoji} Payment of **₹${parseFloat(args.paidAmount).toLocaleString('en-IN')}** recorded for ${updated.student.firstName} ${updated.student.lastName} — Fee status: **${newStatus}**` }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SPORTS
    // ═══════════════════════════════════════════════════════════════════════
    case 'list_sports': {
      const sports = await prisma.sport.findMany({ where: { schoolId: sid }, orderBy: { name: 'asc' } })
      return {
        count: sports.length,
        sports: sports.map(s => ({ id: s.id, name: s.name, coach: s.coachName, schedule: s.schedule, description: s.description })),
      }
    }

    case 'add_sport': {
      const sport = await prisma.sport.create({
        data: { schoolId: sid, name: args.name, coachName: args.coachName || '', schedule: args.schedule || '', description: args.description || '' },
      })
      return { success: true, message: `🏅 Sport **${sport.name}** added to the school programme` }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ACHIEVEMENTS
    // ═══════════════════════════════════════════════════════════════════════
    case 'list_achievements': {
      const where = { student: { schoolId: sid } }
      if (args.studentId) where.studentId = parseInt(args.studentId)
      const list = await prisma.achievement.findMany({
        where, take: 30, orderBy: { achievementDate: 'desc' },
        include: { student: { select: { firstName: true, lastName: true, class: { select: { name: true } } } } },
      })
      return {
        count: list.length,
        achievements: list.map(a => ({
          id: a.id, student: `${a.student.firstName} ${a.student.lastName}`,
          class: a.student.class?.name, title: a.title, category: a.category,
          date: new Date(a.achievementDate).toLocaleDateString('en-IN'), description: a.description,
        })),
      }
    }

    case 'add_achievement': {
      const student = await prisma.student.findFirst({ where: { id: parseInt(args.studentId), schoolId: sid }, select: { firstName: true, lastName: true } })
      if (!student) return { error: 'Student not found' }
      await prisma.achievement.create({
        data: {
          studentId: parseInt(args.studentId), title: args.title,
          category: args.category || 'other', achievementDate: new Date(args.achievementDate),
          description: args.description || '',
        },
      })
      return { success: true, message: `🏆 Achievement **"${args.title}"** recorded for ${student.firstName} ${student.lastName}` }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HOSTEL
    // ═══════════════════════════════════════════════════════════════════════
    case 'list_hostels': {
      const hostels = await prisma.hostel.findMany({
        where: { schoolId: sid },
        include: { _count: { select: { rooms: true, allotments: { where: { status: 'active' } } } } },
        orderBy: { name: 'asc' },
      })
      return {
        count: hostels.length,
        hostels: hostels.map(h => ({
          id: h.id, name: h.name, type: h.type,
          capacity: h.totalCapacity, rooms: h._count.rooms,
          occupied: h._count.allotments, warden: h.wardenName,
          wardenPhone: h.wardenPhone, status: h.status,
        })),
      }
    }

    case 'list_hostel_allotments': {
      const where = { schoolId: sid, status: 'active' }
      if (args.hostelId) where.hostelId = parseInt(args.hostelId)
      const allotments = await prisma.hostelAllotment.findMany({
        where, orderBy: { studentName: 'asc' },
        include: { hostel: { select: { name: true } }, room: { select: { roomNumber: true, floor: true } } },
      })
      return {
        count: allotments.length,
        allotments: allotments.map(a => ({
          id: a.id, student: a.studentName, admissionNo: a.admissionNumber,
          hostel: a.hostel.name, room: a.room.roomNumber, floor: a.room.floor,
          allotmentDate: new Date(a.allotmentDate).toLocaleDateString('en-IN'),
          roomFee: a.roomFee ? `₹${a.roomFee.toLocaleString('en-IN')}` : 'N/A',
          messFee: a.messFee ? `₹${a.messFee.toLocaleString('en-IN')}` : 'N/A',
        })),
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TIMETABLE
    // ═══════════════════════════════════════════════════════════════════════
    case 'get_timetable': {
      const where = { classId: parseInt(args.classId) }
      if (args.day) where.day = args.day
      const entries = await prisma.timetable.findMany({
        where, orderBy: [{ day: 'asc' }, { periodId: 'asc' }],
        include: { class: { select: { name: true } } },
      })
      if (!entries.length) return { message: 'No timetable found for this class' }
      const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const byDay = {}
      entries.forEach(e => {
        if (!byDay[e.day]) byDay[e.day] = []
        byDay[e.day].push({ period: e.periodId, subject: e.subject, teacher: e.teacher })
      })
      return {
        class: entries[0].class.name,
        timetable: DAYS.filter(d => byDay[d]).map(d => ({ day: d, periods: byDay[d] })),
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FINANCIAL SUMMARY
    // ═══════════════════════════════════════════════════════════════════════
    case 'get_financial_summary': {
      const [incomes, expenses, fees] = await Promise.all([
        prisma.income.findMany({ where: { schoolId: sid }, select: { amount: true } }),
        prisma.expense.findMany({ where: { schoolId: sid }, select: { amount: true } }),
        prisma.fee.findMany({ where: { schoolId: sid }, select: { amount: true, paidAmount: true, status: true } }),
      ])
      const totalIncome  = incomes.reduce((s, i) => s + (i.amount || 0), 0)
      const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0)
      const feeCharged   = fees.reduce((s, f) => s + (f.amount     || 0), 0)
      const feeCollected = fees.reduce((s, f) => s + (f.paidAmount  || 0), 0)
      const feePending   = feeCharged - feeCollected
      const byFeeStatus  = {}
      fees.forEach(f => { byFeeStatus[f.status] = (byFeeStatus[f.status] || 0) + 1 })
      const netPosition  = totalIncome + feeCollected - totalExpense
      return {
        income:       `₹${totalIncome.toLocaleString('en-IN')}`,
        feeCharged:   `₹${feeCharged.toLocaleString('en-IN')}`,
        feeCollected: `₹${feeCollected.toLocaleString('en-IN')}`,
        feePending:   `₹${feePending.toLocaleString('en-IN')}`,
        totalExpense: `₹${totalExpense.toLocaleString('en-IN')}`,
        netPosition:  `₹${netPosition.toLocaleString('en-IN')} ${netPosition >= 0 ? '📈 surplus' : '📉 deficit'}`,
        feeStatus: byFeeStatus,
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PAYROLL — mark paid
    // ═══════════════════════════════════════════════════════════════════════
    case 'mark_payroll_paid': {
      const where = { schoolId: sid, month: parseInt(args.month), year: parseInt(args.year) }
      if (args.employeeType) where.employeeType = args.employeeType
      const data = { status: 'paid', paymentDate: new Date() }
      if (args.paymentMode) data.paymentMode = args.paymentMode
      const result = await prisma.payroll.updateMany({ where, data })
      const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const scope = args.employeeType ? `${args.employeeType}s` : 'all employees'
      return { success: true, message: `✅ Payroll marked as **paid** for ${scope} — ${MONTHS[parseInt(args.month) - 1]} ${args.year} (${result.count} record${result.count !== 1 ? 's' : ''} updated)` }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // LEAVE — create
    // ═══════════════════════════════════════════════════════════════════════
    case 'create_leave': {
      const leave = await prisma.leave.create({
        data: {
          schoolId: sid, employeeType: args.employeeType, employeeName: args.employeeName,
          leaveType: args.leaveType, fromDate: new Date(args.fromDate), toDate: new Date(args.toDate),
          days: parseInt(args.days), reason: args.reason,
          status:     args.status     || 'pending',
          employeeId: args.employeeId ? parseInt(args.employeeId) : null,
          approvedBy: args.approvedBy || null,
          remarks:    args.remarks    || null,
        },
      })
      return { success: true, message: `📋 Leave request submitted for **${leave.employeeName}** — ${leave.leaveType} leave, ${leave.days} day(s) from ${new Date(args.fromDate).toLocaleDateString('en-IN')}` }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // HOLIDAY — create
    // ═══════════════════════════════════════════════════════════════════════
    case 'create_holiday': {
      const holiday = await prisma.holiday.create({
        data: {
          schoolId: sid, title: args.title, date: new Date(args.date),
          toDate: args.toDate ? new Date(args.toDate) : null,
          type: args.type || 'school', description: args.description || null,
        },
      })
      return { success: true, message: `🏖️ Holiday **"${holiday.title}"** added on ${new Date(args.date).toLocaleDateString('en-IN')}` }
    }

    default:
      return executeExtendedTool2(name, args, schoolId)
  }
}
