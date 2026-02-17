# Backend Logging System

## Overview
The Vidya Hub backend uses **Winston** for structured logging with the following information per log entry:
- **Timestamp**: ISO format date/time
- **Level**: INFO (20), WARNING (30), ERROR (40), CRITICAL (50)
- **Filename**: Source file name (e.g., authController.js)
- **Line**: Line number in source file
- **School ID / Organization ID**: Extracted from request headers or body
- **Message**: Log message
- **Stack**: Error stack trace (for errors)

## Log Files
Logs are stored in the `logs/` directory:
- `logs/error.log` - Errors and above
- `logs/combined.log` - All levels
- Console output - Pretty-printed for development

## Usage in Frontend
Send school/organization ID in every API request:

```javascript
// Option 1: In headers
fetch('/api/students', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-School-Id': '123' // or organizationId
  },
  body: JSON.stringify({ name: 'John' })
})

// Option 2: In request body
fetch('/api/students', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    schoolId: '123',
    name: 'John'
  })
})
```

## Log Output Example

### Console (Pretty-printed):
```
[2026-02-16 10:15:30] INFO [authController.js:24] [school-123] Login attempt for email: admin@school.edu
[2026-02-16 10:15:31] INFO [RESPONSE] POST /api/auth/login - 200 (145ms)
[2026-02-16 10:15:35] ERROR [studentController.js:31] [school-123] Create student error: Name is required
```

### File (JSON):
```json
{"timestamp":"2026-02-16 10:15:30","level":"INFO","filename":"authController.js","line":24,"schoolId":"school-123","message":"Login attempt for email: admin@school.edu"}
{"timestamp":"2026-02-16 10:15:31","level":"INFO","filename":"authController.js","line":30,"schoolId":"school-123","message":"Login successful for admin@school.edu"}
{"timestamp":"2026-02-16 10:15:35","level":"ERROR","filename":"studentController.js","line":31,"schoolId":"school-123","message":"Create student error: Name is required","stack":"Error: Validation error..."}
```

## Adding Logs in Controllers

```javascript
import { logInfo, logError, logWarning, logCritical } from '../utils/logHelpers.js'

export const myController = (req, res, next) => {
  try {
    const schoolId = req.body?.schoolId || 'system'
    
    logInfo('Operation started', {
      filename: 'myController.js',
      line: 10,
      schoolId
    })
    
    // ... do something
    
    res.json({ success: true })
  } catch (error) {
    logError(`Operation failed: ${error.message}`, {
      filename: 'myController.js',
      line: 20,
      schoolId: req.body?.schoolId || 'system',
      stack: error.stack
    })
    next(error)
  }
}
```

## Log Levels Reference
| Level | Value | Use Case |
|-------|-------|----------|
| INFO | 20 | Normal operations, user actions |
| WARNING | 30 | Deprecated usage, recoverable issues |
| ERROR | 40 | Failures, exceptions |
| CRITICAL | 50 | System failures requiring immediate attention |

All request/response activity is automatically logged by the middleware in [src/middlewares/requestResponseLogger.js](src/middlewares/requestResponseLogger.js).
