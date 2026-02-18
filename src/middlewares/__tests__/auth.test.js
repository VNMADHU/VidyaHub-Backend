import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

// Mock Prisma before importing app
vi.mock('../../utils/prisma.js', () => {
  return import('../../test/mockPrisma.js')
})

const { default: app } = await import('../../app.js')
const { default: prisma } = await import('../../utils/prisma.js')
import { authHeader, testUser } from '../../test/helpers.js'

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Token validation', () => {
    it('should return 401 when no Authorization header is present', async () => {
      const res = await request(app).get('/api/students')

      expect(res.status).toBe(401)
      expect(res.body.message).toContain('Authentication required')
    })

    it('should return 401 when Authorization header has no Bearer prefix', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', 'InvalidPrefix some-token')

      expect(res.status).toBe(401)
      expect(res.body.message).toContain('Authentication required')
    })

    it('should return 401 for an invalid JWT token', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', 'Bearer invalid.token.here')

      expect(res.status).toBe(401)
      expect(res.body.message).toContain('Invalid token')
    })

    it('should return 401 for an expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { sub: 1, email: 'test@test.com', role: 'school-admin', schoolId: 1 },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }, // immediately expired
      )

      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${expiredToken}`)

      expect(res.status).toBe(401)
      expect(res.body.message).toContain('expired')
    })

    it('should return 401 when user no longer exists in database', async () => {
      prisma.user.findUnique.mockResolvedValue(null) // user deleted

      const res = await request(app)
        .get('/api/students')
        .set('Authorization', authHeader())

      expect(res.status).toBe(401)
      expect(res.body.message).toContain('no longer exists')
    })

    it('should pass through when a valid token and existing user are provided', async () => {
      prisma.user.findUnique.mockResolvedValue(testUser)
      prisma.student.findMany.mockResolvedValue([])

      const res = await request(app)
        .get('/api/students')
        .set('Authorization', authHeader())

      expect(res.status).toBe(200)
    })
  })

  describe('Public routes', () => {
    it('should allow access to /health without auth', async () => {
      const res = await request(app).get('/health')

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('ok')
    })

    it('should allow access to /api/auth/login without auth', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123', role: 'school-admin' })

      // 401 because user not found, but NOT because of auth middleware
      expect(res.status).toBe(401)
      expect(res.body.message).toBe('Invalid email or password')
    })
  })
})

describe('Role Authorization', () => {
  // We can test authorize() by checking role-protected routes if any exist.
  // For now, test the authorize middleware function directly.
  it('should export authorize function', async () => {
    const { authorize } = await import('../auth.js')
    expect(typeof authorize).toBe('function')
  })

  it('authorize should return middleware function', async () => {
    const { authorize } = await import('../auth.js')
    const middleware = authorize('school-admin', 'super-admin')
    expect(typeof middleware).toBe('function')
  })

  it('authorize should deny access for wrong role', async () => {
    const { authorize } = await import('../auth.js')
    const middleware = authorize('super-admin')

    const req = { user: { role: 'teacher' } }
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    const next = vi.fn()

    middleware(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('authorize should allow access for matching role', async () => {
    const { authorize } = await import('../auth.js')
    const middleware = authorize('school-admin', 'super-admin')

    const req = { user: { role: 'school-admin' } }
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    const next = vi.fn()

    middleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })
})
