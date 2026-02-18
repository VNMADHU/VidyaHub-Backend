import { PrismaClient } from '@prisma/client'

// Singleton PrismaClient — prevents exhausting DB connections
const prisma = new PrismaClient()

export default prisma
