# Library Management System - Backend

Backend API cho hệ thống quản lý thư viện, xây dựng với Node.js, Express, và PostgreSQL. Dự án đã chuẩn hóa bảo mật, logging, response format và có tài liệu Swagger.

## 🚀 Tech Stack

- Node.js & Express 5
- PostgreSQL + Sequelize ORM
- JWT auth + bcryptjs
- Helmet, CORS, Rate limiting
- Winston + Morgan logging (rotate files)
- Swagger (swagger-jsdoc + swagger-ui-express)
- Multer + Sharp (upload ảnh bìa sách)
- Tùy chọn Redis cache (ioredis) qua biến môi trường
- Email qua Nodemailer (welcome/borrow/return/overdue)

## 📋 Prerequisites

- Node.js (>= 18 khuyến nghị)
- PostgreSQL (>= 12)
- npm hoặc yarn

## ⚙️ Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd backend_library
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình Database

Tạo database PostgreSQL:

```sql
CREATE DATABASE librarydb;
```

### 4. Cấu hình Environment Variables

Copy file `.env.example` thành `.env`:

```bash
copy .env.example .env
```

Xem và cập nhật các biến trong `.env` theo nhu cầu. Một số biến quan trọng:

- PORT, NODE_ENV, ALLOWED_ORIGINS
- JWT_SECRET
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- Redis: REDIS_ENABLED=false (mặc định tắt ở dev), REDIS_HOST, REDIS_PORT
- Email: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM (nếu không cấu hình, hệ thống chỉ log “Email would be sent …” và không gửi thật)
- Overdue job: OVERDUE_CRON_ENABLED=false, OVERDUE_CHECK_MINS=60

### 5. Sync Database

```bash
node sync.js
```

## 🏃‍♂️ Chạy ứng dụng

### Development mode (với nodemon)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

Tài liệu Swagger: `http://localhost:5000/api-docs`

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập

### Books

- `GET /api/books` - Lấy danh sách tất cả sách
- `GET /api/books/:id` - Lấy chi tiết một cuốn sách
- `POST /api/books` - Thêm sách mới (Admin only)
- `PUT /api/books/:id` - Cập nhật thông tin sách (Admin only)
- `DELETE /api/books/:id` - Xóa sách (Admin only)

### Users

- `GET /api/users` - Lấy danh sách users (Admin only)
- `GET /api/users/:id` - Lấy thông tin user
- `PUT /api/users/:id` - Cập nhật thông tin user
- `DELETE /api/users/:id` - Xóa user (Admin only)

### Borrows

- `POST /api/borrows` – Mượn sách (auth required)
- `POST /api/borrows/{id}/return` – Trả sách (auth required)
- `GET /api/borrows/my` – Lịch sử mượn của chính mình (auth required)
- `GET /api/borrows` – Danh sách tất cả phiếu mượn (admin)
- `PATCH /api/borrows/overdue` – Đánh dấu quá hạn + gửi nhắc (admin)

## 🧪 Test & Coverage

Chạy test backend (Jest + Supertest):

```powershell
cd .\backend_library
npm test
```

Trong môi trường test, việc gửi email sẽ bị vô hiệu (log message thay vì gửi thật) và DB sẽ được sync schema tự động, seed dữ liệu tối thiểu phục vụ test.

## 🧪 Test API thủ công

Sử dụng Postman hoặc curl:

```bash
# Test root endpoint
curl http://localhost:5000/

# Test books endpoint
curl http://localhost:5000/api/books
```

### PowerShell:

```powershell
# Test root endpoint
Invoke-RestMethod -Uri "http://localhost:5000/" -Method Get

# Test books endpoint
Invoke-RestMethod -Uri "http://localhost:5000/api/books" -Method Get
```

## 📁 Cấu trúc Project

```
backend_library/
├── controllers/          # Business logic
│   └── authController.js
├── middleware/          # Custom middleware
│   └── authMiddleware.js
├── models/             # Database models
│   ├── user.js
│   └── book.js
├── routes/             # API routes
│   ├── auth.js
│   ├── book.js
│   └── user.js
├── configdatabase.js   # Database connection
├── index.js           # Entry point + Swagger + rate limit
├── sync.js           # Database sync
├── package.json
├── .env.example      # Environment variables template
└── .env              # Environment variables
```

## 🔒 Authentication

API sử dụng JWT (JSON Web Tokens) cho authentication. 

Để truy cập các protected routes, thêm token vào header:

```
Authorization: Bearer <your-jwt-token>
```

## 🛠️ Troubleshooting

### Port đã được sử dụng

Nếu port 5000 đã được sử dụng, thay đổi `PORT` trong file `.env`

### Lỗi kết nối database

- Kiểm tra PostgreSQL đã chạy chưa
- Xác nhận thông tin DB trong `.env` đúng
- Kiểm tra database đã được tạo chưa

### Module not found

Chạy lại:

```bash
npm install
```

## 📝 Notes

- Đảm bảo file `.env` không được commit lên git (đã có trong `.gitignore`)
- Thay đổi `JWT_SECRET` trong production
- Cập nhật CORS origins trong `index.js` cho phù hợp với frontend URL
 - Redis mặc định tắt ở dev; bật khi có Redis server (REDIS_ENABLED=true)
 - Job quét quá hạn chỉ chạy khi bật `OVERDUE_CRON_ENABLED=true`
 - Ảnh upload nằm ở thư mục `uploads/` (exposed qua `/uploads`)

## 👥 Roles

- **admin**: Toàn quyền quản lý (CRUD books, users)
- **user**: Chỉ xem thông tin sách và profile

## 🔄 Development Workflow

1. Tạo/sửa models trong `models/`
2. Tạo/sửa controllers trong `controllers/`
3. Tạo/sửa routes trong `routes/`
4. Test API endpoints
5. Deploy

---

**Author**: Library Team  
**Version**: 1.1.0
