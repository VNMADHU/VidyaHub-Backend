import { GoogleGenerativeAI } from '@google/generative-ai'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'
import { extendedToolDeclarations, executeExtendedTool } from './chatToolsExtended.js'
import { extendedToolDeclarations2 } from './chatToolsExtended2.js'
import { extendedToolDeclarations3 } from './chatToolsExtended3.js'
import { extendedToolDeclarations4 } from './chatToolsExtended4.js'
import { extendedToolDeclarations5 } from './chatToolsExtended5.js'

// ── Gemini API key resolution: DB first, then .env fallback ─────────────────
// Priority: SchoolConfig.geminiApiKey (per-school) → GEMINI_API_KEY env var (global fallback)
// Set GEMINI_API_KEY in your .env file as the global key.
// Schools can override it with their own key in Settings → Configuration.
const getGeminiKey = async (schoolId) => {
  if (schoolId) {
    const config = await prisma.schoolConfig.findUnique({
      where: { schoolId: parseInt(schoolId) },
      select: { geminiApiKey: true },
    })
    if (config?.geminiApiKey) return config.geminiApiKey
  }
  return process.env.GEMINI_API_KEY || null
}

// ── Tool definitions for Gemini function calling ─────────────────────────────
const tools = [
  {
    functionDeclarations: [
      // ── Students ──────────────────────────────────────────────────────────
      {
        name: 'list_students',
        description: 'List students with full details. Filter by class, section, gender. Search by name.',
        parameters: {
          type: 'OBJECT',
          properties: {
            search:    { type: 'STRING', description: 'Search by first or last name (optional)' },
            classId:   { type: 'NUMBER', description: 'Filter by class ID (optional)' },
            sectionId: { type: 'NUMBER', description: 'Filter by section ID (optional)' },
            gender:    { type: 'STRING', description: 'Filter by gender: male, female, other (optional)' },
          },
          required: [],
        },
      },
      {
        name: 'create_student',
        description: 'Enroll a new student. Roll number required. Call list_classes to get classId.',
        parameters: {
          type: 'OBJECT',
          properties: {
            firstName:        { type: 'STRING', description: 'Student first name' },
            lastName:         { type: 'STRING', description: 'Student last name' },
            rollNumber:       { type: 'STRING', description: 'Roll number (required, unique in class)' },
            admissionNumber:  { type: 'STRING', description: 'Admission number (optional, auto-generated if not given)' },
            gender:           { type: 'STRING', description: 'Gender: male, female, or other' },
            classId:          { type: 'NUMBER', description: 'Class ID — call list_classes to find it' },
            sectionId:        { type: 'NUMBER', description: 'Section ID (optional)' },
            dateOfBirth:      { type: 'STRING', description: 'Date of birth YYYY-MM-DD (optional)' },
            fatherName:       { type: 'STRING', description: "Father's full name (optional)" },
            fatherContact:    { type: 'STRING', description: "Father's 10-digit mobile number (optional)" },
            motherName:       { type: 'STRING', description: "Mother's full name (optional)" },
            motherContact:    { type: 'STRING', description: "Mother's 10-digit mobile number (optional)" },
            guardianName:     { type: 'STRING', description: "Guardian's full name (optional)" },
            guardianContact:  { type: 'STRING', description: "Guardian's 10-digit mobile number (optional)" },
            parentEmail:      { type: 'STRING', description: 'Parent email address (optional)' },
            address:          { type: 'STRING', description: 'Current home address (optional)' },
            permanentAddress: { type: 'STRING', description: 'Permanent address if different from current (optional)' },
            bloodGroup:       { type: 'STRING', description: 'Blood group: A+, A-, B+, B-, AB+, AB-, O+, O- (optional)' },
            category:         { type: 'STRING', description: 'Category: General, OBC, SC, ST, EWS (optional)' },
            aadhaarNumber:    { type: 'STRING', description: '12-digit Aadhaar number (optional)' },
            religion:         { type: 'STRING', description: 'Religion (optional)' },
            nationality:      { type: 'STRING', description: 'Nationality (optional, default Indian)' },
            transportMode:    { type: 'STRING', description: 'Transport mode: School bus, Auto, Walk, Private (optional)' },
            busRoute:         { type: 'STRING', description: 'Bus route number/name (optional)' },
            previousSchool:   { type: 'STRING', description: 'Previous school name for transfer students (optional)' },
            tcNumber:         { type: 'STRING', description: 'Transfer Certificate number (optional)' },
            siblingStudentId: { type: 'NUMBER', description: 'ID of a sibling already enrolled in this school (optional)' },
            siblingNames:     { type: 'STRING', description: 'Names or admission numbers of siblings in this school, comma-separated (optional)' },
            siblingRelation:  { type: 'STRING', description: 'Relation to sibling, e.g. Brother, Sister, Twin, Cousin (optional)' },
          },
          required: ['firstName', 'lastName', 'rollNumber'],
        },
      },
      {
        name: 'update_student',
        description: 'Update student details. Call list_students or search_student first to get the ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id:               { type: 'NUMBER', description: 'Student ID (required)' },
            firstName:        { type: 'STRING', description: 'New first name' },
            lastName:         { type: 'STRING', description: 'New last name' },
            rollNumber:       { type: 'STRING', description: 'New roll number' },
            gender:           { type: 'STRING', description: 'Gender: male, female, other' },
            classId:          { type: 'NUMBER', description: 'New class ID' },
            sectionId:        { type: 'NUMBER', description: 'New section ID' },
            dateOfBirth:      { type: 'STRING', description: 'New date of birth YYYY-MM-DD' },
            fatherName:       { type: 'STRING', description: "Father's full name" },
            fatherContact:    { type: 'STRING', description: "Father's 10-digit mobile number" },
            motherName:       { type: 'STRING', description: "Mother's full name" },
            motherContact:    { type: 'STRING', description: "Mother's 10-digit mobile number" },
            guardianName:     { type: 'STRING', description: "Guardian's full name" },
            guardianContact:  { type: 'STRING', description: "Guardian's 10-digit mobile number" },
            parentEmail:      { type: 'STRING', description: 'Parent email address' },
            address:          { type: 'STRING', description: 'Current home address' },
            permanentAddress: { type: 'STRING', description: 'Permanent address' },
            bloodGroup:       { type: 'STRING', description: 'Blood group: A+, A-, B+, B-, AB+, AB-, O+, O-' },
            category:         { type: 'STRING', description: 'Category: General, OBC, SC, ST, EWS' },
            aadhaarNumber:    { type: 'STRING', description: '12-digit Aadhaar number' },
            religion:         { type: 'STRING', description: 'Religion' },
            nationality:      { type: 'STRING', description: 'Nationality' },
            transportMode:    { type: 'STRING', description: 'Transport mode: School bus, Auto, Walk, Private' },
            busRoute:         { type: 'STRING', description: 'Bus route number/name' },
            previousSchool:   { type: 'STRING', description: 'Previous school name' },
            tcNumber:         { type: 'STRING', description: 'Transfer Certificate number' },
            siblingStudentId: { type: 'NUMBER', description: 'ID of a sibling already enrolled in this school' },
            siblingNames:     { type: 'STRING', description: 'Names or admission numbers of siblings in this school, comma-separated' },
            siblingRelation:  { type: 'STRING', description: 'Relation to sibling, e.g. Brother, Sister, Twin, Cousin' },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_student_report',
        description: 'Get a full individual report for a single student: attendance count, fee status, marks/grades, and basic profile.',
        parameters: {
          type: 'OBJECT',
          properties: {
            studentId: { type: 'NUMBER', description: 'Student ID. Call list_students first if you only have the name.' },
          },
          required: ['studentId'],
        },
      },
      {
        name: 'get_all_students_report',
        description: 'Get a combined summary report for ALL students in the school (or a specific class): name, class, attendance count, fee status.',
        parameters: {
          type: 'OBJECT',
          properties: {
            classId: { type: 'NUMBER', description: 'Filter by class ID (optional). If omitted, returns all students.' },
          },
          required: [],
        },
      },
      // ── Teachers ────────────────────────────────────────────────────────
      {
        name: 'list_teachers',
        description: 'Get list of all teachers in the school with their subjects and salary info',
        parameters: {
          type: 'OBJECT',
          properties: {},
          required: [],
        },
      },
      {
        name: 'create_teacher',
        description: 'Add a new teacher to the school',
        parameters: {
          type: 'OBJECT',
          properties: {
            firstName:     { type: 'STRING', description: 'Teacher first name' },
            lastName:      { type: 'STRING', description: 'Teacher last name' },
            subject:       { type: 'STRING', description: 'Subject they teach e.g. Mathematics, English' },
            phone:         { type: 'STRING', description: 'Phone number' },
            email:         { type: 'STRING', description: 'Email address' },
            salary:        { type: 'NUMBER', description: 'Monthly basic salary in rupees' },
            teacherId:     { type: 'STRING', description: 'Custom teacher ID / employee code (optional, auto-generated if not given)' },
            qualification: { type: 'STRING', description: 'Educational qualification e.g. B.Ed, M.Sc, PhD (optional)' },
            experience:    { type: 'STRING', description: 'Years of teaching experience e.g. "5 years" (optional)' },
            dateOfBirth:   { type: 'STRING', description: 'Date of birth YYYY-MM-DD (optional)' },
            gender:        { type: 'STRING', description: 'Gender: male, female, other (optional)' },
            designation:   { type: 'STRING', description: 'Designation: PRT, TGT, PGT, HOD, Vice Principal, Principal (optional)' },
            department:    { type: 'STRING', description: 'Department: Science, Commerce, Arts, etc. (optional)' },
            joiningDate:   { type: 'STRING', description: 'Date of joining YYYY-MM-DD (optional)' },
            bloodGroup:    { type: 'STRING', description: 'Blood group: A+, A-, B+, B-, AB+, AB-, O+, O- (optional)' },
            aadhaarNumber: { type: 'STRING', description: '12-digit Aadhaar number (optional)' },
            panNumber:     { type: 'STRING', description: 'PAN card number (optional)' },
            address:       { type: 'STRING', description: 'Residential address (optional)' },
          },
          required: ['firstName', 'lastName'],
        },
      },
      {
        name: 'update_teacher',
        description: 'Update an existing teacher details like subject, salary, phone, designation. Call list_teachers first to get the teacher ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id:            { type: 'NUMBER', description: 'Teacher ID (required)' },
            firstName:     { type: 'STRING', description: 'New first name' },
            lastName:      { type: 'STRING', description: 'New last name' },
            subject:       { type: 'STRING', description: 'New subject they teach' },
            phone:         { type: 'STRING', description: 'New phone number' },
            email:         { type: 'STRING', description: 'New email address' },
            salary:        { type: 'NUMBER', description: 'New monthly basic salary in rupees' },
            teacherId:     { type: 'STRING', description: 'Custom teacher ID / employee code' },
            qualification: { type: 'STRING', description: 'Educational qualification e.g. B.Ed, M.Sc, PhD' },
            experience:    { type: 'STRING', description: 'Years of teaching experience e.g. "5 years"' },
            dateOfBirth:   { type: 'STRING', description: 'Date of birth YYYY-MM-DD' },
            gender:        { type: 'STRING', description: 'Gender: male, female, other' },
            designation:   { type: 'STRING', description: 'Designation: PRT, TGT, PGT, HOD, Vice Principal, Principal' },
            department:    { type: 'STRING', description: 'Department: Science, Commerce, Arts, etc.' },
            joiningDate:   { type: 'STRING', description: 'Date of joining YYYY-MM-DD' },
            bloodGroup:    { type: 'STRING', description: 'Blood group: A+, A-, B+, B-, AB+, AB-, O+, O-' },
            aadhaarNumber: { type: 'STRING', description: '12-digit Aadhaar number' },
            panNumber:     { type: 'STRING', description: 'PAN card number' },
            address:       { type: 'STRING', description: 'Residential address' },
          },
          required: ['id'],
        },
      },
      // ── Classes ───────────────────────────────────────────────────────────
      {
        name: 'list_classes',
        description: 'Get all classes in the school with student count',
        parameters: {
          type: 'OBJECT',
          properties: {},
          required: [],
        },
      },
      // ── Homework ──────────────────────────────────────────────────────────
      {
        name: 'list_homework',
        description: 'List homework assignments, optionally filter by class',
        parameters: {
          type: 'OBJECT',
          properties: {
            classId: { type: 'NUMBER', description: 'Filter by class ID (optional)' },
          },
          required: [],
        },
      },
      {
        name: 'create_homework',
        description: 'Assign a new homework to a class. If classId is unknown, call list_classes first.',
        parameters: {
          type: 'OBJECT',
          properties: {
            classId: { type: 'NUMBER', description: 'Class ID (required — use list_classes to find it)' },
            subject: { type: 'STRING', description: 'Subject name e.g. Mathematics, Science' },
            title: { type: 'STRING', description: 'Homework title/heading' },
            description: { type: 'STRING', description: 'Detailed instructions or description' },
            dueDate: { type: 'STRING', description: 'Due date in YYYY-MM-DD format' },
            assignedBy: { type: 'STRING', description: 'Teacher name who is assigning this homework' },
          },
          required: ['classId', 'subject', 'title', 'dueDate'],
        },
      },
      {
        name: 'update_homework',
        description: 'Edit/update an existing homework assignment — change title, description, due date, subject or status. Call list_homework first to get the homework ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: { type: 'NUMBER', description: 'Homework ID (required)' },
            title: { type: 'STRING', description: 'New homework title' },
            description: { type: 'STRING', description: 'New detailed instructions or description of what students have to do' },
            subject: { type: 'STRING', description: 'New subject' },
            dueDate: { type: 'STRING', description: 'New due date in YYYY-MM-DD format' },
            assignedBy: { type: 'STRING', description: 'Teacher name' },
            status: { type: 'STRING', description: 'Status: active, completed, cancelled' },
          },
          required: ['id'],
        },
      },
      // ── Announcements ─────────────────────────────────────────────────────
      {
        name: 'list_announcements',
        description: 'List recent school announcements',
        parameters: {
          type: 'OBJECT',
          properties: {},
          required: [],
        },
      },
      {
        name: 'create_announcement',
        description: 'Publish a new school announcement',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Announcement headline/title' },
            message: { type: 'STRING', description: 'Full announcement text/body' },
            targetAudience: { type: 'STRING', description: 'Target: All, Students, Teachers, Parents (default: All)' },
          },
          required: ['title', 'message'],
        },
      },
      {
        name: 'update_announcement',
        description: 'Edit an existing announcement. Call list_announcements first to get the ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: { type: 'NUMBER', description: 'Announcement ID (required)' },
            title: { type: 'STRING', description: 'New title' },
            message: { type: 'STRING', description: 'New message body' },
            targetAudience: { type: 'STRING', description: 'All, Students, Teachers, Parents' },
          },
          required: ['id'],
        },
      },
      // ── Events ────────────────────────────────────────────────────────────
      {
        name: 'list_events',
        description: 'List school events like sports day, annual day, etc.',
        parameters: {
          type: 'OBJECT',
          properties: {},
          required: [],
        },
      },
      {
        name: 'create_event',
        description: 'Schedule a new school event',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Event name/title' },
            description: { type: 'STRING', description: 'Event details and description' },
            date: { type: 'STRING', description: 'Event date in YYYY-MM-DD format' },
            location: { type: 'STRING', description: 'Venue or location of the event' },
            category: { type: 'STRING', description: 'Category: academic, sports, cultural, other' },
          },
          required: ['title', 'date'],
        },
      },
      {
        name: 'update_event',
        description: 'Edit an existing school event. Call list_events first to get the event ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: { type: 'NUMBER', description: 'Event ID (required)' },
            title: { type: 'STRING', description: 'New event title' },
            description: { type: 'STRING', description: 'New description' },
            date: { type: 'STRING', description: 'New date in YYYY-MM-DD format' },
            location: { type: 'STRING', description: 'New venue/location' },
            category: { type: 'STRING', description: 'academic, sports, cultural, other' },
          },
          required: ['id'],
        },
      },
      // ── Exams ─────────────────────────────────────────────────────────────
      {
        name: 'list_exams',
        description: 'List scheduled exams',
        parameters: {
          type: 'OBJECT',
          properties: {},
          required: [],
        },
      },
      {
        name: 'create_exam',
        description: 'Schedule a new exam for a class',
        parameters: {
          type: 'OBJECT',
          properties: {
            name:      { type: 'STRING', description: 'Exam name e.g. Unit Test 1, Mid Term, Final Exam' },
            classId:   { type: 'NUMBER', description: 'Class ID' },
            sectionId: { type: 'NUMBER', description: 'Section ID to limit exam to one section (optional)' },
          },
          required: ['name'],
        },
      },
      {
        name: 'update_exam',
        description: 'Edit an existing exam name or class. Call list_exams first to get the exam ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id:        { type: 'NUMBER', description: 'Exam ID (required)' },
            name:      { type: 'STRING', description: 'New exam name' },
            classId:   { type: 'NUMBER', description: 'New class ID' },
            sectionId: { type: 'NUMBER', description: 'New section ID' },
          },
          required: ['id'],
        },
      },
      // ── Fees ──────────────────────────────────────────────────────────────
      {
        name: 'get_fee_summary',
        description: 'Get fee collection summary including pending and paid amounts',
        parameters: {
          type: 'OBJECT',
          properties: {
            status: { type: 'STRING', description: 'Filter by status: pending, paid, overdue, partial (optional)' },
          },
          required: [],
        },
      },
      // ── Attendance ────────────────────────────────────────────────────────
      {
        name: 'get_attendance_summary',
        description: 'Get attendance summary for today or a specific date',
        parameters: {
          type: 'OBJECT',
          properties: {
            date: { type: 'STRING', description: 'Date in YYYY-MM-DD (optional, defaults to today)' },
          },
          required: [],
        },
      },
      {
        name: 'mark_attendance',
        description: 'Mark attendance for students. Can mark all students in a class or the whole school as present/absent/late. Can also mark a single student by name.',
        parameters: {
          type: 'OBJECT',
          properties: {
            status:    { type: 'STRING', description: 'Attendance status: present, absent, or late' },
            date:      { type: 'STRING', description: 'Date in YYYY-MM-DD (optional, defaults to today)' },
            classId:   { type: 'NUMBER', description: 'Mark only students in this class (optional). If omitted, marks ALL students in the school.' },
            studentId: { type: 'NUMBER', description: 'Mark a single specific student by ID (optional)' },
          },
          required: ['status'],
        },
      },
      // ── Payroll ───────────────────────────────────────────────────────────
      {
        name: 'get_payroll_summary',
        description: 'Get payroll summary for a specific month and year',
        parameters: {
          type: 'OBJECT',
          properties: {
            month: { type: 'NUMBER', description: 'Month number 1-12' },
            year: { type: 'NUMBER', description: 'Year e.g. 2026' },
          },
          required: [],
        },
      },
      {
        name: 'generate_payroll',
        description: 'Generate / create payroll for all employees (teachers, staff, drivers) for a given month and year. Calculates HRA, PF, ESI, TDS automatically.',
        parameters: {
          type: 'OBJECT',
          properties: {
            month: { type: 'NUMBER', description: 'Month number 1-12 (e.g. 2 for February)' },
            year: { type: 'NUMBER', description: 'Year e.g. 2026' },
          },
          required: ['month', 'year'],
        },
      },
      // ── Leaves ────────────────────────────────────────────────────────────
      {
        name: 'list_leaves',
        description: 'List leave requests from teachers and staff',
        parameters: {
          type: 'OBJECT',
          properties: {
            status: { type: 'STRING', description: 'Filter: pending, approved, rejected (optional)' },
          },
          required: [],
        },
      },
      {
        name: 'update_leave',
        description: 'Update a leave request — approve/reject, change dates, or edit any field. Call list_leaves first to get the ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id:           { type: 'NUMBER', description: 'Leave ID (required)' },
            status:       { type: 'STRING', description: 'New status: approved or rejected' },
            approvedBy:   { type: 'STRING', description: 'Name of the person approving' },
            remarks:      { type: 'STRING', description: 'Remarks or reason for decision' },
            employeeName: { type: 'STRING', description: 'Updated employee name' },
            employeeType: { type: 'STRING', description: 'teacher, staff, or driver' },
            leaveType:    { type: 'STRING', description: 'sick, casual, annual, maternity, paternity, emergency, unpaid' },
            fromDate:     { type: 'STRING', description: 'Updated start date YYYY-MM-DD' },
            toDate:       { type: 'STRING', description: 'Updated end date YYYY-MM-DD' },
            days:         { type: 'NUMBER', description: 'Updated number of leave days' },
            reason:       { type: 'STRING', description: 'Updated reason for leave' },
          },
          required: ['id'],
        },
      },
      // ── Holidays ──────────────────────────────────────────────────────────
      {
        name: 'list_holidays',
        description: 'List school holidays',
        parameters: {
          type: 'OBJECT',
          properties: {},
          required: [],
        },
      },
      {
        name: 'update_holiday',
        description: 'Edit an existing holiday. Call list_holidays first to get the ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id:          { type: 'NUMBER', description: 'Holiday ID (required)' },
            title:       { type: 'STRING', description: 'New holiday name' },
            date:        { type: 'STRING', description: 'New date in YYYY-MM-DD format' },
            toDate:      { type: 'STRING', description: 'End date for multi-day holiday YYYY-MM-DD (optional)' },
            type:        { type: 'STRING', description: 'national, regional, school, religious, seasonal' },
            description: { type: 'STRING', description: 'New description' },
          },
          required: ['id'],
        },
      },
      // ── Expenses ──────────────────────────────────────────────────────────
      {
        name: 'get_expense_summary',
        description: 'Get expense summary with total amount and recent records',
        parameters: {
          type: 'OBJECT',
          properties: {},
          required: [],
        },
      },
      // ── School Info ───────────────────────────────────────────────────────
      {
        name: 'get_school_info',
        description: 'Get basic school information: name, address, contact details',
        parameters: {
          type: 'OBJECT',
          properties: {},
          required: [],
        },
      },
      // ── Extended modules (admissions, library, transport, staff, marks,
      //    income, expenses, fees-extended, sports, achievements, hostel,
      //    timetable, financial summary, payroll-paid, create-leave, create-holiday)
      ...extendedToolDeclarations,
      // ── Extended2 (search/delete students+teachers, create/bulk fees, attendance
      //    history, create class, delete ops for all modules, transport add,
      //    full expense/income listings, update sports & achievements)
      ...extendedToolDeclarations2,
      // ── Extended3 (subjects, periods, master data categories)
      ...extendedToolDeclarations3,
      // ── Extended4 (staff attendance, inventory/assets)
      ...extendedToolDeclarations4,
      // ── Extended5 (notifications, accounting, hostel CRUD, timetable CRUD,
      //    delete_book, update/delete class, transfer certificate)
      ...extendedToolDeclarations5,
    ],
  },
]

// ── Tool executor ─────────────────────────────────────────────────────────────
const executeTool = async (name, args, schoolId) => {
  const sid = parseInt(schoolId) || 1

  switch (name) {
    case 'list_students': {
      const where = { schoolId: sid }
      if (args.classId)   where.classId   = parseInt(args.classId)
      if (args.sectionId) where.sectionId = parseInt(args.sectionId)
      if (args.gender)    where.gender    = args.gender.toLowerCase()
      if (args.search) {
        where.OR = [
          { firstName: { contains: args.search, mode: 'insensitive' } },
          { lastName:  { contains: args.search, mode: 'insensitive' } },
        ]
      }
      const students = await prisma.student.findMany({
        where,
        take: 50,
        select: {
          id: true, firstName: true, lastName: true, gender: true,
          rollNumber: true, admissionNumber: true,
          class:   { select: { name: true } },
          section: { select: { name: true } },
        },
        orderBy: [{ class: { name: 'asc' } }, { firstName: 'asc' }],
      })
      return {
        count: students.length,
        students: students.map(s => ({
          id: s.id, name: `${s.firstName} ${s.lastName}`, gender: s.gender,
          rollNumber: s.rollNumber || 'N/A', admissionNumber: s.admissionNumber || 'N/A',
          class: s.class?.name, section: s.section?.name,
        }))
      }
    }

    case 'create_student': {
      // Auto-generate required fields if not provided
      const admNumber  = args.admissionNumber || `ADM-${sid}-${Date.now()}`
      const rollNum    = args.rollNumber || String(Math.floor(100000 + Math.random() * 900000))
      const namePart   = `${(args.firstName || 'student').toLowerCase().replace(/\s+/g, '')}.${(args.lastName || '').toLowerCase().replace(/\s+/g, '') || Date.now()}`
      const email      = `${namePart}@school.local`
      const student = await prisma.student.create({
        data: {
          schoolId:         sid,
          firstName:        args.firstName,
          lastName:         args.lastName || '',
          email,
          admissionNumber:  admNumber,
          rollNumber:       rollNum,
          gender:           args.gender          || 'male',
          classId:          args.classId         ? parseInt(args.classId)   : null,
          sectionId:        args.sectionId       ? parseInt(args.sectionId) : null,
          dateOfBirth:      args.dateOfBirth     ? new Date(args.dateOfBirth) : null,
          fatherName:       args.fatherName      || null,
          fatherContact:    args.fatherContact   || null,
          motherName:       args.motherName      || null,
          motherContact:    args.motherContact   || null,
          guardianName:     args.guardianName    || null,
          guardianContact:  args.guardianContact || null,
          parentEmail:      args.parentEmail     || null,
          address:          args.address         || null,
          permanentAddress: args.permanentAddress || null,
          bloodGroup:       args.bloodGroup      || null,
          category:         args.category        || null,
          aadhaarNumber:    args.aadhaarNumber   || null,
          religion:         args.religion        || null,
          nationality:      args.nationality     || null,
          transportMode:    args.transportMode   || null,
          busRoute:         args.busRoute        || null,
          previousSchool:   args.previousSchool  || null,
          tcNumber:         args.tcNumber        || null,
          siblingStudentId: args.siblingStudentId ? parseInt(args.siblingStudentId) : null,
          siblingNames:     args.siblingNames     || null,
          siblingRelation:  args.siblingRelation  || null,
        },
      })
      return { success: true, message: `✅ Student **${student.firstName} ${student.lastName}** enrolled. Admission No: **${student.admissionNumber}** | ID: ${student.id}` }
    }

    case 'update_student': {
      const data = {}
      if (args.firstName        !== undefined) data.firstName        = args.firstName
      if (args.lastName         !== undefined) data.lastName         = args.lastName
      if (args.rollNumber       !== undefined) data.rollNumber       = args.rollNumber
      if (args.gender           !== undefined) data.gender           = args.gender
      if (args.classId          !== undefined) data.classId          = parseInt(args.classId)
      if (args.sectionId        !== undefined) data.sectionId        = parseInt(args.sectionId)
      if (args.dateOfBirth      !== undefined) data.dateOfBirth      = new Date(args.dateOfBirth)
      if (args.fatherName       !== undefined) data.fatherName       = args.fatherName
      if (args.fatherContact    !== undefined) data.fatherContact    = args.fatherContact
      if (args.motherName       !== undefined) data.motherName       = args.motherName
      if (args.motherContact    !== undefined) data.motherContact    = args.motherContact
      if (args.guardianName     !== undefined) data.guardianName     = args.guardianName
      if (args.guardianContact  !== undefined) data.guardianContact  = args.guardianContact
      if (args.parentEmail      !== undefined) data.parentEmail      = args.parentEmail
      if (args.address          !== undefined) data.address          = args.address
      if (args.permanentAddress !== undefined) data.permanentAddress = args.permanentAddress
      if (args.bloodGroup       !== undefined) data.bloodGroup       = args.bloodGroup
      if (args.category         !== undefined) data.category         = args.category
      if (args.aadhaarNumber    !== undefined) data.aadhaarNumber    = args.aadhaarNumber
      if (args.religion         !== undefined) data.religion         = args.religion
      if (args.nationality      !== undefined) data.nationality      = args.nationality
      if (args.transportMode    !== undefined) data.transportMode    = args.transportMode
      if (args.busRoute         !== undefined) data.busRoute         = args.busRoute
      if (args.previousSchool   !== undefined) data.previousSchool   = args.previousSchool
      if (args.tcNumber         !== undefined) data.tcNumber         = args.tcNumber
      if (args.siblingStudentId !== undefined) data.siblingStudentId = args.siblingStudentId ? parseInt(args.siblingStudentId) : null
      if (args.siblingNames     !== undefined) data.siblingNames     = args.siblingNames
      if (args.siblingRelation  !== undefined) data.siblingRelation  = args.siblingRelation
      const s = await prisma.student.update({ where: { id: parseInt(args.id) }, data })
      return { success: true, message: `✅ Student **${s.firstName} ${s.lastName}** updated successfully` }
    }

    case 'get_student_report': {
      const student = await prisma.student.findFirst({
        where: { id: parseInt(args.studentId), schoolId: sid },
        include: {
          class: { select: { name: true } },
          section: { select: { name: true } },
          attendance: { select: { status: true }, orderBy: { date: 'desc' }, take: 100 },
          fees: { select: { feeType: true, amount: true, paidAmount: true, status: true, dueDate: true }, orderBy: { dueDate: 'desc' }, take: 10 },
          marks: {
            select: { score: true, maxScore: true, subject: true, exam: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }, take: 20,
          },
        },
      })
      if (!student) return { error: 'Student not found' }

      // Attendance stats
      const attCount = { present: 0, absent: 0, late: 0 }
      student.attendance.forEach(a => { attCount[a.status] = (attCount[a.status] || 0) + 1 })
      const totalAtt = attCount.present + attCount.absent + attCount.late
      const attPct = totalAtt > 0 ? ((attCount.present / totalAtt) * 100).toFixed(1) : 'N/A'

      // Fee stats
      const totalDue  = student.fees.reduce((s, f) => s + (f.amount || 0), 0)
      const totalPaid = student.fees.reduce((s, f) => s + (f.paidAmount || 0), 0)
      const feePending = totalDue - totalPaid

      return {
        name: `${student.firstName} ${student.lastName}`,
        class: student.class?.name || 'N/A',
        section: student.section?.name || null,
        gender: student.gender,
        parent: student.parentName || student.fatherName || 'N/A',
        parentPhone: student.parentPhone || student.fatherContact || 'N/A',
        attendance: {
          present: attCount.present, absent: attCount.absent, late: attCount.late,
          totalDays: totalAtt, percentage: `${attPct}%`,
        },
        fees: {
          totalDue: `₹${totalDue.toLocaleString('en-IN')}`,
          totalPaid: `₹${totalPaid.toLocaleString('en-IN')}`,
          pending: `₹${feePending.toLocaleString('en-IN')}`,
          records: student.fees.map(f => ({
            type: f.feeType, amount: `₹${(f.amount||0).toLocaleString('en-IN')}`,
            paid: `₹${(f.paidAmount||0).toLocaleString('en-IN')}`, status: f.status,
          })),
        },
        marks: student.marks.map(m => ({
          exam: m.exam?.name, subject: m.subject,
          score: `${m.score}/${m.maxScore}`,
          percentage: m.maxScore > 0 ? `${((m.score/m.maxScore)*100).toFixed(1)}%` : 'N/A',
        })),
      }
    }

    case 'get_all_students_report': {
      const where = { schoolId: sid }
      if (args.classId) where.classId = parseInt(args.classId)

      const students = await prisma.student.findMany({
        where,
        include: {
          class: { select: { name: true } },
          attendance: { select: { status: true }, take: 200 },
          fees: { select: { amount: true, paidAmount: true, status: true }, take: 20 },
        },
        orderBy: [{ class: { name: 'asc' } }, { firstName: 'asc' }],
      })

      const report = students.map(s => {
        const attCount = { present: 0, absent: 0, late: 0 }
        s.attendance.forEach(a => { attCount[a.status] = (attCount[a.status] || 0) + 1 })
        const totalAtt = attCount.present + attCount.absent + attCount.late
        const attPct = totalAtt > 0 ? `${((attCount.present/totalAtt)*100).toFixed(1)}%` : 'N/A'

        const feeDue  = s.fees.reduce((t, f) => t + (f.amount || 0), 0)
        const feePaid = s.fees.reduce((t, f) => t + (f.paidAmount || 0), 0)
        const feePending = feeDue - feePaid
        const feeStatus = feePending <= 0 ? 'clear' : feePending === feeDue ? 'unpaid' : 'partial'

        return {
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          class: s.class?.name || 'N/A',
          gender: s.gender,
          attendancePct: attPct,
          presentDays: attCount.present,
          absentDays: attCount.absent,
          feePending: `₹${feePending.toLocaleString('en-IN')}`,
          feeStatus,
        }
      })

      // Aggregates
      const cleared  = report.filter(r => r.feeStatus === 'clear').length
      const unpaid   = report.filter(r => r.feeStatus === 'unpaid').length
      const partial  = report.filter(r => r.feeStatus === 'partial').length

      return {
        totalStudents: students.length,
        feeOverview: { cleared, unpaid, partial },
        students: report,
      }
    }

    case 'list_teachers': {
      const teachers = await prisma.teacher.findMany({
        where: { schoolId: sid },
        select: { id: true, firstName: true, lastName: true, subject: true, phoneNumber: true, email: true, salary: true, designation: true },
        orderBy: { firstName: 'asc' },
      })
      return { count: teachers.length, teachers: teachers.map(t => ({ id: t.id, name: `${t.firstName} ${t.lastName}`, subject: t.subject, designation: t.designation, phone: t.phoneNumber, salary: t.salary ? `₹${t.salary.toLocaleString('en-IN')}` : 'Not set' })) }
    }

    case 'create_teacher': {
      const teacherId = args.teacherId || String(Math.floor(100000 + Math.random() * 900000))
      const teacher = await prisma.teacher.create({
        data: {
          schoolId:      sid,
          teacherId,
          firstName:     args.firstName,
          lastName:      args.lastName     || '',
          subject:       args.subject      || null,
          phoneNumber:   args.phone        || null,
          email:         args.email        || `${args.firstName.toLowerCase()}.${(args.lastName || 'teacher').toLowerCase()}@school.com`,
          salary:        args.salary       ? parseFloat(args.salary)    : null,
          qualification: args.qualification || null,
          experience:    args.experience   || null,
          dateOfBirth:   args.dateOfBirth  ? new Date(args.dateOfBirth) : null,
          gender:        args.gender       || null,
          designation:   args.designation  || null,
          department:    args.department   || null,
          joiningDate:   args.joiningDate  ? new Date(args.joiningDate) : null,
          bloodGroup:    args.bloodGroup   || null,
          aadhaarNumber: args.aadhaarNumber || null,
          panNumber:     args.panNumber    || null,
          address:       args.address      || null,
        },
      })
      return { success: true, message: `Teacher "${teacher.firstName} ${teacher.lastName}" added successfully with ID ${teacher.id} | Teacher ID: ${teacher.teacherId}` }
    }

    case 'update_teacher': {
      const data = {}
      if (args.firstName     !== undefined) data.firstName     = args.firstName
      if (args.lastName      !== undefined) data.lastName      = args.lastName
      if (args.subject       !== undefined) data.subject       = args.subject
      if (args.phone         !== undefined) data.phoneNumber   = args.phone
      if (args.email         !== undefined) data.email         = args.email
      if (args.salary        !== undefined) data.salary        = parseFloat(args.salary)
      if (args.teacherId     !== undefined) data.teacherId     = args.teacherId
      if (args.qualification !== undefined) data.qualification = args.qualification
      if (args.experience    !== undefined) data.experience    = args.experience
      if (args.dateOfBirth   !== undefined) data.dateOfBirth   = new Date(args.dateOfBirth)
      if (args.gender        !== undefined) data.gender        = args.gender
      if (args.designation   !== undefined) data.designation   = args.designation
      if (args.department    !== undefined) data.department    = args.department
      if (args.joiningDate   !== undefined) data.joiningDate   = new Date(args.joiningDate)
      if (args.bloodGroup    !== undefined) data.bloodGroup    = args.bloodGroup
      if (args.aadhaarNumber !== undefined) data.aadhaarNumber = args.aadhaarNumber
      if (args.panNumber     !== undefined) data.panNumber     = args.panNumber
      if (args.address       !== undefined) data.address       = args.address
      const t = await prisma.teacher.update({ where: { id: parseInt(args.id) }, data })
      return { success: true, message: `✅ Teacher "${t.firstName} ${t.lastName}" updated successfully` }
    }

    case 'list_classes': {
      const classes = await prisma.class.findMany({
        where: { schoolId: sid },
        include: { _count: { select: { students: true } } },
        orderBy: { name: 'asc' },
      })
      return { count: classes.length, classes: classes.map(c => ({ id: c.id, name: c.name, studentCount: c._count.students })) }
    }

    case 'list_homework': {
      const where = { schoolId: sid }
      if (args.classId) where.classId = parseInt(args.classId)
      const homework = await prisma.homework.findMany({
        where,
        take: 20,
        include: { class: { select: { name: true } } },
        orderBy: { dueDate: 'desc' },
      })
      return {
        count: homework.length,
        homework: homework.map(h => ({
          id: h.id, title: h.title, subject: h.subject,
          class: h.class?.name, dueDate: new Date(h.dueDate).toLocaleDateString('en-IN'),
          assignedBy: h.assignedBy, status: h.status,
        })),
      }
    }

    case 'create_homework': {
      const hw = await prisma.homework.create({
        data: {
          schoolId: sid,
          classId: parseInt(args.classId),
          subject: args.subject,
          title: args.title,
          description: args.description || '',
          dueDate: new Date(args.dueDate),
          assignedBy: args.assignedBy || '',
        },
        include: { class: { select: { name: true } } },
      })
      return { success: true, message: `Homework "${hw.title}" (${hw.subject}) assigned to ${hw.class?.name}, due ${new Date(hw.dueDate).toLocaleDateString('en-IN')}`, id: hw.id }
    }

    case 'update_homework': {
      const data = {}
      if (args.title       !== undefined) data.title       = args.title
      if (args.description !== undefined) data.description = args.description
      if (args.subject     !== undefined) data.subject     = args.subject
      if (args.dueDate     !== undefined) data.dueDate     = new Date(args.dueDate)
      if (args.assignedBy  !== undefined) data.assignedBy  = args.assignedBy
      if (args.status      !== undefined) data.status      = args.status
      const hw = await prisma.homework.update({
        where: { id: parseInt(args.id) },
        data,
        include: { class: { select: { name: true } } },
      })
      return { success: true, message: `✅ Homework "${hw.title}" updated successfully for ${hw.class?.name}` }
    }

    case 'list_announcements': {
      const anns = await prisma.announcement.findMany({
        where: { schoolId: sid },
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
      return { count: anns.length, announcements: anns.map(a => ({ id: a.id, title: a.title, message: a.message?.slice(0, 120), audience: a.targetAudience, date: new Date(a.createdAt).toLocaleDateString('en-IN') })) }
    }

    case 'create_announcement': {
      const ann = await prisma.announcement.create({
        data: {
          schoolId: sid,
          title: args.title,
          message: args.message,
          targetAudience: args.targetAudience || 'All',
        },
      })
      return { success: true, message: `Announcement "${ann.title}" published for ${ann.targetAudience}`, id: ann.id }
    }

    case 'update_announcement': {
      const data = {}
      if (args.title          !== undefined) data.title          = args.title
      if (args.message        !== undefined) data.message        = args.message
      if (args.targetAudience !== undefined) data.targetAudience = args.targetAudience
      const ann = await prisma.announcement.update({ where: { id: parseInt(args.id) }, data })
      return { success: true, message: `✅ Announcement "${ann.title}" updated successfully` }
    }

    case 'list_events': {
      const events = await prisma.event.findMany({
        where: { schoolId: sid },
        take: 15,
        orderBy: { date: 'desc' },
      })
      return { count: events.length, events: events.map(e => ({ id: e.id, title: e.title, date: new Date(e.date).toLocaleDateString('en-IN'), location: e.location, category: e.category })) }
    }

    case 'create_event': {
      const event = await prisma.event.create({
        data: {
          schoolId: sid,
          title: args.title,
          description: args.description || '',
          date: new Date(args.date),
          location: args.location || null,
          category: args.category || 'academic',
        },
      })
      return { success: true, message: `Event "${event.title}" scheduled on ${new Date(event.date).toLocaleDateString('en-IN')}`, id: event.id }
    }

    case 'update_event': {
      const data = {}
      if (args.title       !== undefined) data.title       = args.title
      if (args.description !== undefined) data.description = args.description
      if (args.date        !== undefined) data.date        = new Date(args.date)
      if (args.location    !== undefined) data.location    = args.location
      if (args.category    !== undefined) data.category    = args.category
      const ev = await prisma.event.update({ where: { id: parseInt(args.id) }, data })
      return { success: true, message: `✅ Event "${ev.title}" updated successfully` }
    }

    case 'list_exams': {
      const exams = await prisma.exam.findMany({
        where: { class: { schoolId: sid } },
        take: 20,
        include: { class: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return { count: exams.length, exams: exams.map(e => ({ id: e.id, name: e.name, class: e.class?.name })) }
    }

    case 'create_exam': {
      const exam = await prisma.exam.create({
        data: {
          name: args.name,
          classId:   args.classId   ? parseInt(args.classId)   : null,
          sectionId: args.sectionId ? parseInt(args.sectionId) : null,
        },
      })
      return { success: true, message: `Exam "${exam.name}" created successfully`, id: exam.id }
    }

    case 'update_exam': {
      const data = {}
      if (args.name      !== undefined) data.name      = args.name
      if (args.classId   !== undefined) data.classId   = parseInt(args.classId)
      if (args.sectionId !== undefined) data.sectionId = parseInt(args.sectionId)
      const exam = await prisma.exam.update({ where: { id: parseInt(args.id) }, data })
      return { success: true, message: `✅ Exam "${exam.name}" updated successfully` }
    }

    case 'get_fee_summary': {
      const where = { schoolId: sid }
      if (args.status) where.status = args.status
      const fees = await prisma.fee.findMany({ where, take: 100, select: { amount: true, paidAmount: true, status: true, feeType: true } })
      const totalDue = fees.reduce((s, f) => s + (f.amount || 0), 0)
      const totalPaid = fees.reduce((s, f) => s + (f.paidAmount || 0), 0)
      const byStatus = {}
      fees.forEach(f => { byStatus[f.status] = (byStatus[f.status] || 0) + 1 })
      return {
        totalRecords: fees.length,
        totalDue: `₹${totalDue.toLocaleString('en-IN')}`,
        totalCollected: `₹${totalPaid.toLocaleString('en-IN')}`,
        pending: `₹${(totalDue - totalPaid).toLocaleString('en-IN')}`,
        byStatus,
      }
    }

    case 'get_attendance_summary': {
      const date = args.date ? new Date(args.date) : new Date()
      date.setHours(0, 0, 0, 0)
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)

      const records = await prisma.attendance.groupBy({
        by: ['status'],
        where: { date: { gte: date, lt: nextDay }, student: { schoolId: sid } },
        _count: { status: true },
      })
      const summary = {}
      records.forEach(r => { summary[r.status] = r._count.status })
      const total = Object.values(summary).reduce((s, v) => s + v, 0)
      return {
        date: date.toLocaleDateString('en-IN'),
        present: summary.present || 0,
        absent: summary.absent || 0,
        late: summary.late || 0,
        totalRecorded: total,
      }
    }

    case 'mark_attendance': {
      const status = (args.status || 'present').toLowerCase()
      if (!['present', 'absent', 'late'].includes(status)) {
        return { error: `Invalid status "${status}". Use present, absent, or late.` }
      }

      const targetDate = args.date ? new Date(args.date) : new Date()
      targetDate.setHours(0, 0, 0, 0)

      // Fetch students to mark
      const where = { schoolId: sid }
      if (args.studentId) where.id = parseInt(args.studentId)
      else if (args.classId) where.classId = parseInt(args.classId)

      const students = await prisma.student.findMany({
        where,
        select: { id: true, firstName: true, lastName: true },
      })

      if (students.length === 0) {
        return { success: false, message: 'No students found matching the criteria.' }
      }

      // Upsert attendance for each student (handles re-marking)
      await Promise.all(
        students.map(s =>
          prisma.attendance.upsert({
            where: { studentId_date: { studentId: s.id, date: targetDate } },
            update: { status },
            create: { studentId: s.id, date: targetDate, status },
          })
        )
      )

      const dateStr = targetDate.toLocaleDateString('en-IN')
      const scope = args.studentId
        ? `student "${students[0].firstName} ${students[0].lastName}"`
        : args.classId
          ? `all students in the selected class`
          : `all ${students.length} students in the school`

      const emoji = status === 'present' ? '✅' : status === 'absent' ? '❌' : '🕐'
      return {
        success: true,
        message: `${emoji} Marked ${scope} as **${status}** for ${dateStr}`,
        markedCount: students.length,
        status,
        date: dateStr,
      }
    }

    case 'get_payroll_summary': {
      const now = new Date()
      const month = parseInt(args.month) || (now.getMonth() + 1)
      const year = parseInt(args.year) || now.getFullYear()
      const payrolls = await prisma.payroll.findMany({
        where: { schoolId: sid, month, year },
        select: { employeeName: true, basicSalary: true, grossSalary: true, netSalary: true, status: true, employeeType: true, tdsDeduction: true, pfDeduction: true },
      })
      const totalGross = payrolls.reduce((s, p) => s + (p.grossSalary || 0), 0)
      const totalNet = payrolls.reduce((s, p) => s + (p.netSalary || 0), 0)
      const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      return {
        period: `${MONTHS[month - 1]} ${year}`,
        totalEmployees: payrolls.length,
        totalGrossPay: `₹${totalGross.toLocaleString('en-IN')}`,
        totalNetPay: `₹${totalNet.toLocaleString('en-IN')}`,
        employees: payrolls.map(p => ({ name: p.employeeName, type: p.employeeType, net: `₹${(p.netSalary || 0).toLocaleString('en-IN')}`, status: p.status })),
      }
    }

    case 'generate_payroll': {
      const month = parseInt(args.month)
      const year = parseInt(args.year)
      const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

      const [teachers, staff, drivers] = await Promise.all([
        prisma.teacher.findMany({ where: { schoolId: sid, salary: { not: null, gt: 0 } } }),
        prisma.staff.findMany({ where: { schoolId: sid, salary: { not: null, gt: 0 } } }),
        prisma.driver.findMany({ where: { schoolId: sid, salary: { not: null, gt: 0 } } }),
      ])

      if (teachers.length + staff.length + drivers.length === 0) {
        return { success: false, message: 'No employees with salary found. Please set salary for teachers/staff first.' }
      }

      const buildEntry = (emp, type) => {
        const basic = emp.salary || 0
        const hra              = Math.round(basic * 0.40)
        const conveyance       = 1600
        const medicalAllowance = 1250
        const specialAllowance = 0
        const allowances       = hra + conveyance + medicalAllowance + specialAllowance
        const grossSalary      = basic + allowances
        const pfDeduction      = Math.round(basic * 0.12)
        const esiDeduction     = grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0
        let professionalTax = 0
        if (grossSalary > 15000) professionalTax = 200
        else if (grossSalary > 10000) professionalTax = 175
        else if (grossSalary > 7500) professionalTax = 150
        const annualGross   = grossSalary * 12
        const annualTaxable = Math.max(annualGross - 75000, 0)
        let annualTax = 0
        if      (annualTaxable > 2400000) annualTax = 300000 + (annualTaxable - 2400000) * 0.30
        else if (annualTaxable > 2000000) annualTax = 200000 + (annualTaxable - 2000000) * 0.25
        else if (annualTaxable > 1600000) annualTax = 120000 + (annualTaxable - 1600000) * 0.20
        else if (annualTaxable > 1200000) annualTax =  60000 + (annualTaxable - 1200000) * 0.15
        else if (annualTaxable >  800000) annualTax =  20000 + (annualTaxable -  800000) * 0.10
        else if (annualTaxable >  400000) annualTax =          (annualTaxable -  400000) * 0.05
        if (annualTaxable <= 1200000) annualTax = 0
        annualTax = Math.round(annualTax * 1.04)
        const tdsDeduction    = Math.round(annualTax / 12)
        const totalDeductions = pfDeduction + esiDeduction + professionalTax + tdsDeduction
        const netSalary       = grossSalary - totalDeductions
        const employerPf      = Math.round(basic * 0.12)
        const employerEsi     = grossSalary <= 21000 ? Math.round(grossSalary * 0.0325) : 0
        const ctc             = grossSalary + employerPf + employerEsi
        return {
          schoolId: sid, employeeType: type, employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          designation: emp.designation || emp.subject || null,
          month, year, basicSalary: basic, hra, conveyance, medicalAllowance,
          specialAllowance, allowances, grossSalary, pfDeduction, esiDeduction,
          professionalTax, tdsDeduction, otherDeductions: 0, totalDeductions,
          netSalary, employerPf, employerEsi, ctc, status: 'pending',
        }
      }

      const entries = [
        ...teachers.map(e => buildEntry(e, 'teacher')),
        ...staff.map(e => buildEntry(e, 'staff')),
        ...drivers.map(e => buildEntry(e, 'driver')),
      ]

      const results = await Promise.all(
        entries.map(entry =>
          prisma.payroll.upsert({
            where: {
              schoolId_employeeType_employeeId_month_year: {
                schoolId: entry.schoolId, employeeType: entry.employeeType,
                employeeId: entry.employeeId, month: entry.month, year: entry.year,
              },
            },
            update: {
              employeeName: entry.employeeName, designation: entry.designation,
              basicSalary: entry.basicSalary, hra: entry.hra, conveyance: entry.conveyance,
              medicalAllowance: entry.medicalAllowance, specialAllowance: entry.specialAllowance,
              allowances: entry.allowances, grossSalary: entry.grossSalary,
              pfDeduction: entry.pfDeduction, esiDeduction: entry.esiDeduction,
              professionalTax: entry.professionalTax, tdsDeduction: entry.tdsDeduction,
              totalDeductions: entry.totalDeductions, netSalary: entry.netSalary,
              employerPf: entry.employerPf, employerEsi: entry.employerEsi, ctc: entry.ctc,
            },
            create: entry,
          })
        )
      )

      const totalNet = results.reduce((s, p) => s + (p.netSalary || 0), 0)
      return {
        success: true,
        message: `✅ Payroll generated for ${MONTHS[month - 1]} ${year}`,
        totalEmployees: results.length,
        totalNetPay: `₹${totalNet.toLocaleString('en-IN')}`,
        employees: results.map(p => ({ name: p.employeeName, type: p.employeeType, net: `₹${(p.netSalary || 0).toLocaleString('en-IN')}` })),
      }
    }

    case 'list_leaves': {
      const where = { schoolId: sid }
      if (args.status) where.status = args.status
      const leaves = await prisma.leave.findMany({
        where,
        take: 20,
        orderBy: { createdAt: 'desc' },
      })
      return {
        count: leaves.length,
        leaves: leaves.map(l => ({
          id: l.id, employee: l.employeeName, type: l.leaveType,
          from: new Date(l.fromDate).toLocaleDateString('en-IN'),
          to: new Date(l.toDate).toLocaleDateString('en-IN'),
          days: l.days, status: l.status, reason: l.reason,
        })),
      }
    }

    case 'update_leave': {
      const data = {}
      if (args.status       !== undefined) data.status       = args.status
      if (args.approvedBy   !== undefined) data.approvedBy   = args.approvedBy
      if (args.remarks      !== undefined) data.remarks      = args.remarks
      if (args.employeeName !== undefined) data.employeeName = args.employeeName
      if (args.employeeType !== undefined) data.employeeType = args.employeeType
      if (args.leaveType    !== undefined) data.leaveType    = args.leaveType
      if (args.fromDate     !== undefined) data.fromDate     = new Date(args.fromDate)
      if (args.toDate       !== undefined) data.toDate       = new Date(args.toDate)
      if (args.days         !== undefined) data.days         = parseInt(args.days)
      if (args.reason       !== undefined) data.reason       = args.reason
      const leave = await prisma.leave.update({ where: { id: parseInt(args.id) }, data })
      const statusEmoji = leave.status === 'approved' ? '✅' : leave.status === 'rejected' ? '❌' : '🔄'
      return { success: true, message: `${statusEmoji} Leave request for "${leave.employeeName}" has been updated` }
    }

    case 'list_holidays': {
      const holidays = await prisma.holiday.findMany({
        where: { schoolId: sid },
        orderBy: { date: 'asc' },
      })
      return {
        count: holidays.length,
        holidays: holidays.map(h => ({
          id: h.id, name: h.title,
          date: new Date(h.date).toLocaleDateString('en-IN'),
          type: h.type,
        })),
      }
    }

    case 'update_holiday': {
      const data = {}
      if (args.title       !== undefined) data.title       = args.title
      if (args.date        !== undefined) data.date        = new Date(args.date)
      if (args.toDate      !== undefined) data.toDate      = new Date(args.toDate)
      if (args.type        !== undefined) data.type        = args.type
      if (args.description !== undefined) data.description = args.description
      const h = await prisma.holiday.update({ where: { id: parseInt(args.id) }, data })
      return { success: true, message: `✅ Holiday "${h.title}" updated successfully` }
    }

    case 'get_expense_summary': {
      const expenses = await prisma.expense.findMany({
        where: { schoolId: sid },
        take: 100,
        select: { title: true, category: true, amount: true, date: true },
        orderBy: { date: 'desc' },
      })
      const total = expenses.reduce((s, e) => s + (e.amount || 0), 0)
      const byCategory = {}
      expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + (e.amount || 0) })
      return {
        totalRecords: expenses.length,
        totalAmount: `₹${total.toLocaleString('en-IN')}`,
        byCategory,
        recent: expenses.slice(0, 5).map(e => ({ title: e.title, category: e.category, amount: `₹${(e.amount || 0).toLocaleString('en-IN')}`, date: new Date(e.date).toLocaleDateString('en-IN') })),
      }
    }

    case 'get_school_info': {
      const school = await prisma.school.findFirst({ where: { id: sid } })
      if (!school) return { error: 'School not found' }
      return { name: school.name, address: school.address, phone: school.phone, email: school.email }
    }

    default:
      // Delegate to extended module tools
      return executeExtendedTool(name, args, schoolId)
  }
}

// ── Inner: run one full chat exchange with a specific genAI instance ──────────
async function runChatWithKey(genAI, today, message, history, schoolId, image = null) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools,
    systemInstruction: `You are VidyaBot ✨, an intelligent AI assistant built into Vidya Hub — a school management system used in India.

Today is ${today}.

You can help school administrators CREATE, VIEW and EDIT records across the entire system:

- 📚 **Homework**: List, create, edit (title / description / due date / subject / status)
- 👥 **Students**: List, enroll new, edit (name / class / parent info), full individual report (attendance + fees + marks), all-students summary report
- 👨‍🏫 **Teachers**: List, add new, edit (subject / salary / phone / designation)
- 📢 **Announcements**: List, create, edit (title / message / audience)
- 🎉 **Events**: List, schedule, edit (title / date / location / category)
- 📝 **Exams**: List, schedule, edit (name / class)
- ✅ **Attendance**: View daily summary, mark all / class / individual students as present, absent, or late
- 💰 **Fees**: View collection summary, view per-student fees, record payments
- 💼 **Payroll**: Generate payroll, view summary, mark as paid
- 📋 **Leaves**: List, approve/reject, create new leave request
- 🏖️ **Holidays**: List, edit, create new holiday
- 💸 **Expenses**: View summary, add new expense
- 💰 **Income**: View summary, record new income
- 🏫 **Classes**: List all classes
- 📝 **Admissions**: List applications, register new admission, update status
- 📚 **Library**: List books, add book, issue/return books, view overdue
- 🚌 **Transport**: List vehicles, list drivers, add driver
- 👷 **Staff** (non-teaching): List, add, update staff members
- 🏆 **Achievements**: List, record student achievements
- 📊 **Marks / Results**: Record marks, get exam results, get class results
- 🏅 **Sports**: List sports, add new sport
- 🏠 **Hostel** (full CRUD): List hostels, view/create/update/delete hostels, add rooms, allot & vacate students
- 📅 **Timetable** (full CRUD): Get class timetable, add/update/delete timetable entries for any class/day/period
- 📈 **Financial Summary**: Full income vs expense vs fee overview
- 📚 **Subjects**: List, add, update, delete school subjects (with code)
- 🕐 **Periods**: List, add, update, delete school periods and breaks (with times)
- 🗂️ **Master Data**: List, add, update, delete items in any category — teacher-designations, staff-designations, fee-types, expense-categories, leave-types, book-categories, staff-departments, event-categories
- 🧑‍💼 **Staff Attendance**: View daily summary, list records by date/range/type, mark attendance (present/absent/late/half-day/on-leave), update existing records
- 📦 **Inventory / Assets**: List all assets (filter by category/status/search), add new asset, update asset details (condition/location/status/quantity), delete asset
- 🔔 **Notifications**: Send notifications by email or SMS to parents, students, or staff; list and delete notification history
- 📒 **Accounting / Ledgers**: List ledgers (by type), create new ledger, view current debit/credit balances for all ledgers
- 📒 **Accounting / Vouchers**: List vouchers (filter by type/date), create double-entry vouchers (receipt, payment, journal, contra)
- 📋 **Transfer Certificate**: Get full TC details for any student — personal info, attendance record, academic summary
- 🏫 **Classes**: List, create, rename, and delete classes

Guidelines:
- ALWAYS use tools to fetch real data — never guess or make up IDs or names
- When editing a record, first call the list tool to find the correct record ID, then call the update tool with that ID and the fields to change
- When the user says "edit", "update", "change", "fix", "correct", "update the description" etc. — use the update_ tools
- If a user points out something is missing or wrong (e.g. "the homework has no description"), immediately fetch the record and update it
- Format responses clearly with emojis and bullet points
- Respond in the same language the user writes in (English or Hindi)
- Be friendly, concise and professional
- Confirm every create/update action with a summary of what was changed`,
  })

  const geminiHistory = []
  for (const msg of history) {
    geminiHistory.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })
  }

  const chatSession = model.startChat({ history: geminiHistory })

  // Build message parts — include inline image if provided
  const msgParts = []
  if (image?.data && image?.mimeType) {
    msgParts.push({ inlineData: { data: image.data, mimeType: image.mimeType } })
  }
  msgParts.push({ text: message })

  let result = await chatSession.sendMessage(msgParts.length === 1 ? message : msgParts)
  let response = result.response

  // Function calling loop — max 60 rounds (supports bulk operations like adding 40+ students)
  let iterations = 0
  while (response.functionCalls()?.length > 0 && iterations < 60) {
    iterations++
    const calls = response.functionCalls()
    const toolResults = []

    for (const call of calls) {
      logInfo(`Executing tool: ${call.name}`, { filename: 'chatController.js', args: JSON.stringify(call.args || {}).slice(0, 120) })
      try {
        const toolResult = await executeTool(call.name, call.args || {}, schoolId)
        toolResults.push({ functionResponse: { name: call.name, response: toolResult } })
      } catch (err) {
        logError(`Tool ${call.name} error: ${err.message}`, { filename: 'chatController.js' })
        toolResults.push({ functionResponse: { name: call.name, response: { error: err.message } } })
      }
    }

    result = await chatSession.sendMessage(toolResults)
    response = result.response
  }

  return response.text()
}

// ── Main chat handler ─────────────────────────────────────────────────────────
export const chat = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const { message, history = [], image = null } = req.body

    if (!message?.trim()) return res.status(400).json({ message: 'message is required' })

    logInfo('Chat request', { filename: 'chatController.js', schoolId, message: message.slice(0, 80) })

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    // Resolve API key: school-specific DB key first, then global .env fallback
    const apiKey = await getGeminiKey(schoolId)
    if (!apiKey) {
      logError('No Gemini API key configured. Set GEMINI_API_KEY in .env or add a key in school Settings → Configuration.', { filename: 'chatController.js' })
      return res.status(500).json({ message: '⚠️ AI service is not configured. Please contact your administrator.' })
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const text = await runChatWithKey(genAI, today, message, history, schoolId, image)
      // Non-blocking: track chat API usage in SchoolConfig
      if (schoolId) {
        prisma.schoolConfig.upsert({
          where: { schoolId: parseInt(schoolId) },
          update: { totalChatCalls: { increment: 1 } },
          create: { schoolId: parseInt(schoolId), totalChatCalls: 1 },
        }).catch(() => {})
      }
      return res.json({ reply: text })
    } catch (err) {
      logError(`Gemini API error — status=${err?.status} message="${err?.message}"`, { filename: 'chatController.js' })
      const msg = (err?.message || '').toLowerCase()
      if (msg.includes('api_key_invalid') || msg.includes('api key not valid') || msg.includes('revoked')) {
        return res.status(500).json({ message: '⚠️ The Gemini API key is invalid or revoked. Please update it in Settings → Configuration.' })
      }
      if (err?.status === 429 || msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted')) {
        return res.status(503).json({ message: '⚠️ AI service is over quota. Please try again later.' })
      }
      return res.status(503).json({ message: '⚠️ AI service is temporarily unavailable. Please try again in a moment.' })
    }

  } catch (error) {
    logError(`Chat error: ${error.message}`, { filename: 'chatController.js' })
    if (error.message?.includes('API_KEY') || error.message?.includes('api key')) {
      return res.status(500).json({ message: 'AI service configuration error.' })
    }
    next(error)
  }
}
