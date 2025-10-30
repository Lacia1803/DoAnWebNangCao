const { sequelize, Book, User } = require('../models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    const bookCount = await Book.count();
    const userCount = await User.count();
    const withContent = await Book.count({ where: { contentFile: { [Symbol.for('ne')] : null } } });
    console.log(`Books: ${bookCount}`);
    console.log(`Users: ${userCount}`);
  } catch (e) {
    console.error('DB check failed', e);
  } finally {
    await sequelize.close();
  }
})();
