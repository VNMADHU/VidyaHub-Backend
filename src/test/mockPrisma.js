/**
 * Prisma mock for unit tests
 *
 * Vitest will use this mock whenever a module imports '../utils/prisma.js'
 * Each method returns vi.fn() so tests can set return values with mockResolvedValue.
 */
import { vi } from 'vitest'

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  school: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  student: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  teacher: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  class: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  section: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  attendance: {
    deleteMany: vi.fn(),
  },
  mark: {
    deleteMany: vi.fn(),
  },
  achievement: {
    deleteMany: vi.fn(),
  },
  fee: {
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(),
  $disconnect: vi.fn(),
}

export default mockPrisma
