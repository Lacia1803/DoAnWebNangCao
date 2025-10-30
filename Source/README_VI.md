# Hướng dẫn chạy dự án 

Tài liệu này mô tả cách cài đặt và chạy toàn bộ dự án thư viện trên máy Windows (PowerShell). Bao gồm backend (Node.js + Express) và frontend (React CRA).

## Yêu cầu

- Node.js >= 18
- npm
- PostgreSQL (v12+)
- pgAdmin (khuyến nghị để chạy SQL với encoding an toàn)
- (Tùy chọn) psql trong PATH nếu muốn chạy migration từ PowerShell

## Bước 1 — Chuẩn bị cơ sở dữ liệu

1. Tạo database mới (pgAdmin hoặc psql):

```sql
CREATE DATABASE librarydb;
```

2. Chạy migration để thêm enum/cột và bảng Favorites (bắt buộc để hỗ trợ sách online và yêu thích):

Cách A (khuyến nghị trên Windows): mở pgAdmin → kết nối database `librarydb` → mở Query Tool → chạy file:

```
Source/backend_library/migrations/add_booktype_favorites.sql
```

Cách B (PowerShell + psql): sử dụng script helper mới `run-migration-and-seed.ps1` (yêu cầu `psql` trong PATH). Script này tự đặt mã trang console sang UTF-8 và sẽ dừng khi gặp lỗi:

```powershell
cd .\Source\backend_library
.\run-migration-and-seed.ps1
# Hoặc truyền tham số: .\run-migration-and-seed.ps1 -DBUser postgres -DBName librarydb
```

Lưu ý quan trọng về encoding (tiếng Việt):
- Nếu chạy SQL bằng `psql` trong PowerShell, trước khi chạy hãy chuyển mã trang console sang UTF-8:

```powershell
chcp 65001
```

- Trong `psql`, thiết lập encoding:

```
\encoding UTF8
\i path/to/your/file.sql
```

- Dùng pgAdmin Query Tool sẽ tránh hầu hết lỗi encoding trên Windows.

3. (Tùy chọn) Chạy seed để tạo sách online mẫu và gán file nội dung:

Chạy các file SQL trong thư mục `Source/backend_library/seeds/` bằng pgAdmin:
- `sample-books-online.sql`
- `update-book-content.sql`

File nội dung mẫu đã được đặt sẵn trong `Source/backend_library/uploads/book-contents/` (ví dụ `thu-nghiem-tieng-viet.txt`).

## Bước 2 — Cài đặt Backend

1. Mở PowerShell, vào thư mục backend:

```powershell
cd .\Source\backend_library
npm install
```

2. Tạo file `.env` từ `.env.example` và sửa các biến:

```powershell
copy .env.example .env
# hoặc Copy-Item .env.example .env
```

Sửa các biến kết nối DB (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) và `JWT_SECRET`.

3. Khởi động backend:

```powershell
npm run dev   # nodemon (dev)
# hoặc
npm start     # production
```

Backend mặc định chạy trên: `http://localhost:5000`
- Swagger API docs: `http://localhost:5000/api-docs`
- Static uploads: `http://localhost:5000/uploads/...`

## Bước 3 — Cài đặt Frontend

1. Mở PowerShell mới, vào thư mục frontend:

```powershell
cd .\Source\frontend_library
npm install
copy .env.example .env
npm start
```

2. Frontend mặc định chạy trên `http://localhost:3000`. Môi trường dev dùng CRA proxy (config trong `package.json`) để chuyển API sang `http://localhost:5000`.

## Endpoints quan trọng

- Auth:
  - `POST /api/auth/register` — đăng ký
  - `POST /api/auth/login` — đăng nhập

- Books:
  - `GET /api/books` — danh sách sách (lọc, phân trang)
  - `GET /api/books/:id` — chi tiết
  - `GET /api/books/:id/content` — nội dung (chỉ vip/admin)
  - `POST /api/books` — thêm sách (Admin)
  - `PUT /api/books/:id` — cập nhật (Admin)
  - `DELETE /api/books/:id` — xóa (Admin)

- Users:
  - `GET /api/users` — danh sách user (Admin)
  - `POST /api/users` — tạo user (Admin)
  - `GET /api/users/stats` — thống kê role (Admin)

- Favorites:
  - `GET /api/favorites/my`
  - `GET /api/favorites/check/:bookId`
  - `POST /api/favorites` (body: { bookId })
  - `DELETE /api/favorites/:bookId`

- Borrows:
  - `POST /api/borrows` — mượn sách
  - `POST /api/borrows/{id}/return` — trả sách
  - `GET /api/borrows/my` — lịch sử mượn bản thân

## Quy tắc nghiệp vụ quan trọng

- Roles: `user`, `vip` (Người dùng trả phí), `admin`.
- Chỉ tối đa 3 admin và tối đa 5 vip; ràng buộc được kiểm tra ở backend khi tạo/cập nhật user.
- Sách có `bookType`: `physical` (mượn trực tiếp) hoặc `online` (đọc trực tuyến).
- Chỉ `vip` và `admin` được phép đọc nội dung `online`.

## Upload nội dung sách

- Admin có thể upload file nội dung (field `contentFile`) cho sách: PDF, DOC/DOCX, TXT.
- Giới hạn file size: 150MB.
- File lưu tại: `Source/backend_library/uploads/book-contents/` và được phục vụ qua `/uploads/book-contents/<filename>`.
- Frontend hỗ trợ đọc PDF (react-pdf) và TXT inline; file Word sẽ được tải xuống khi người dùng nhấp.

## Kiểm tra hiển thị tiếng Việt

Đã thêm file mẫu `thu-nghiem-tieng-viet.txt` trong thư mục uploads. Sau khi backend chạy, mở:

```
http://localhost:5000/uploads/book-contents/thu-nghiem-tieng-viet.txt
```

Nếu bạn thấy dấu bị sai:
- Kiểm tra `.env` và DB encoding
- Chạy `chcp 65001` trong PowerShell trước khi chạy psql hoặc các script SQL
- Trong psql dùng `\encoding UTF8`

## Lỗi thường gặp & khắc phục

- Lỗi khi chạy migration liên quan đến ENUM (Postgres):
  - Sử dụng `migrations/add_booktype_favorites.sql` qua pgAdmin Query Tool (an toàn)
  - Hoặc dùng `run-migration.ps1` (PowerShell) — script đã xử lý biến môi trường

- CORS: backend tự động cho phép localhost/127.0.0.1 ở chế độ development. Đặt `ALLOWED_ORIGINS` trong `.env` khi deploy production.

- Port conflict: đổi `PORT` trong backend `.env` hoặc `REACT_APP_API_BASE_URL` trong frontend `.env` nếu cần.

## Một số lệnh hữu dụng (PowerShell)

Kiểm tra server đang chạy:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/" -Method Get
```

Xem sách đầu tiên:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/books" -Method Get | ConvertTo-Json -Depth 3
```



---
Phiên bản tài liệu: 1.0.0 — Cập nhật: October 29, 2025
