/**
 * Middleware to resolve schoolId for the current request.
 *
 * Security policy:
 *   - For authenticated requests (req.user is set), the schoolId is ALWAYS
 *     sourced from the verified JWT payload (req.user.schoolId).  The
 *     X-School-Id header is deliberately ignored to prevent cross-school data
 *     access by tenants sending a forged header.
 *   - For unauthenticated / portal pre-login routes the header is accepted as
 *     a hint only and controllers must still validate ownership in the DB.
 *   - req.body.schoolId is never trusted (kept for legacy compatibility only
 *     where a controller explicitly needs it for its own logic).
 */
const schoolIdMiddleware = (req, res, next) => {
  if (req.user?.schoolId) {
    // Authenticated route — lock to the user's own school, ignore any header
    req.schoolId = String(req.user.schoolId)
  } else {
    // Pre-auth route (login, portal login, public) — header is an acceptable hint
    req.schoolId = req.headers['x-school-id'] || '1'
  }
  next()
}

export default schoolIdMiddleware
