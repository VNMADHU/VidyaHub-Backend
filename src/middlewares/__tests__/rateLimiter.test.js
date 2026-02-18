import { describe, it, expect } from 'vitest'
import { authLimiter, apiLimiter } from '../rateLimiter.js'

describe('Rate Limiter Configuration', () => {
  it('authLimiter should be a valid middleware function', () => {
    expect(typeof authLimiter).toBe('function')
  })

  it('apiLimiter should be a valid middleware function', () => {
    expect(typeof apiLimiter).toBe('function')
  })
})
