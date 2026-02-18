import { describe, it, expect } from 'vitest'
import jwt from 'jsonwebtoken'
import { signToken, verifyToken } from '../jwt.js'

describe('JWT Utilities', () => {
  const payload = {
    id: 1,
    email: 'test@school.com',
    role: 'school-admin',
    schoolId: 1,
  }

  describe('signToken', () => {
    it('should return a valid JWT string', () => {
      const token = signToken(payload)
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should embed sub, email, role, schoolId in token', () => {
      const token = signToken(payload)
      const decoded = jwt.decode(token)

      expect(decoded.sub).toBe(1)
      expect(decoded.email).toBe('test@school.com')
      expect(decoded.role).toBe('school-admin')
      expect(decoded.schoolId).toBe(1)
    })

    it('should set an expiry on the token', () => {
      const token = signToken(payload)
      const decoded = jwt.decode(token)

      expect(decoded.exp).toBeDefined()
      expect(decoded.iat).toBeDefined()
      expect(decoded.exp).toBeGreaterThan(decoded.iat)
    })
  })

  describe('verifyToken', () => {
    it('should verify and return decoded payload for a valid token', () => {
      const token = signToken(payload)
      const decoded = verifyToken(token)

      expect(decoded.sub).toBe(1)
      expect(decoded.email).toBe('test@school.com')
      expect(decoded.role).toBe('school-admin')
    })

    it('should throw for a tampered token', () => {
      const token = signToken(payload)
      const tampered = token.slice(0, -5) + 'XXXXX' // corrupt signature

      expect(() => verifyToken(tampered)).toThrow()
    })

    it('should throw for a token signed with wrong secret', () => {
      const badToken = jwt.sign({ sub: 1 }, 'wrong-secret-key-that-is-different')

      expect(() => verifyToken(badToken)).toThrow()
    })
  })
})
