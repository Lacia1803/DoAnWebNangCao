const { sequelize, Book } = require('../models');

// Ensure DB schema matches latest models and seed minimal data for tests
beforeAll(async () => {
  // Recreate schema for each test suite for isolation and to pick up new fields
  await sequelize.sync({ force: true });

  // Seed a couple of books so tests can reference bookId=1
  await Book.bulkCreate([
    { title: 'Seed Book 1', author: 'Author 1', category: 'General', description: 'Test book 1', stock: 5 },
    { title: 'Seed Book 2', author: 'Author 2', category: 'General', description: 'Test book 2', stock: 2 }
  ], { returning: true });
});

// Do not close sequelize here to avoid interfering with other suites; Jest will handle process exit.
