import { verifyToken } from '../utils/jwt.js'
import prisma from '../utils/prisma.js'
import { logError } from '../utils/logHelpers.js'

/**
 * Authentication middleware — verifies JWT Bearer token
 * Attaches req.user with { id, email, role, schoolId }
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' })
    }

    const token = authHeader.split(' ')[1]

    let decoded
    try {
      decoded = verifyToken(token)
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please log in again.' })
      }
      return res.status(401).json({ message: 'Invalid token. Please log in again.' })
    }

    // Verify the user still exists in DB (handles deleted / deactivated users)
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, role: true, schoolId: true },
    })

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists. Please log in again.' })
    }

    // Attach user to request
    req.user = user
    next()
  } catch (error) {
    logError(`Auth middleware error: ${error.message}`, {
      filename: 'auth.js',
      line: 40,
      schoolId: 'system',
      stack: error.stack,
    })
    return res.status(500).json({ message: 'Authentication error' })
  }
}

/**
 * Role-based authorization middleware
 * @param  {...string} roles — allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      })
    }
    next()
  }
}

export default authenticate
