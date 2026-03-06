import { verifyToken } from '../utils/jwt.js'
import prisma from '../utils/prisma.js'
import { logError } from '../utils/logHelpers.js'

/**
 * Portal authentication middleware — verifies JWT Bearer token
 * issued by the portal login endpoints (student-login / teacher-login).
 *
 * Unlike the main `authenticate` middleware this does NOT look up a User row
 * because portal tokens are issued against Student / Teacher records, not the
 * User table.  It verifies the JWT signature/expiry AND confirms the
 * student/teacher record still exists in the DB (handles deleted records).
 */
const portalAuthenticate = async (req, res, next) => {
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

    // Only allow portal-specific roles
    if (!['portal-student', 'portal-teacher'].includes(decoded.role)) {
      return res.status(403).json({ message: 'Access denied. This endpoint requires a portal login.' })
    }

    // Verify the underlying Student / Teacher record still exists in the DB
    // (handles records that were deleted after the token was issued)
    const entityId = decoded.sub
    let entityExists = false

    if (decoded.role === 'portal-student') {
      const student = await prisma.student.findUnique({ where: { id: entityId }, select: { id: true } })
      entityExists = !!student
    } else if (decoded.role === 'portal-teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { id: entityId }, select: { id: true } })
      entityExists = !!teacher
    }

    if (!entityExists) {
      return res.status(401).json({ message: 'Account no longer exists. Please contact your school administrator.' })
    }

    // Attach decoded token data to request
    req.portalUser = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      schoolId: decoded.schoolId,
    }

    next()
  } catch (error) {
    logError(`Portal auth middleware error: ${error.message}`, {
      filename: 'portalAuth.js',
      line: 65,
      schoolId: 'system',
      stack: error.stack,
    })
    return res.status(500).json({ message: 'Authentication error' })
  }
}

export default portalAuthenticate
