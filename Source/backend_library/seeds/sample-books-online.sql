-- Script tạo 10 sách trực tuyến với nội dung mẫu
-- Chạy sau khi đã migration xong

-- 1. Lập trình Python cơ bản
INSERT INTO "Books" ("title", "author", "category", "description", "stock", "bookType", "contentFile", "createdAt", "updatedAt")
VALUES (
  'Lập trình Python cơ bản',
  'Nguyễn Văn A',
  'technology',
  'Cuốn sách hướng dẫn lập trình Python từ cơ bản đến nâng cao, phù hợp cho người mới bắt đầu.',
  0,
  'online',
  NULL,
  NOW(),
  NOW()
);

-- 2. Trí tuệ nhân tạo và Machine Learning
INSERT INTO "Books" ("title", "author", "category", "description", "stock", "bookType", "contentFile", "createdAt", "updatedAt")
VALUES (
  'Trí tuệ nhân tạo và Machine Learning',
  'Trần Thị B',
  'technology',
  'Khám phá thế giới AI và Machine Learning với các ví dụ thực tế và bài tập thực hành.',
  0,
  'online',
  NULL,
  NOW(),
  NOW()
);

-- 3. Đắc Nhân Tâm - Dale Carnegie
INSERT INTO "Books" ("title", "author", "category", "description", "stock", "bookType", "contentFile", "createdAt", "updatedAt")
VALUES (
  'Đắc Nhân Tâm',
  'Dale Carnegie',
  'self-help',
  'Nghệ thuật giao tiếp và tạo ảnh hưởng đến người khác. Một trong những cuốn sách kinh điển về phát triển bản thân.',
  0,
  'online',
  NULL,
  NOW(),
  NOW()
);

-- 4. Tư duy nhanh và chậm
INSERT INTO "Books" ("title", "author", "category", "description", "stock", "bookType", "contentFile", "createdAt", "updatedAt")
VALUES (
  'Tư duy nhanh và chậm',
  'Daniel Kahneman',
  'psychology',
  'Khám phá hai hệ thống tư duy của con người và cách chúng ảnh hưởng đến quyết định hàng ngày.',
  0,
  'online',
  NULL,
  NOW(),
  NOW()
);

-- 5. Clean Code - Mã nguồn sạch
INSERT INTO "Books" ("title", "author", "category", "description", "stock", "bookType", "contentFile", "createdAt", "updatedAt")
VALUES (
  'Clean Code - Mã nguồn sạch',
  'Robert C. Martin',
  'technology',
  'Hướng dẫn viết code chuyên nghiệp, dễ đọc và dễ bảo trì. Cuốn sách must-read cho mọi lập trình viên.',
  0,
  'online',
  NULL,
  NOW(),
  NOW()
);

-- 6. Sapiens: Lược sử loài người
INSERT INTO "Books" ("title", "author", "category", "description", "stock", "bookType", "contentFile", "createdAt", "updatedAt")
VALUES (
  'Sapiens: Lược sử loài người',
  'Yuval Noah Harari',
  'history',
  'Câu chuyện về sự tiến hóa của loài người từ thời kỳ đồ đá đến hiện đại.',
  0,
  'online',
  NULL,
  NOW(),
  NOW()
);

-- 7. Kinh tế học vĩ mô
INSERT INTO "Books" ("title", "author", "category", "description", "stock", "bookType", "contentFile", "createdAt", "updatedAt")
VALUES (
  'Kinh tế học vĩ mô',
  'N. Gregory Mankiw',
  'business',
  'Giáo trình kinh tế vĩ mô với các khái niệm cơ bản về GDP, lạm phát, thất nghiệp và chính sách tài chính.',
  0,
  'online',
  NULL,
  NOW(),
  NOW()
);

-- 8. Nghệ thuật tinh tế của việc đếch quan tâm
INSERT INTO "Books" ("title", "author", "category", "description", "stock", "bookType", "contentFile", "createdAt", "updatedAt")
VALUES (
  'Nghệ thuật tinh tế của việc đếch quan tâm',
  'Mark Manson',
  'self-help',
  'Cách sống tự do và hạnh phúc hơn bằng cách chọn lọc những gì thực sự quan trọng trong cuộc sống.',
  0,
  'online',
  NULL,
  NOW(),
  NOW()
);

-- 9. Design Patterns - Gang of Four
INSERT INTO "Books" ("title", "author", "category", "description", "stock", "bookType", "contentFile", "createdAt", "updatedAt")
VALUES (
  'Design Patterns: Elements of Reusable Object-Oriented Software',
  'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
  'technology',
  'Các mẫu thiết kế phần mềm cổ điển giúp giải quyết các vấn đề phổ biến trong lập trình hướng đối tượng.',
  0,
  'online',
  NULL,
  NOW(),
  NOW()
);

-- 10. Tâm lý học tội phạm
INSERT INTO "Books" ("title", "author", "category", "description", "stock", "bookType", "contentFile", "createdAt", "updatedAt")
VALUES (
  'Tâm lý học tội phạm',
  'Lê Thị C',
  'psychology',
  'Phân tích tâm lý và hành vi của tội phạm, giúp hiểu rõ hơn về động cơ và nguyên nhân của tội ác.',
  0,
  'online',
  NULL,
  NOW(),
  NOW()
);

SELECT 'Đã tạo 10 sách trực tuyến thành công!' AS message;
