# Library Management (DoAnWebNangCao)



## 1. Mô tả ngắn & tính năng chính

Ứng dụng quản lý thư viện cung cấp:
- Xác thực người dùng (JWT) và phân quyền role-based (admin, vip, user).
- Quản lý sách: CRUD, upload ảnh bìa, upload nội dung sách (PDF/DOC/DOCX/TXT), xem/đọc trực tuyến cho sách `online`.
- Quản lý mượn trả (borrows), favorites (yêu thích), dashboard thống kê và báo cáo.
- Upload xử lý: tối ưu ảnh bìa, giới hạn kích thước; chuyển đổi DOCX→HTML (mammoth) / DOC→PDF (LibreOffice) nếu cấu hình có sẵn.



## 2. Kiến trúc tổng thể & tech stack

- Backend: Node.js + Express, Sequelize (Postgres). Lý do: nhanh, phổ biến, dễ phát triển API REST.
- Frontend: React (Create React App), react-bootstrap, react-pdf, recharts. Lý do: phát triển UI nhanh, component hóa, thư viện chart/reader phong phú.
- Lưu trữ file: served từ thư mục `backend_library/uploads` (static route `/uploads`).
- Authentication: JWT; password hashed bằng `bcrypt`.

Sơ đồ tổng quát (tóm tắt):

Frontend (React) <--(REST/JSON+Bearer Token)--> Backend (Express) <---> Postgres (Sequelize)
                                               |
                                               `-- file uploads (local fs under `uploads/`)

Lý do chọn stack: dễ thiết lập, phù hợp prototyping và học thuật; nhiều thư viện hỗ trợ (mammoth, pdfjs, sharp, multer).

## 3. Hướng dẫn chạy nhanh (Local & Docker)

Yêu cầu: Node.js (16+), npm, PostgreSQL.

3.1. Biến môi trường chính (Backend)
- Thư mục backend: `Source/backend_library/.env.example` chứa các biến sau (copy sang `.env` và sửa):
  - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
  - JWT_SECRET, JWT_EXPIRES_IN
  - ALLOWED_ORIGINS

3.2. Chạy local (backend)
```powershell
cd Source/backend_library
npm install
# tạo .env (copy .env.example)
# chạy migration/seed (xem NOTE bên dưới)
node index.js
```

Chạy frontend (dev):
```powershell
cd Source/frontend_library
npm install
npm start
```

3.3. Docker
- Có Dockerfile cho backend/frontend; project có `docker-compose.yml` (root) — bạn có thể cấu hình env trong compose và chạy:
```powershell
docker-compose up --build
```

3.4. Seed & migration
- Migration SQL (an toàn): `Source/backend_library/migrations/*.sql` và helper `scripts/run_migration_sql.js`.
- Seed dữ liệu mẫu (users & books & borrows):
  - `cd Source/backend_library` và `node seed.js` — script idempotent: tạo admin `admin@library.com` (mật khẩu `Admin@1234`) và user `john@example.com` (`User@1234!`) cùng bộ sách mẫu.
  - Ngoài ra có `scripts/seedBooks.js`, `scripts/seedDualBooks.js` cho bộ sách cụ thể.

Lưu ý: nếu bạn dùng tính năng convert DOC/DOCX → PDF, cài thêm:
- `npm install mammoth` (đã thêm trong repo khi cần)
- LibreOffice (`soffice`) nếu muốn convert `.doc` → `.pdf` (phải cài trên host và vào PATH).

## 4. Tài khoản demo, Swagger, deploy

- Tài khoản demo (seed script):
  - Admin: email `admin@library.com` / password `Admin@1234`
  - User:  email `john@example.com`   / password `User@1234!`

- Swagger UI (API docs):
  - Sau khi chạy backend, mở: `http://localhost:5000/api-docs` 
  - Source swagger generation: `Source/backend_library/swagger.js` (specs được sinh tự động từ JSDoc trong routes/controllers).



## 5. Cấu trúc thư mục & conventions

Thư mục chính (tóm tắt):
- Source/
  - backend_library/
    - controllers/, models/, routes/, middleware/, migrations/, scripts/, uploads/
  - frontend_library/
    - src/components, src/context, src/services

Conventions:
- Coding style: JavaScript standard with spaces; use `async/await` for async flows.
- Validation: use `express-validator` via `middleware/validationMiddleware.js`.
- Commit: dùng commit message rõ ràng (feat/, fix/, docs/, chore/).
- Branch: phát triển trên `feature/*`, main trên `master` (repo dùng `master` branch hiện tại).

## 6. Kịch bản demo (Use cases chính)

1) Đăng nhập / đăng ký
 - UI: `/login`, `/register` (frontend)
 - API: `POST /api/auth/login`, `POST /api/auth/register`

2) Xem danh sách sách, tìm kiếm, phân trang
 - UI: `/books` (BookList)
 - API: `GET /api/books?page=1&limit=10&search=...&sortBy=createdAt`

3) Upload nội dung sách (Admin)
 - UI: Admin → Add/Edit book (BookForm) → upload `contentFile` (PDF/DOC/DOCX/TXT)
 - API: `POST /api/books` (multipart, field `contentFile`)
 - Nếu upload `.docx`, server sẽ cố convert → HTML (mammoth) và lưu `.html`; nếu `.doc` và LibreOffice có mặt thì convert → PDF.

4) Đọc sách trực tuyến (VIP/Admin)
 - UI: `/reader/:id` (BookReader) — yêu cầu user là `vip` hoặc `admin`.
 - API: `GET /api/books/:id/content` (có bảo mật; controller kiểm tra role trước khi trả file).

5) Quản lý Users (Admin)
 - UI: `/admin/users` — tạo, sửa, xóa, filter by role.
 - API: `GET/POST/PUT/DELETE /api/users`

6) Thống kê / Dashboard
 - UI: `/admin/dashboard` (AdminDashboard)
 - API: `GET /api/books/stats/overview`, `GET /api/users/stats`

## API docs & OpenAPI

- Swagger UI: `http://localhost:5000/api-docs`
- Source/entry: `Source/backend_library/swagger.js` — bạn có thể xuất specs JSON bằng cách require file và write `specs` ra một file JSON/YAML nếu cần.

Ví dụ xuất JSON (từ node REPL):
```js
const { specs } = require('./Source/backend_library/swagger');
require('fs').writeFileSync('openapi-spec.json', JSON.stringify(specs, null, 2));
```

## DB schema / ERD

Các bảng chính (tóm tắt):
- Users (id, username, email, password(hashed), role, ...)
- Books (id, title, author, category, description, coverImage, stock, bookType(enum: physical|online), contentFile)
- Borrows (id, userId, bookId, borrowDate, dueDate, returnDate, status)
- Favorites (id, userId, bookId)

ERD (ASCII sơ lược):

Users (1) --- (N) Borrows (N) --- (1) Books
Users (1) --- (N) Favorites (N) --- (1) Books

Migration scripts: `Source/backend_library/migrations/*.sql` (ví dụ `add_booktype_favorites.sql` thêm enum bookType, cột contentFile và tạo table Favorites).

## Ghi chú vận hành & mở rộng

- Để convert DOC/DOCX tự động: cài LibreOffice trên server (soffice) và/hoặc `npm install mammoth` cho chuyển docx→html.
- Tùy chọn lưu file: hiện code xóa file gốc sau convert; chỉnh nếu muốn giữ cả 2 bản.
- Cân nhắc sử dụng object storage (S3) khi chạy production thay vì filesystem.

---

