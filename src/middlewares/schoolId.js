/**
 * Middleware to extract schoolId from the X-School-Id header.
 * Sets req.schoolId so all controllers can use it consistently.
 * Falls back to req.body.schoolId (for backward compat) then defaults to '1'.
 */
const schoolIdMiddleware = (req, res, next) => {
  req.schoolId = req.headers['x-school-id'] || req.body?.schoolId || '1'
  next()
}

export default schoolIdMiddleware
