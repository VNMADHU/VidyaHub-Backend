import 'dotenv/config'

// Set test environment variables before anything else
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long'
process.env.JWT_EXPIRES_IN = '1h'
