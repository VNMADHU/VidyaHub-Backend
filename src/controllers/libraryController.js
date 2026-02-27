import { z } from 'zod'
import prisma from '../utils/prisma.js'
import { logInfo, logError } from '../utils/logHelpers.js'

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().optional(),
  category: z.string().optional(),
  publisher: z.string().optional(),
  edition: z.string().optional(),
  language: z.string().optional(),
  totalCopies: z.number().int().min(1).optional(),
  shelfLocation: z.string().optional(),
})

const bookIssueSchema = z.object({
  bookId: z.number().int(),
  studentId: z.number().int(),
  dueDate: z.string(),
})

// ── Books CRUD ────────────────────────────────────────────

export const listBooks = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    logInfo('Listing all books', { filename: 'libraryController.js', schoolId })
    const books = await prisma.book.findMany({
      where: { schoolId: parseInt(schoolId) },
      include: { issues: { where: { status: 'issued' }, include: { student: true } } },
      orderBy: { title: 'asc' },
    })
    res.json({ data: books, message: 'List of books' })
  } catch (error) {
    logError(`List books error: ${error.message}`, { filename: 'libraryController.js' })
    next(error)
  }
}

export const createBook = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    const validated = bookSchema.parse(req.body)
    logInfo('Creating book', { filename: 'libraryController.js', schoolId })
    const book = await prisma.book.create({
      data: {
        ...validated,
        availableCopies: validated.totalCopies || 1,
        schoolId: parseInt(schoolId),
      },
    })
    res.status(201).json({ data: book, message: 'Book created' })
  } catch (error) {
    logError(`Create book error: ${error.message}`, { filename: 'libraryController.js' })
    next(error)
  }
}

export const updateBook = async (req, res, next) => {
  try {
    const { bookId } = req.params
    logInfo('Updating book', { filename: 'libraryController.js', bookId })
    const book = await prisma.book.update({
      where: { id: parseInt(bookId) },
      data: req.body,
    })
    res.json({ data: book, message: 'Book updated' })
  } catch (error) {
    logError(`Update book error: ${error.message}`, { filename: 'libraryController.js' })
    next(error)
  }
}

export const deleteBook = async (req, res, next) => {
  try {
    const { bookId } = req.params
    logInfo('Deleting book', { filename: 'libraryController.js', bookId })
    await prisma.book.delete({ where: { id: parseInt(bookId) } })
    res.json({ message: 'Book deleted' })
  } catch (error) {
    logError(`Delete book error: ${error.message}`, { filename: 'libraryController.js' })
    next(error)
  }
}

// ── Book Issues ───────────────────────────────────────────

export const listBookIssues = async (req, res, next) => {
  try {
    const schoolId = req.schoolId
    logInfo('Listing book issues', { filename: 'libraryController.js', schoolId })
    const issues = await prisma.bookIssue.findMany({
      where: { book: { schoolId: parseInt(schoolId) } },
      include: { book: true, student: true },
      orderBy: { issueDate: 'desc' },
    })
    res.json({ data: issues, message: 'List of book issues' })
  } catch (error) {
    logError(`List book issues error: ${error.message}`, { filename: 'libraryController.js' })
    next(error)
  }
}

export const issueBook = async (req, res, next) => {
  try {
    const validated = bookIssueSchema.parse(req.body)
    logInfo('Issuing book', { filename: 'libraryController.js', bookId: validated.bookId })

    // Decrease available copies
    const book = await prisma.book.findUnique({ where: { id: validated.bookId } })
    if (!book || book.availableCopies < 1) {
      return res.status(400).json({ message: 'Book not available for issue' })
    }

    const [issue] = await prisma.$transaction([
      prisma.bookIssue.create({
        data: {
          bookId: validated.bookId,
          studentId: validated.studentId,
          dueDate: new Date(validated.dueDate),
        },
      }),
      prisma.book.update({
        where: { id: validated.bookId },
        data: {
          availableCopies: { decrement: 1 },
          status: book.availableCopies <= 1 ? 'all-issued' : 'available',
        },
      }),
    ])
    res.status(201).json({ data: issue, message: 'Book issued' })
  } catch (error) {
    logError(`Issue book error: ${error.message}`, { filename: 'libraryController.js' })
    next(error)
  }
}

export const returnBook = async (req, res, next) => {
  try {
    const { issueId } = req.params
    const { fine } = req.body || {}
    logInfo('Returning book', { filename: 'libraryController.js', issueId })

    const issue = await prisma.bookIssue.findUnique({ where: { id: parseInt(issueId) } })
    if (!issue || issue.status === 'returned') {
      return res.status(400).json({ message: 'Invalid issue or already returned' })
    }

    const [updatedIssue] = await prisma.$transaction([
      prisma.bookIssue.update({
        where: { id: parseInt(issueId) },
        data: { status: 'returned', returnDate: new Date(), fine: fine || 0 },
      }),
      prisma.book.update({
        where: { id: issue.bookId },
        data: { availableCopies: { increment: 1 }, status: 'available' },
      }),
    ])
    res.json({ data: updatedIssue, message: 'Book returned' })
  } catch (error) {
    logError(`Return book error: ${error.message}`, { filename: 'libraryController.js' })
    next(error)
  }
}

export const deleteBookIssue = async (req, res, next) => {
  try {
    const { issueId } = req.params
    logInfo('Deleting book issue', { filename: 'libraryController.js', issueId })
    await prisma.bookIssue.delete({ where: { id: parseInt(issueId) } })
    res.json({ message: 'Book issue deleted' })
  } catch (error) {
    logError(`Delete book issue error: ${error.message}`, { filename: 'libraryController.js' })
    next(error)
  }
}
