const fs = require('fs');
const path = require('path');
const sequelize = require('./configdatabase');
const { User, Book, Borrow, Favorite } = require('./models');

(async () => {
  try {
    // Trước khi gọi sync(), chạy migration SQL thủ công (nếu tồn tại) để tránh
    // các ALTER phức tạp mà Sequelize đôi khi sinh ra cho ENUM.
  const migrationPath = path.join(__dirname, '..', '..', 'migrations', 'add_booktype_favorites.sql');
    if (fs.existsSync(migrationPath)) {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      console.log('Chạy migration SQL trước khi sync() để đảm bảo enum và cột mới...');
      await sequelize.query(sql);
      console.log('Migration SQL (nếu có) đã được áp dụng.');
    }

    // Gọi sync() không dùng alter:true để tránh Sequelize tự động sinh ALTER có thể lỗi.
    await sequelize.sync();
    console.log('Đã đồng bộ database với models thành công (không dùng alter).');
  } catch (err) {
    console.error('Lỗi đồng bộ database:', err);
    console.log('\n⚠️  Nếu còn lỗi liên quan đến ENUM, hãy kiểm tra file migrations/add_booktype_favorites.sql và chạy thủ công hoặc dùng psql.');
  } finally {
    await sequelize.close();
  }
})();
