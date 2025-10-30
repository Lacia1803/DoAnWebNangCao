-- ============================================================================
-- Library Management System Database Backup
-- Database: librarydb
-- PostgreSQL Version: 12+
-- Generated: October 28, 2025
-- ============================================================================

-- Create Database (if not exists)
-- CREATE DATABASE librarydb;

-- Connect to database
-- \c librarydb

-- ============================================================================
-- DROP TABLES (if exists)
-- ============================================================================

DROP TABLE IF EXISTS "Books" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;

-- ============================================================================
-- TABLE STRUCTURE
-- ============================================================================

-- Users Table
CREATE TABLE "Users" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Users_role_check" CHECK (role IN ('admin', 'user'))
);

-- Books Table
CREATE TABLE "Books" (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    "coverImage" VARCHAR(255),
    stock INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES (for performance)
-- ============================================================================

CREATE INDEX idx_users_email ON "Users"(email);
CREATE INDEX idx_users_role ON "Users"(role);
CREATE INDEX idx_books_category ON "Books"(category);
CREATE INDEX idx_books_title ON "Books"(title);

-- ============================================================================
-- SAMPLE DATA (Test Accounts & Books)
-- ============================================================================

-- Insert Test Users (passwords are hashed with bcrypt)
-- Password for both: Test123456 (user), Admin123456 (admin)
INSERT INTO "Users" (username, email, password, role, "createdAt", "updatedAt") VALUES
('testuser', 'test@library.com', '$2a$10$encrypted_password_hash_here', 'user', NOW(), NOW()),
('admin', 'admin@library.com', '$2a$10$encrypted_password_hash_here', 'admin', NOW(), NOW());

-- Insert Sample Books
INSERT INTO "Books" (title, author, category, description, stock, "createdAt", "updatedAt") VALUES
('Sách mẫu', 'Tác giả A', 'Khoa học', 'Sách mẫu dùng để test API', 10, NOW(), NOW()),
('Lập trình Web Nâng Cao', 'Nguyễn Văn A', 'Công nghệ', 'Giáo trình lập trình web với React và Node.js', 5, NOW(), NOW()),
('Cơ sở dữ liệu', 'Trần Thị B', 'Công nghệ', 'Hướng dẫn PostgreSQL và MongoDB', 8, NOW(), NOW()),
('Văn học Việt Nam', 'Lê Văn C', 'Văn học', 'Tuyển tập văn học Việt Nam hiện đại', 12, NOW(), NOW()),
('Lịch sử thế giới', 'Phạm Thị D', 'Lịch sử', 'Tổng quan lịch sử thế giới từ cổ đại đến hiện đại', 6, NOW(), NOW());

-- ============================================================================
-- GRANTS (Optional - for production)
-- ============================================================================

-- GRANT ALL PRIVILEGES ON DATABASE librarydb TO your_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;

-- ============================================================================
-- RESTORE INSTRUCTIONS
-- ============================================================================

-- To restore this database backup, run:
-- psql -U postgres -d librarydb -f librarydb_backup.sql

-- Or create new database and restore:
-- createdb -U postgres librarydb
-- psql -U postgres -d librarydb -f librarydb_backup.sql

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. This backup contains table structure and sample data
-- 2. Password hashes need to be regenerated for security
-- 3. Adjust connection settings in backend .env file:
--    DB_HOST=localhost
--    DB_PORT=5432
--    DB_NAME=librarydb
--    DB_USER=postgres
--    DB_PASSWORD=your_password

-- ============================================================================
-- END OF BACKUP
-- ============================================================================
