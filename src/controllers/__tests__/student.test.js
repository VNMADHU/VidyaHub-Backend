import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

// Mock Prisma before importing app
vi.mock('../../utils/prisma.js', () => {
  return import('../../test/mockPrisma.js')
})

const { default: app } = await import('../../app.js')
const { default: prisma } = await import('../../utils/prisma.js')
import { authHeader, testUser } from '../../test/helpers.js'

// All student routes are protected — set up auth for each request
const authenticatedAgent = () => {
  prisma.user.findUnique.mockResolvedValue(testUser)
}

describe('Student CRUD Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authenticatedAgent()
  })

  // ── LIST ──────────────────────────────────────────────────
  describe('GET /api/students', () => {
    it('should return a list of students', async () => {
      const mockStudents = [
        { id: 1, firstName: 'Aarav', lastName: 'Sharma', email: 'aarav@school.com' },
        { id: 2, firstName: 'Priya', lastName: 'Patel', email: 'priya@school.com' },
      ]
      prisma.student.findMany.mockResolvedValue(mockStudents)

      const res = await request(app)
        .get('/api/students')
        .set('Authorization', authHeader())

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.data[0].firstName).toBe('Aarav')
    })

    it('should return empty array when no students exist', async () => {
      prisma.student.findMany.mockResolvedValue([])

      const res = await request(app)
        .get('/api/students')
        .set('Authorization', authHeader())

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(0)
    })
  })

  // ── GET BY ID ─────────────────────────────────────────────
  describe('GET /api/students/:studentId', () => {
    it('should return a single student by ID', async () => {
      const mockStudent = {
        id: 1,
        firstName: 'Aarav',
        lastName: 'Sharma',
        email: 'aarav@school.com',
        class: { id: 1, name: '10-A' },
        section: null,
      }
      prisma.student.findUnique.mockResolvedValue(mockStudent)

      const res = await request(app)
        .get('/api/students/1')
        .set('Authorization', authHeader())

      expect(res.status).toBe(200)
      expect(res.body.firstName).toBe('Aarav')
      expect(res.body.class.name).toBe('10-A')
    })

    it('should return 404 for non-existent student', async () => {
      prisma.student.findUnique.mockResolvedValue(null)

      const res = await request(app)
        .get('/api/students/999')
        .set('Authorization', authHeader())

      expect(res.status).toBe(404)
      expect(res.body.message).toContain('not found')
    })
  })

  // ── CREATE ────────────────────────────────────────────────
  describe('POST /api/students', () => {
    const validStudent = {
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'aarav@school.com',
      admissionNumber: 'ADM001',
      schoolId: '1',
    }

    it('should create a student with valid data', async () => {
      prisma.student.create.mockResolvedValue({
        id: 1,
        ...validStudent,
        schoolId: 1,
      })

      const res = await request(app)
        .post('/api/students')
        .set('Authorization', authHeader())
        .send(validStudent)

      expect(res.status).toBe(201)
      expect(res.body.message).toBe('Student created')
      expect(res.body.data.firstName).toBe('Aarav')
    })

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', authHeader())
        .send({ firstName: 'Incomplete' }) // missing lastName, email, admissionNumber

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('Validation error')
    })

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/students')
        .set('Authorization', authHeader())
        .send({ ...validStudent, email: 'not-email' })

      expect(res.status).toBe(400)
      expect(res.body.message).toBe('Validation error')
    })
  })

  // ── UPDATE ────────────────────────────────────────────────
  describe('PATCH /api/students/:studentId', () => {
    it('should update a student with partial data', async () => {
      prisma.student.update.mockResolvedValue({
        id: 1,
        firstName: 'Updated',
        lastName: 'Sharma',
        email: 'aarav@school.com',
      })

      const res = await request(app)
        .patch('/api/students/1')
        .set('Authorization', authHeader())
        .send({ firstName: 'Updated' })

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Student updated')
      expect(res.body.data.firstName).toBe('Updated')
    })
  })

  // ── DELETE ────────────────────────────────────────────────
  describe('DELETE /api/students/:studentId', () => {
    it('should delete a student and related records', async () => {
      prisma.$transaction.mockResolvedValue([])

      const res = await request(app)
        .delete('/api/students/1')
        .set('Authorization', authHeader())

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Student deleted successfully')
    })
  })
})
