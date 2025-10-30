# HƯỚNG DẪN SETUP DATABASE VÀ SEED DỮ LIỆU

## Bước 1: Chạy Migration (Thêm bookType, VIP role, Favorites)

Mở **pgAdmin** → Kết nối **librarydb** → Query Tool → Chạy file:
```
backend_library/migrations/add_booktype_favorites.sql
```

Hoặc copy-paste nội dung SQL vào Query Tool và Execute (F5).

## Bước 2: Tạo 10 sách trực tuyến mẫu

Trong Query Tool, chạy tiếp file:
```
backend_library/seeds/sample-books-online.sql
```

## Bước 3: Cập nhật contentFile cho một số sách

Chạy file:
```
backend_library/seeds/update-book-content.sql
```

## Bước 4: Kiểm tra

```sql
-- Kiểm tra sách online đã được tạo
SELECT id, title, bookType, contentFile FROM "Books" WHERE bookType = 'online';

-- Kiểm tra role VIP
SELECT * FROM "Users" WHERE role = 'vip';

-- Kiểm tra bảng Favorites
SELECT * FROM "Favorites";
```

## Nội dung file TXT đã được tạo sẵn:

1. **python-co-ban.txt** - Lập trình Python cơ bản (đầy đủ nội dung)
2. **ai-machine-learning.txt** - AI & ML (đầy đủ nội dung)  
3. **dac-nhan-tam.txt** - Đắc Nhân Tâm (trích dẫn chính)

Các file nằm trong:
```
backend_library/uploads/book-contents/
```

## Test tính năng:

1. **Tạo tài khoản VIP** (trong Admin → Users)
2. **Login bằng VIP**
3. **Truy cập Books** → Chọn sách online
4. **Click "Đọc sách"** → Xem nội dung

## Các sách online đã tạo:

1. Lập trình Python cơ bản (có nội dung TXT)
2. Trí tuệ nhân tạo và Machine Learning (có nội dung TXT)
3. Đắc Nhân Tâm (có nội dung TXT)
4. Tư duy nhanh và chậm
5. Clean Code - Mã nguồn sạch
6. Sapiens: Lược sử loài người
7. Kinh tế học vĩ mô
8. Nghệ thuật tinh tế của việc đếch quan tâm
9. Design Patterns - Gang of Four
10. Tâm lý học tội phạm

Các sách 4-10 có thể upload file sau qua Admin interface!
