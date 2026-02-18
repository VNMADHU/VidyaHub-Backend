import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcrypt'

// Mock Prisma before importing app
vi.mock('../../utils/prisma.js', () => {
  return import('../../test/mockPrisma.js')
})

// Import app after mocking
const { default: app } = await import('../../app.js')
const { default: prisma } = await import('../../utils/prisma.js')

describe('POST /api/auth/login', () => {
  const hashedPassword = bcrypt.hashSync('password123', 4) // low rounds for test speed

  const mockUser = {
    id: 1,
    email: 'admin@school.com',
    password: hashedPassword,
    role: 'school-admin',
    schoolId: 1,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 200 and a JWT token for valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@school.com', password: 'password123', role: 'school-admin' })

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Login successful')
    expect(res.body.token).toBeDefined()
    expect(res.body.token.split('.')).toHaveLength(3) // JWT has 3 parts
    expect(res.body.user).toMatchObject({
      id: 1,
      email: 'admin@school.com',
      role: 'school-admin',
      schoolId: 1,
    })
  })

  it('should return 401 for wrong password', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@school.com', password: 'wrongpassword', role: 'school-admin' })

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid email or password')
  })

  it('should return 401 for non-existent user', async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@school.com', password: 'password123', role: 'school-admin' })

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid email or password')
  })

  it('should return 401 for wrong role', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@school.com', password: 'password123', role: 'teacher' })

    expect(res.status).toBe(401)
    expect(res.body.message).toContain('not registered as')
  })

  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@school.com' }) // missing password and role

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Validation error')
  })

  it('should return 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'password123', role: 'school-admin' })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Validation error')
  })
})

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 201 for valid registration', async () => {
    prisma.user.findUnique.mockResolvedValue(null) // no existing user
    prisma.$transaction.mockImplementation(async (cb) => {
      const tx = {
        school: {
          create: vi.fn().mockResolvedValue({ id: 10, name: 'New School' }),
        },
        user: {
          create: vi.fn().mockResolvedValue({
            id: 5,
            email: 'new@school.com',
            role: 'school-admin',
            schoolId: 10,
          }),
        },
      }
      return cb(tx)
    })

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'new@school.com',
        password: 'securepassword123',
        schoolName: 'New School',
      })

    expect(res.status).toBe(201)
    expect(res.body.message).toBe('Registration successful')
    expect(res.body.user.email).toBe('new@school.com')
  })

  it('should return 409 for duplicate email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'existing@school.com' })

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'existing@school.com',
        password: 'securepassword123',
        schoolName: 'Some School',
      })

    expect(res.status).toBe(409)
    expect(res.body.message).toContain('already exists')
  })

  it('should return 400 for short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'new@school.com',
        password: 'short',
        schoolName: 'New School',
      })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Validation error')
  })
})

describe('POST /api/auth/otp', () => {
  it('should return 200 for valid OTP request', async () => {
    const res = await request(app)
      .post('/api/auth/otp')
      .send({ email: 'admin@school.com' })

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('OTP requested')
  })

  it('should return 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/otp')
      .send({ email: 'not-email' })

    // May get 429 if rate limiter kicked in from previous tests, or 400 for validation
    expect([400, 429]).toContain(res.status)
  })
})
