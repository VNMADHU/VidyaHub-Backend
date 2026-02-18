/**
 * Test helpers — JWT generation and request builders for supertest
 */
import { signToken } from '../utils/jwt.js'

/**
 * Generate a valid JWT for testing
 * @param {object} overrides — fields to override in the default user
 * @returns {string} Bearer token string
 */
export const getAuthToken = (overrides = {}) => {
  const defaultUser = {
    id: 1,
    email: 'admin@test.com',
    role: 'school-admin',
    schoolId: 1,
    ...overrides,
  }
  return signToken(defaultUser)
}

/**
 * Generate Authorization header value
 */
export const authHeader = (overrides = {}) => {
  return `Bearer ${getAuthToken(overrides)}`
}

/**
 * Default test user for assertions
 */
export const testUser = {
  id: 1,
  email: 'admin@test.com',
  role: 'school-admin',
  schoolId: 1,
}

/**
 * Generates a bcrypt hash for testing (pre-computed for 'password123')
 * Using rounds=4 for speed in tests
 */
export const TEST_PASSWORD = 'password123'
