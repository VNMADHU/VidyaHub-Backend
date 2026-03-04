import prisma from '../utils/prisma.js'

/**
 * Trial Record Limit Middleware
 *
 * Blocks record creation when a school has reached the TRIAL_RECORD_LIMIT
 * configured in the backend .env file.
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

  // 0 or not set = unlimited (production / paid plan)
  if (!limit || limit <= 0) return next()

  try {
    const schoolId = parseInt(
      req.user?.schoolId || req.headers['x-school-id'] || 1,
      10,
    )

    const count = await prisma[model].count({ where: { schoolId } })

    if (count >= limit) {
      return res.status(403).json({
        code: 'TRIAL_LIMIT_REACHED',
        message: `Free trial limit of ${limit} records reached for this module. Please upgrade your plan to add more records.`,
        limit,
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
