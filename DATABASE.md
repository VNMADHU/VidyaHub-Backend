# Database Configuration

## PostgreSQL Setup

### Local Development

1. Install PostgreSQL from [postgresql.org](https://www.postgresql.org)

2. Create a database:
```bash
createdb vidya_hub_dev
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your database connection:
```
DATABASE_URL=postgresql://username:password@localhost:5432/vidya_hub_dev
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-key-here-change-in-production
CORS_ORIGIN=http://localhost:5173
```

### Tables (Phase 1)

1. **Users** - Authentication and user data
2. **Schools** - Institution information
3. **Students** - Student records
4. **Teachers** - Faculty records
5. **Classes** - Class definitions (e.g., "10-A")
6. **Sections** - Section definitions
7. **Subjects** - Subject information
8. **Attendance** - Daily attendance records
9. **Exams** - Exam definitions
10. **Marks** - Student marks/scores
11. **Events** - School events
12. **Announcements** - School announcements
13. **Timetables** - Weekly timetables

## Migration Strategy

Run migrations to create tables:
```bash
npm run migrate:dev
```

## Backup & Recovery

Backup database:
```bash
pg_dump vidya_hub_dev > backup.sql
```

Restore from backup:
```bash
psql vidya_hub_dev < backup.sql
```

## Connection String Format
```
postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]
```

Examples:
- Local: `postgresql://postgres:password@localhost:5432/vidya_hub_dev`
- Production: `postgresql://user:password@prod-db-host.com:5432/vidya_hub_prod`
