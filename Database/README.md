# Database Information

## Database System: PostgreSQL

### Connection Details
- **Host**: localhost
- **Port**: 5432
- **Database Name**: librarydb
- **User**: postgres

### Tables

#### 1. Users Table
```sql
- id: SERIAL PRIMARY KEY
- username: VARCHAR(255)
- email: VARCHAR(255) UNIQUE
- password: VARCHAR(255) (hashed with bcrypt)
- role: ENUM('admin', 'user')
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

#### 2. Books Table
```sql
- id: SERIAL PRIMARY KEY
- title: VARCHAR(255)
- author: VARCHAR(255)
- category: VARCHAR(255)
- description: TEXT
- coverImage: VARCHAR(255)
- stock: INTEGER
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

### Restore Instructions

1. Create database:
```bash
createdb -U postgres librarydb
```

2. Restore from backup:
```bash
psql -U postgres -d librarydb -f librarydb_backup.sql
```

3. Or use sync.js in backend:
```bash
cd backend_library
node sync.js
```

### Test Accounts

**Admin Account:**
- Email: admin@library.com
- Password: Admin123456

**User Account:**
- Email: test@library.com
- Password: Test123456

### Notes
- All passwords are hashed using bcrypt
- Database uses Sequelize ORM
- Timestamps are auto-managed by Sequelize
