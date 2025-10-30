-- Script cập nhật contentFile cho 10 sách online
-- Chạy sau khi đã tạo sách

-- Cập nhật contentFile cho các sách (giả sử ID từ 1-10, điều chỉnh nếu cần)
UPDATE "Books" SET "contentFile" = 'python-co-ban.txt' 
WHERE "title" = 'Lập trình Python cơ bản';

UPDATE "Books" SET "contentFile" = 'ai-machine-learning.txt' 
WHERE "title" = 'Trí tuệ nhân tạo và Machine Learning';

UPDATE "Books" SET "contentFile" = 'dac-nhan-tam.txt' 
WHERE "title" = 'Đắc Nhân Tâm';

-- Các sách còn lại để NULL (sẽ upload sau)
SELECT * FROM "Books" WHERE "bookType" = 'online';
