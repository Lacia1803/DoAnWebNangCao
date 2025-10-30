const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Library Management System API',
      version: '1.0.0',
      description: 'A comprehensive library management system with user authentication, book management, and borrow tracking',
      contact: {
        name: 'API Support',
        email: 'support@library.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        UserBrief: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', example: 'john@example.com' }
          }
        },
        BookBrief: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Clean Code' },
            author: { type: 'string', example: 'Robert C. Martin' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Book: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'The Great Gatsby' },
            author: { type: 'string', example: 'F. Scott Fitzgerald' },
            category: { type: 'string', example: 'Fiction' },
            description: { type: 'string', example: 'A classic American novel' },
            coverImage: { type: 'string', example: '/uploads/book1.jpg' },
            stock: { type: 'integer', example: 5 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Borrow: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            bookId: { type: 'integer', example: 1 },
            borrowDate: { type: 'string', format: 'date-time' },
            dueDate: { type: 'string', format: 'date-time' },
            returnDate: { type: 'string', format: 'date-time', nullable: true },
            status: { type: 'string', enum: ['borrowed', 'returned', 'overdue'], example: 'borrowed' },
            overdueReminderSent: { type: 'boolean', example: false },
            lastReminderAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        BorrowWithRelations: {
          allOf: [
            { $ref: '#/components/schemas/Borrow' },
            {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/UserBrief' },
                book: { $ref: '#/components/schemas/BookBrief' }
              }
            }
          ]
        },
        BorrowListResponse: {
          type: 'array',
          items: { $ref: '#/components/schemas/BorrowWithRelations' }
        },
        PaginatedBorrowListResponse: {
          type: 'object',
          properties: {
            borrows: {
              type: 'array',
              items: { $ref: '#/components/schemas/BorrowWithRelations' }
            },
            totalItems: { type: 'integer', example: 12 },
            totalPages: { type: 'integer', example: 2 },
            currentPage: { type: 'integer', example: 1 }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Error message' },
            error: { type: 'string', example: 'Detailed error information' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
