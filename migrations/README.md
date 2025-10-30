````markdown
# Fix Database Schema - Manual Migration

## Vấn đề
Sequelize `sync({ alter: true })` gặp lỗi SQL khi tạo ENUM type và thêm cột đồng thời.

## Giải pháp

### Bước 1: Chạy Migration SQL

Mở PostgreSQL client và chạy file `migrations/add_booktype_favorites.sql` hoặc dùng lệnh:

```bash
# Linux/Mac
psql -U postgres -d librarydb -f migrations/add_booktype_favorites.sql

# Windows PowerShell (thay your_password)
$env:PGPASSWORD='your_password'
psql -U postgres -d librarydb -f migrations/add_booktype_favorites.sql
```

### Bước 2: Xác nhận Migration

Kiểm tra các thay đổi trong database:

```sql
-- Kiểm tra ENUM types
SELECT t.typname, e.enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname IN ('enum_Users_role', 'enum_Books_bookType')
ORDER BY t.typname, e.enumsortorder;

-- Kiểm tra cột mới trong Books
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Books' 
AND column_name IN ('bookType', 'contentFile');

-- Kiểm tra bảng Favorites
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'Favorites';
```

### Bước 3: Seed dữ liệu mẫu (tùy chọn)

Nếu muốn test với dữ liệu mẫu:

```sql
-- Thêm sách online mẫu
UPDATE "Books" SET "bookType" = 'online' WHERE id = 1;

-- Hoặc tạo user VIP
UPDATE "Users" SET "role" = 'vip' WHERE id = 2;
```


