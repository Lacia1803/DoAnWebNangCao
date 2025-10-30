const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();
const { swaggerUi, specs } = require('./swagger');
const yaml = require('js-yaml');
const logger = require('./config/logger');

const app = express();

// HTTP request logging
app.use(morgan('combined', { stream: logger.stream }));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiting (disabled in development by default)
const isProd = process.env.NODE_ENV === 'production';
const disableRateLimitInDev = process.env.RATE_LIMIT_DISABLE_DEV !== 'false'; // default true

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || (15 * 60 * 1000);
const API_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100;
const AUTH_MAX = parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10;

// No-op middleware when rate limit is disabled
const passThrough = (req, res, next) => next();

// In dev, disable limiter unless explicitly turned on
const authLimiter = (!isProd && disableRateLimitInDev)
  ? passThrough
  : rateLimit({
      windowMs: WINDOW_MS,
      max: AUTH_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many authentication attempts, please try again later.'
    });

const apiLimiter = (!isProd && disableRateLimitInDev)
  ? passThrough
  : rateLimit({
      windowMs: WINDOW_MS,
      max: API_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many requests, please try again later.'
    });

// CORS configuration with allowed origins
// - Reads ALLOWED_ORIGINS from env (comma-separated, trims spaces)
// - In non-production, auto-allows localhost/127.0.0.1 to reduce dev friction
const rawAllowed = process.env.ALLOWED_ORIGINS;
let allowedOrigins = [];

if (rawAllowed && rawAllowed.trim().length) {
  allowedOrigins = rawAllowed.split(',').map(o => o.trim()).filter(Boolean);
} else if (process.env.NODE_ENV !== 'production') {
  allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser clients or same-origin requests
    if (!origin) return callback(null, true);

    // In development, allow any localhost/127.0.0.1/LAN origin (strip trailing slash for comparison)
    if (process.env.NODE_ENV !== 'production') {
      const cleanOrigin = origin.replace(/\/$/, ''); // Remove trailing slash
      const localOrLAN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|10\.(?:\d{1,3}\.){2}\d{1,3}|192\.168\.(?:\d{1,3})\.\d{1,3}|172\.(?:1[6-9]|2[0-9]|3[0-1])\.(?:\d{1,3})\.\d{1,3})(?::\d+)?$/.test(cleanOrigin);
      if (localOrLAN) return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Log denied origin for easier debugging
    logger.warn('CORS denied', { origin });
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Library API is working!' });
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Library API Docs'
}));

// Expose raw OpenAPI specs as JSON and YAML
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

app.get('/openapi.yaml', (req, res) => {
  res.setHeader('Content-Type', 'application/x-yaml');
  try {
    const yamlStr = yaml.dump(specs);
    res.send(yamlStr);
  } catch (e) {
    res.status(500).json({ message: 'Failed to generate YAML', error: e.message });
  }
});

const bookRouter = require('./routes/book');
const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const borrowRouter = require('./routes/borrow');
const favoriteRouter = require('./routes/favorite');

app.use('/api/books', apiLimiter, bookRouter);
app.use('/api/users', apiLimiter, userRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/borrows', apiLimiter, borrowRouter);
app.use('/api/favorites', apiLimiter, favoriteRouter);

// Error handling middleware (Middleware xử lý lỗi)
app.use((err, req, res, next) => {
  logger.logError(err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id
  });
  
  res.status(err.status || 500).json({ 
    message: err.message || 'Đã xảy ra lỗi server!', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// 404 handler (Xử lý route không tồn tại)
app.use((req, res) => {
  logger.warn('404 Không tìm thấy', { method: req.method, url: req.url, ip: req.ip });
  res.status(404).json({ message: 'Route không tồn tại' });
});

const PORT = process.env.PORT || 5000;

// Only start server if not in test mode (Chỉ khởi động server nếu không ở chế độ test)
if (process.env.NODE_ENV !== 'test') {
  // Start overdue job if enabled (Khởi động job kiểm tra quá hạn nếu được bật)
  const { startOverdueJob } = require('./jobs/overdueJob');
  startOverdueJob();

  app.listen(PORT, () => {
    logger.info(`Server đang chạy tại http://localhost:${PORT}`);
    logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });
}

// Export app for testing
module.exports = app;
