# Library Management System - Frontend

Ứng dụng React cho hệ thống quản lý thư viện.

## Cấu hình môi trường

Tạo file `.env` từ mẫu:

```powershell
copy .env.example .env
```

Biến quan trọng:

- `REACT_APP_API_BASE_URL` (mặc định `http://localhost:5000/api`)

## Chạy ứng dụng

```powershell
npm install
npm start
```

Truy cập: http://localhost:3000

## Build production

```powershell
npm run build
```

## Ghi chú

- Ứng dụng sử dụng `localStorage` để lưu JWT; khi 401 sẽ tự động chuyển về `/login`.
- Nếu backend chạy trên host/port khác, cập nhật `REACT_APP_API_BASE_URL` trong `.env`.
- Các endpoint mượn/trả sách đã đồng bộ với backend:
	- POST `/borrows` – mượn sách
	- POST `/borrows/:id/return` – trả sách
	- GET `/borrows/my` – lịch sử của tôi
	- GET `/borrows` – danh sách (admin)
	- PATCH `/borrows/overdue` – cập nhật quá hạn (admin)
