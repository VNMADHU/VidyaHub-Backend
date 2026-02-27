import express from 'express'
import {
  listBooks,
  createBook,
  updateBook,
  deleteBook,
  listBookIssues,
  issueBook,
  returnBook,
  deleteBookIssue,
} from '../controllers/libraryController.js'

const router = express.Router()

// Books
router.get('/books', listBooks)
router.post('/books', createBook)
router.patch('/books/:bookId', updateBook)
router.delete('/books/:bookId', deleteBook)

// Book Issues
router.get('/issues', listBookIssues)
router.post('/issues', issueBook)
router.patch('/issues/:issueId/return', returnBook)
router.delete('/issues/:issueId', deleteBookIssue)

export default router
