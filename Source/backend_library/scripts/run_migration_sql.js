const fs = require('fs');
const path = require('path');
const sequelize = require('../configdatabase');

(async () => {
  try {
  const sqlPath = path.join(__dirname, '..', '..', 'migrations', 'add_booktype_favorites.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error('Không tìm thấy file migration:', sqlPath);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Đang chạy migration SQL...');
    // Execute as a single query. Some Postgres DO $$ blocks contain semicolons; Sequelize can run them.
    await sequelize.query(sql);

    console.log('Migration SQL đã chạy xong.');
    process.exit(0);
  } catch (err) {
    console.error('Lỗi khi chạy migration SQL:', err);
    process.exit(2);
  } finally {
    try { await sequelize.close(); } catch (e) {}
  }
})();
