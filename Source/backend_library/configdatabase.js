const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// Support an in-memory sqlite DB for tests to avoid requiring Postgres during CI/local unit tests
if (process.env.NODE_ENV === 'test' && process.env.TEST_SQLITE === 'true') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: { timestamps: true },
    pool: { max: 1, min: 0 }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'librarydb',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres',
      port: parseInt(process.env.DB_PORT) || 5432,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

module.exports = sequelize;
