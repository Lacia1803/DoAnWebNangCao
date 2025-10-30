# Entity Relationship Diagram (ERD)
# Library Management System Database Schema

```
┌─────────────────────────────┐
│          Users              │
├─────────────────────────────┤
│ PK  id (INT, AUTO_INCREMENT)│
│     username (VARCHAR)      │
│     email (VARCHAR, UNIQUE) │
│     password (VARCHAR)      │
│     role (ENUM: admin/user) │
│     createdAt (TIMESTAMP)   │
│     updatedAt (TIMESTAMP)   │
└─────────────────────────────┘
         │
         │ 1
         │
         │ has many
         │
         │ N
         ▼
┌─────────────────────────────┐
│         Borrows             │
├─────────────────────────────┤
│ PK  id (INT, AUTO_INCREMENT)│
│ FK  userId (INT) ───────────┼──┐
│ FK  bookId (INT) ───────────┼──┼──┐
│     borrowDate (DATE)       │  │  │
│     dueDate (DATE)          │  │  │
│     returnDate (DATE)       │  │  │
│     status (ENUM)           │  │  │
│     overdueReminderSent (BOOL)│ │  │
│     lastReminderAt (TIMESTAMP)│ │ │
│     createdAt (TIMESTAMP)   │  │  │
│     updatedAt (TIMESTAMP)   │  │  │
└─────────────────────────────┘  │  │
                                 │  │
                                 │  │
                    ┌────────────┘  │
                    │               │
                    │ belongs to    │
                    │               │
         ┌──────────┘               │
         │ 1                        │
         │                          │
         ▼                          │
┌─────────────────────────────┐    │
│          Books              │    │
├─────────────────────────────┤    │
│ PK  id (INT, AUTO_INCREMENT)│◄───┘
│     title (VARCHAR)         │
│     author (VARCHAR)        │
│     category (VARCHAR)      │
│     description (TEXT)      │
│     coverImage (VARCHAR)    │
│     stock (INT)             │
│     createdAt (TIMESTAMP)   │
│     updatedAt (TIMESTAMP)   │
└─────────────────────────────┘
         │
         │ 1
         │
         │ has many
         │
         │ N
         ▲
```

## Relationships:

1. **Users → Borrows** (One-to-Many)
   - One user can have many borrow records
   - FK: Borrows.userId references Users.id

2. **Books → Borrows** (One-to-Many)
   - One book can appear in many borrow records
   - FK: Borrows.bookId references Books.id

3. **Users ↔ Books** (Many-to-Many through Borrows)
   - Users can borrow many books
   - Books can be borrowed by many users
   - Junction table: Borrows

## Enum Values:

**Users.role:**
- admin
- user

**Borrows.status:**
- borrowed
- returned
- overdue

## Indexes:

- Users.email (UNIQUE)
- Borrows.userId (INDEX)
- Borrows.bookId (INDEX)
- Borrows.status (INDEX)
- Books.category (INDEX)

## Constraints:

- ON DELETE CASCADE for Borrow records when User is deleted
- ON DELETE RESTRICT for Borrow records when Book is deleted (if there are active borrows)
- CHECK: stock >= 0
- CHECK: dueDate > borrowDate
