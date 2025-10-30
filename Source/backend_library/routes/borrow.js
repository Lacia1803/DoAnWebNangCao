const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

/**
 * @swagger
 * /api/borrows:
 *   post:
 *     summary: Borrow a book
 *     tags: [Borrows]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookId]
 *             properties:
 *               bookId:
 *                 type: integer
 *                 example: 1
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: ISO date; defaults to +14 days if omitted
 *     responses:
 *       201:
 *         description: Borrow created
 *       400:
 *         description: Validation error or business rule violation
 *       404:
 *         description: Book not found
 */
router.post(
	'/',
	authenticateToken,
	validate([
		body('bookId').isInt({ min: 1 }).withMessage('bookId must be a positive integer'),
		body('dueDate').optional().isISO8601().toDate().withMessage('dueDate must be a valid date')
	]),
	async (req, res, next) => {
		// Default dueDate to +14 days if not provided
		if (!req.body.dueDate) {
			const now = new Date();
			now.setDate(now.getDate() + 14);
			req.body.dueDate = now;
		}
		return borrowController.borrowBook(req, res, next);
	}
);

/**
 * @swagger
 * /api/borrows/{id}/return:
 *   post:
 *     summary: Return a borrowed book
 *     tags: [Borrows]
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
 *         description: Book returned
 *       400:
 *         description: Already returned
 *       404:
 *         description: Borrow record not found
 */
router.post(
	'/:id/return',
	authenticateToken,
	validate([
		param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')
	]),
	borrowController.returnBook
);

/**
 * @swagger
 * /api/borrows/my:
 *   get:
 *     summary: Get current user's borrow records
 *     tags: [Borrows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [borrowed, returned, overdue]
 *     responses:
 *       200:
 *         description: List of my borrows
 */
router.get(
	'/my',
	authenticateToken,
	validate([
		query('status').optional().isIn(['borrowed', 'returned', 'overdue']).withMessage('Invalid status')
	]),
	borrowController.getUserBorrows
);

/**
 * @swagger
 * /api/borrows:
 *   get:
 *     summary: Admin list of all borrows
 *     tags: [Borrows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [borrowed, returned, overdue]
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
 *     responses:
 *       200:
 *         description: Paginated list of borrows
 *       403:
 *         description: Admin only
 */
router.get(
	'/',
	authenticateToken,
	requireAdmin,
	validate([
		query('status').optional().isIn(['borrowed', 'returned', 'overdue']).withMessage('Invalid status'),
		query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
		query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100')
	]),
	borrowController.getAllBorrows
);

/**
 * @swagger
 * /api/borrows/overdue:
 *   patch:
 *     summary: Update overdue borrows (admin)
 *     tags: [Borrows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated count returned
 *       403:
 *         description: Admin only
 */
router.patch(
	'/overdue',
	authenticateToken,
	requireAdmin,
	borrowController.updateOverdueBorrows
);

module.exports = router;
