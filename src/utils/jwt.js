import jwt from 'jsonwebtoken'

const getSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long')
  }
  return secret
}

/**
 * Sign a JWT token with user payload
 * @param {{ id: number, email: string, role: string, schoolId: number|null }} payload
 * @returns {string}
 */
export const signToken = (payload) => {
  return jwt.sign(
    {
      sub: payload.id,
      email: payload.email,
      role: payload.role,
      schoolId: payload.schoolId,
    },
    getSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  )
}

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {{ sub: number, email: string, role: string, schoolId: number|null, iat: number, exp: number }}
 * @throws {jwt.JsonWebTokenError | jwt.TokenExpiredError}
 */
export const verifyToken = (token) => {
  return jwt.verify(token, getSecret())
}
