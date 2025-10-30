-- Migration: Thêm bookType và contentFile cho Books, thêm role 'vip' cho Users

-- 1. Thêm 'vip' vào enum_Users_role (nếu chưa có)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Users_role') THEN
        CREATE TYPE "public"."enum_Users_role" AS ENUM('admin', 'vip', 'user');
    ELSE
        ALTER TYPE "public"."enum_Users_role" ADD VALUE IF NOT EXISTS 'vip' BEFORE 'user';
    END IF;
END$$;

-- 2. Tạo enum_Books_bookType (nếu chưa có)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_Books_bookType') THEN
        CREATE TYPE "public"."enum_Books_bookType" AS ENUM('physical', 'online');
    END IF;
END$$;

-- 3. Thêm cột bookType vào Books (nếu chưa có)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Books' AND column_name = 'bookType'
    ) THEN
        ALTER TABLE "public"."Books" 
        ADD COLUMN "bookType" "public"."enum_Books_bookType" NOT NULL DEFAULT 'physical';
    END IF;
END$$;

-- 4. Thêm cột contentFile vào Books (nếu chưa có)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Books' AND column_name = 'contentFile'
    ) THEN
        ALTER TABLE "public"."Books" 
        ADD COLUMN "contentFile" VARCHAR(255);
    END IF;
END$$;

-- 5. Thêm comment cho các cột mới
COMMENT ON COLUMN "public"."Books"."bookType" IS 'Loại sách: physical (mượn trực tiếp), online (đọc trực tuyến)';
COMMENT ON COLUMN "public"."Books"."contentFile" IS 'Đường dẫn file nội dung sách (PDF, Word, TXT) cho sách online';

-- 6. Tạo bảng Favorites (nếu chưa có)
CREATE TABLE IF NOT EXISTS "public"."Favorites" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "public"."Users"("id") ON DELETE CASCADE,
    "bookId" INTEGER NOT NULL REFERENCES "public"."Books"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "unique_user_book_favorite" UNIQUE ("userId", "bookId")
);

-- 7. Tạo indexes cho Favorites (nếu chưa có)
CREATE INDEX IF NOT EXISTS "favorites_user_id" ON "public"."Favorites"("userId");
CREATE INDEX IF NOT EXISTS "favorites_book_id" ON "public"."Favorites"("bookId");

-- Hoàn tất
SELECT 'Migration completed successfully' AS status;
