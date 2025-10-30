const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { handleBookContentUpload } = require('../middleware/uploadBookContent');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get all books with pagination and filtering
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, author, createdAt, stock]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of books
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 books:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 itemsPerPage:
 *                   type: integer
 */
router.get('/', bookController.getAllBooks);

/**
 * @swagger
 * /api/books/stats/overview:
 *   get:
 *     summary: Get book statistics
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Book statistics
 */
router.get('/stats/overview', authMiddleware.authenticateToken, bookController.getBookStats);

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     summary: Get book by ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Book details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Book not found
 */
router.get('/:id', bookController.getBookById);

/**
 * @swagger
 * /api/books:
 *   post:
 *     summary: Create new book (Admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               stock:
 *                 type: integer
 *               coverImage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Book created successfully
 *       401:
 *         description: Unauthorized
 */
router.post(
	'/',
	authMiddleware.authenticateToken,
	authMiddleware.requireAdmin,
	validate([
		body('title').trim().notEmpty().withMessage('Title is required'),
		body('author').trim().notEmpty().withMessage('Author is required'),
		body('category').trim().notEmpty().withMessage('Category is required'),
		body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
		,
		body('bookType').optional().isIn(['physical', 'online']).withMessage('bookType phải là physical hoặc online')
	]),
	handleBookContentUpload,
	bookController.createBook
);

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     summary: Update book (Admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               stock:
 *                 type: integer
 *               coverImage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       404:
 *         description: Book not found
 */
router.put(
	'/:id',
	authMiddleware.authenticateToken,
	authMiddleware.requireAdmin,
	validate([
		body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
		body('author').optional().trim().notEmpty().withMessage('Author cannot be empty'),
		body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
		body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
		body('coverImage').optional().isString().withMessage('coverImage must be a string'),
		body('bookType').optional().isIn(['physical', 'online']).withMessage('bookType phải là physical hoặc online')
	]),
	handleBookContentUpload,
	bookController.updateBook
);

// Lấy nội dung sách (VIP/Admin)
router.get('/:id/content', authMiddleware.authenticateToken, bookController.getBookContent);

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     summary: Delete book (Admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *       404:
 *         description: Book not found
 */
router.delete('/:id', authMiddleware.authenticateToken, bookController.deleteBook);

/**
 * @swagger
 * /api/books/upload:
 *   post:
 *     summary: Upload book cover image (Admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cover:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post('/upload', authMiddleware.authenticateToken, authMiddleware.requireAdmin, upload.single('cover'), bookController.uploadCover);

/**
 * @swagger
 * /api/books/upload/{filename}:
 *   delete:
 *     summary: Delete uploaded cover image (Admin only)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 */
router.delete('/upload/:filename', authMiddleware.authenticateToken, bookController.deleteCoverImage);

module.exports = router;
