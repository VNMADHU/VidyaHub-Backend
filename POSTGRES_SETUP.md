# PostgreSQL & Prisma Setup Guide

## ✅ What's Installed
- **PostgreSQL 14.17** (Server & Client)
- **Prisma ORM** (Database toolkit)
- **pg** (PostgreSQL driver for Node.js)

## Quick Start

### 1. Start PostgreSQL Server
```bash
brew services start postgresql
```

Verify it's running:
```bash
psql --version
```

### 2. Create Database
```bash
createdb vidya_hub_dev
```

### 3. Setup Environment File
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update `.env`:
```
DATABASE_URL=postgresql://username:password@localhost:5432/vidya_hub_dev
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secret-key-change-in-production
CORS_ORIGIN=http://localhost:5173
```

**To find your PostgreSQL username:**
```bash
psql -U postgres -c "SELECT current_user;"
```

### 4. Run Migrations
This creates all tables from the Prisma schema:
```bash
npm run prisma:migrate
```

This will:
- Create migration files
- Ask for a migration name (e.g., "init")
- Generate Prisma Client
- Apply migrations to database

### 5. (Optional) Seed Database
Populate with demo data:
```bash
npm run prisma:seed
```

### 6. View Database (Prisma Studio)
Interactive UI to browse/edit data:
```bash
npm run prisma:studio
```

Opens at http://localhost:5555

## Database Schema

13 tables created:
- **User** - Authentication
- **School** - Institution info
- **Student** - Student records
- **Teacher** - Faculty records
- **Class** - Class definitions
- **Section** - Section definitions
- **Subject** - Subject list
- **Attendance** - Daily attendance
- **Exam** - Exam definitions
- **Mark** - Student marks
- **Event** - School events
- **Announcement** - Announcements
- **Timetable** - Weekly schedules

## Stop PostgreSQL
```bash
brew services stop postgresql
```

## Useful Commands

### Check DB Connection
```bash
psql -U username -d vidya_hub_dev -c "SELECT 1;"
```

### Backup Database
```bash
pg_dump vidya_hub_dev > backup.sql
```

### Restore from Backup
```bash
psql vidya_hub_dev < backup.sql
```

### Reset Database
```bash
dropdb vidya_hub_dev && createdb vidya_hub_dev && npm run prisma:migrate
```

### Check Migration Status
```bash
npx prisma migrate status
```

## Troubleshooting

**Error: `ECONNREFUSED` - PostgreSQL not running**
```bash
brew services start postgresql
```

**Error: `role "username" does not exist`**
Check your DATABASE_URL in .env matches your system username.

**Error: Database already exists**
```bash
dropdb vidya_hub_dev
createdb vidya_hub_dev
```

## Next Steps
After setup:
1. Run backend: `npm run dev`
2. Backend API runs at `http://localhost:5000`
3. Frontend connects from `http://localhost:5173`
4. Logs saved in `logs/` directory
