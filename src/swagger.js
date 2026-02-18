import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Vidya Hub API',
      version: '1.0.0',
      description:
        'REST API for **Vidya Hub** — an all-in-one school management system.\n\n' +
        'Covers authentication, student & teacher management, classes, exams, ' +
        'marks, attendance, fees, events, announcements, achievements, sports, ' +
        'and a student / teacher portal.',
      contact: {
        name: 'Vidya Hub Team',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Local development',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Login, register & OTP' },
      { name: 'Portal', description: 'Student / teacher portal (no password)' },
      { name: 'Schools', description: 'School CRUD' },
      { name: 'Students', description: 'Student CRUD' },
      { name: 'Teachers', description: 'Teacher CRUD' },
      { name: 'Classes', description: 'Class CRUD' },
      { name: 'Sections', description: 'Section CRUD' },
      { name: 'Exams', description: 'Exam CRUD' },
      { name: 'Marks', description: 'Marks / grades CRUD + report' },
      { name: 'Attendance', description: 'Attendance CRUD + summary' },
      { name: 'Fees', description: 'Fee management & payments' },
      { name: 'Events', description: 'School event CRUD' },
      { name: 'Announcements', description: 'Announcement CRUD' },
      { name: 'Achievements', description: 'Student achievement CRUD' },
      { name: 'Sports', description: 'Sports CRUD' },
      { name: 'Health', description: 'Service health check' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter the JWT token obtained from POST /api/auth/login',
        },
      },

      // ── Re-usable schemas ──────────────────────────────────
      schemas: {
        // ── Auth ─────────────────────────────────────────────
        LoginRequest: {
          type: 'object',
          required: ['email', 'password', 'role'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@vidyahub.edu' },
            password: { type: 'string', minLength: 6, example: 'password123' },
            role: { type: 'string', example: 'school-admin' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Login successful' },
            user: { $ref: '#/components/schemas/UserSummary' },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'schoolName'],
          properties: {
            email: { type: 'string', format: 'email', example: 'newadmin@school.com' },
            password: { type: 'string', minLength: 8, example: 'securePass1' },
            schoolName: { type: 'string', minLength: 2, example: 'Green Valley School' },
          },
        },
        RegisterResponse: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Registration successful' },
            user: { $ref: '#/components/schemas/UserSummary' },
          },
        },
        OtpRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@school.com' },
          },
        },
        UserSummary: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', example: 'admin@vidyahub.edu' },
            role: { type: 'string', example: 'school-admin' },
            schoolId: { type: 'integer', example: 1 },
          },
        },

        // ── School ───────────────────────────────────────────
        School: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            address: { type: 'string' },
            contact: { type: 'string' },
            principal: { type: 'string' },
            boardType: { type: 'string', enum: ['CBSE', 'ICSE', 'State', 'University'] },
            logo: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['pending', 'active', 'blocked'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        SchoolInput: {
          type: 'object',
          required: ['name', 'address', 'contact', 'principal', 'boardType'],
          properties: {
            name: { type: 'string', minLength: 2, example: 'Sunrise Academy' },
            address: { type: 'string', minLength: 2, example: '123 Main Street, Bengaluru' },
            contact: { type: 'string', pattern: '^[6-9]\\d{9}$', example: '9876543210' },
            principal: { type: 'string', minLength: 2, example: 'Dr. Sharma' },
            boardType: { type: 'string', enum: ['CBSE', 'ICSE', 'State', 'University'], example: 'CBSE' },
          },
        },

        // ── Student ──────────────────────────────────────────
        Student: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            schoolId: { type: 'integer' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            dateOfBirth: { type: 'string', format: 'date-time', nullable: true },
            gender: { type: 'string', enum: ['male', 'female', 'other'], nullable: true },
            admissionNumber: { type: 'string' },
            rollNumber: { type: 'string', nullable: true },
            profilePic: { type: 'string', nullable: true },
            classId: { type: 'integer', nullable: true },
            sectionId: { type: 'integer', nullable: true },
            fatherName: { type: 'string', nullable: true },
            motherName: { type: 'string', nullable: true },
            guardianName: { type: 'string', nullable: true },
            fatherContact: { type: 'string', nullable: true },
            motherContact: { type: 'string', nullable: true },
            guardianContact: { type: 'string', nullable: true },
            parentEmail: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        StudentInput: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'admissionNumber'],
          properties: {
            firstName: { type: 'string', example: 'Rahul' },
            lastName: { type: 'string', example: 'Sharma' },
            email: { type: 'string', format: 'email', example: 'rahul@school.com' },
            admissionNumber: { type: 'string', example: 'ADM-2025-001' },
            dateOfBirth: { type: 'string', format: 'date', example: '2012-05-15' },
            gender: { type: 'string', enum: ['male', 'female', 'other'] },
            rollNumber: { type: 'string', example: 'R001' },
            profilePic: { type: 'string' },
            classId: { type: 'integer', example: 1 },
            sectionId: { type: 'integer', example: 1 },
            fatherName: { type: 'string' },
            motherName: { type: 'string' },
            guardianName: { type: 'string' },
            fatherContact: { type: 'string', pattern: '^[6-9]\\d{9}$' },
            motherContact: { type: 'string', pattern: '^[6-9]\\d{9}$' },
            guardianContact: { type: 'string', pattern: '^[6-9]\\d{9}$' },
            parentEmail: { type: 'string', format: 'email' },
            schoolId: { type: 'string', example: '1' },
          },
        },

        // ── Teacher ──────────────────────────────────────────
        Teacher: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            schoolId: { type: 'integer' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phoneNumber: { type: 'string', nullable: true },
            subject: { type: 'string', nullable: true },
            qualification: { type: 'string', nullable: true },
            experience: { type: 'string', nullable: true },
            teacherId: { type: 'string', nullable: true },
            profilePic: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TeacherInput: {
          type: 'object',
          required: ['firstName', 'lastName', 'email'],
          properties: {
            firstName: { type: 'string', example: 'Priya' },
            lastName: { type: 'string', example: 'Nair' },
            email: { type: 'string', format: 'email', example: 'priya@school.com' },
            phoneNumber: { type: 'string', pattern: '^[6-9]\\d{9}$', example: '9876543210' },
            subject: { type: 'string', example: 'Mathematics' },
            qualification: { type: 'string', example: 'M.Sc Mathematics' },
            experience: { type: 'string', example: '5 years' },
            teacherId: { type: 'string', example: 'TCH-001' },
            profilePic: { type: 'string' },
            schoolId: { type: 'string', example: '1' },
          },
        },

        // ── Class ────────────────────────────────────────────
        Class: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            schoolId: { type: 'integer' },
            name: { type: 'string' },
            sections: { type: 'array', items: { $ref: '#/components/schemas/Section' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ClassInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: '10-A' },
            schoolId: { type: 'string', example: '1' },
          },
        },

        // ── Section ──────────────────────────────────────────
        Section: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            classId: { type: 'integer' },
            name: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        SectionInput: {
          type: 'object',
          required: ['name', 'classId'],
          properties: {
            name: { type: 'string', example: 'A' },
            classId: { type: 'integer', example: 1 },
          },
        },

        // ── Exam ─────────────────────────────────────────────
        Exam: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            classId: { type: 'integer', nullable: true },
            sectionId: { type: 'integer', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ExamInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Midterm Exam' },
            classId: { type: 'integer', example: 1 },
            sectionId: { type: 'integer', example: 1 },
          },
        },

        // ── Mark ─────────────────────────────────────────────
        Mark: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            studentId: { type: 'integer' },
            examId: { type: 'integer' },
            subject: { type: 'string' },
            score: { type: 'number' },
            maxScore: { type: 'number', default: 100 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        MarkInput: {
          type: 'object',
          required: ['studentId', 'examId', 'subject', 'score'],
          properties: {
            studentId: { type: 'integer', example: 1 },
            examId: { type: 'integer', example: 1 },
            subject: { type: 'string', example: 'Mathematics' },
            score: { type: 'number', example: 85 },
            schoolId: { type: 'string', example: '1' },
          },
        },

        // ── Attendance ───────────────────────────────────────
        Attendance: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            studentId: { type: 'integer' },
            date: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['present', 'absent'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AttendanceInput: {
          type: 'object',
          required: ['studentId', 'date', 'status'],
          properties: {
            studentId: { type: 'integer', example: 1 },
            date: { type: 'string', format: 'date', example: '2026-02-19' },
            status: { type: 'string', enum: ['present', 'absent'], example: 'present' },
            schoolId: { type: 'string', example: '1' },
          },
        },

        // ── Fee ──────────────────────────────────────────────
        Fee: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            schoolId: { type: 'integer' },
            studentId: { type: 'integer' },
            feeType: { type: 'string' },
            description: { type: 'string', nullable: true },
            amount: { type: 'number' },
            dueDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'partial'] },
            paidAmount: { type: 'number' },
            paidDate: { type: 'string', format: 'date-time', nullable: true },
            paymentMode: { type: 'string', nullable: true },
            transactionId: { type: 'string', nullable: true },
            academicYear: { type: 'string', nullable: true },
            term: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        FeeInput: {
          type: 'object',
          required: ['studentId', 'feeType', 'amount', 'dueDate'],
          properties: {
            studentId: { type: 'integer', example: 1 },
            feeType: { type: 'string', example: 'tuition' },
            description: { type: 'string', example: 'Term 1 tuition fee' },
            amount: { type: 'number', example: 25000 },
            dueDate: { type: 'string', format: 'date', example: '2026-03-31' },
            status: { type: 'string', enum: ['pending', 'paid', 'overdue', 'partial'] },
            paidAmount: { type: 'number' },
            paidDate: { type: 'string', format: 'date' },
            paymentMode: { type: 'string', enum: ['cash', 'online', 'cheque', 'upi'] },
            transactionId: { type: 'string' },
            academicYear: { type: 'string', example: '2025-2026' },
            term: { type: 'string', example: 'Term 1' },
            schoolId: { type: 'string', example: '1' },
          },
        },
        PayFeeRequest: {
          type: 'object',
          properties: {
            paymentMode: { type: 'string', enum: ['cash', 'online', 'cheque', 'upi'], example: 'upi' },
            transactionId: { type: 'string', example: 'TXN-123456' },
            paidAmount: { type: 'number', example: 25000 },
          },
        },

        // ── Event ────────────────────────────────────────────
        Event: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            schoolId: { type: 'integer' },
            title: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            description: { type: 'string' },
            images: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        EventInput: {
          type: 'object',
          required: ['title', 'description'],
          properties: {
            title: { type: 'string', minLength: 3, example: 'Annual Day' },
            eventDate: { type: 'string', format: 'date', example: '2026-03-15' },
            eventTime: { type: 'string', example: '10:00' },
            description: { type: 'string', example: 'Annual day celebration' },
            images: { type: 'string', example: 'https://example.com/img.jpg' },
            schoolId: { type: 'string', example: '1' },
          },
        },

        // ── Announcement ─────────────────────────────────────
        Announcement: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            schoolId: { type: 'integer' },
            title: { type: 'string' },
            message: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AnnouncementInput: {
          type: 'object',
          required: ['title', 'message'],
          properties: {
            title: { type: 'string', minLength: 3, example: 'Holiday Notice' },
            message: { type: 'string', minLength: 3, example: 'School will remain closed on 26th Jan.' },
            schoolId: { type: 'string', example: '1' },
          },
        },

        // ── Achievement ──────────────────────────────────────
        Achievement: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            studentId: { type: 'integer' },
            title: { type: 'string' },
            category: { type: 'string' },
            achievementDate: { type: 'string', format: 'date-time' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AchievementInput: {
          type: 'object',
          required: ['title', 'date', 'description'],
          properties: {
            title: { type: 'string', minLength: 3, example: 'Science Olympiad Winner' },
            studentId: { type: 'integer', example: 1 },
            category: { type: 'string', enum: ['academics', 'sports', 'arts', 'other'], example: 'academics' },
            date: { type: 'string', format: 'date', example: '2026-01-20' },
            description: { type: 'string', example: 'Won gold medal in regional science olympiad' },
            schoolId: { type: 'string', example: '1' },
          },
        },

        // ── Sport ────────────────────────────────────────────
        Sport: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            schoolId: { type: 'integer' },
            name: { type: 'string' },
            coachName: { type: 'string' },
            schedule: { type: 'string' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        SportInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 2, example: 'Cricket' },
            coachName: { type: 'string', example: 'Mr. Kumar' },
            schedule: { type: 'string', example: 'Mon, Wed, Fri 4-5 PM' },
            description: { type: 'string', example: 'Inter-school cricket training' },
            schoolId: { type: 'string', example: '1' },
          },
        },

        // ── Portal ───────────────────────────────────────────
        StudentLoginRequest: {
          type: 'object',
          required: ['rollNumber'],
          properties: {
            rollNumber: { type: 'string', example: 'R001' },
          },
        },
        TeacherLoginRequest: {
          type: 'object',
          required: ['teacherId'],
          properties: {
            teacherId: { type: 'string', example: 'TCH-001' },
          },
        },

        // ── Generic ──────────────────────────────────────────
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Something went wrong' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'array', items: { type: 'string' } },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },

      // ── Shared responses ───────────────────────────────────
      responses: {
        Unauthorized: {
          description: 'Missing or invalid JWT token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { message: 'Authentication required' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { message: 'Resource not found' },
            },
          },
        },
        RateLimited: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { message: 'Too many requests, please try again later.' },
            },
          },
        },
      },
    },

    // Default security for all protected routes
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/docs/*.js'],
}

const swaggerSpec = swaggerJsdoc(options)

export function setupSwagger(app) {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Vidya Hub API Docs',
    }),
  )

  // Serve raw JSON spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(swaggerSpec)
  })
}
