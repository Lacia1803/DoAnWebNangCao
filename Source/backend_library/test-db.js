const sequelize = require('./configdatabase');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Kết nối thành công tới PostgreSQL!');
  } catch (error) {
    console.error('Kết nối thất bại:', error);
  } finally {
    await sequelize.close();
  }
})();
