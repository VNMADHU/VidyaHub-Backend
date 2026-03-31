import prisma from '../utils/prisma.js'

/**
 * Trial Record Limit Middleware
 *
 * Blocks record creation when a school is on a FREE TRIAL and has reached
 * the TRIAL_RECORD_LIMIT configured in the backend .env file.
 *
 * Only applies when BOTH conditions are true:
 *   1. TRIAL_RECORD_LIMIT > 0  (env var)
 *   2. school.isFreeTrail === true  (DB field set at registration)
 *
 * Usage:
 *   router.post('/', trialLimit('student'), createStudent)
 *
 * Set TRIAL_RECORD_LIMIT=0 (or omit it) to disable limiting completely.
 *
 * @param {string} model  — Prisma model name in camelCase (e.g. 'student')
 */
const trialLimit = (model) => async (req, res, next) => {
  const limit = parseInt(process.env.TRIAL_RECORD_LIMIT || '0', 10)

  // 0 or not set = unlimited (production / paid plan env)
  if (!limit || limit <= 0) return next()

  try {
    const schoolId = parseInt(
      req.user?.schoolId || req.headers['x-school-id'] || 1,
      10,
    )

    // Check if this school is on a free trial
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { isFreeTrail: true },
    })

    // Paid schools are never limited
    if (!school || school.isFreeTrail === false) return next()

    // Use per-school freeTrialLimit if configured, otherwise fall back to env var
    const schoolConfig = await prisma.schoolConfig.findUnique({
      where: { schoolId },
      select: { freeTrialLimit: true },
    })
    const effectiveLimit = (schoolConfig?.freeTrialLimit > 0) ? schoolConfig.freeTrialLimit : limit

    const count = await prisma[model].count({ where: { schoolId } })

    if (count >= effectiveLimit) {
      return res.status(403).json({
        code: 'TRIAL_LIMIT_REACHED',
        message: `Free trial limit of ${effectiveLimit} records reached for this module. Please upgrade your plan to add more records.`,
        limit: effectiveLimit,
        current: count,
        model,
      })
    }

    next()
  } catch {
    // If count fails for any reason, let the request through so we don't
    // accidentally block legitimate users.
    next()
  }
}

export default trialLimit
