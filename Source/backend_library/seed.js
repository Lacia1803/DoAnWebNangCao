const bcrypt = require('bcryptjs');
const { sequelize, User, Book, Borrow } = require('./models');

// Helper
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

async function seed() {
  try {
    console.log('⏳ Seeding (idempotent, no destructive sync)...');
    await sequelize.authenticate();

    // 1) Users (create if missing)
    const [admin] = await User.findOrCreate({
      where: { email: 'admin@library.com' },
      defaults: {
        username: 'admin',
        email: 'admin@library.com',
        password: await bcrypt.hash('Admin@1234', 10),
        role: 'admin'
      }
    });

    const [user] = await User.findOrCreate({
      where: { email: 'john@example.com' },
      defaults: {
        username: 'john',
        email: 'john@example.com',
        password: await bcrypt.hash('User@1234!', 10),
        role: 'user'
      }
    });

    // 2) Books (12 real titles, distinct categories)
    const booksData = [
      { title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction', description: 'Pulitzer Prize–winning classic.', stock: 5 },
      { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', category: 'Mystery', description: 'A gripping thriller.', stock: 4 },
      { title: "Harry Potter and the Sorcerer's Stone", author: 'J.K. Rowling', category: 'Fantasy', description: 'The first Harry Potter book.', stock: 6 },
      { title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Science', description: 'Cosmology explained.', stock: 5 },
      { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', category: 'History', description: 'A journey through human history.', stock: 5 },
      { title: 'The Diary of a Young Girl', author: 'Anne Frank', category: 'Biography', description: 'Anne Frank’s diary.', stock: 4 },
      { title: 'Clean Code', author: 'Robert C. Martin', category: 'Technology', description: 'Agile software craftsmanship.', stock: 5 },
      { title: 'Meditations', author: 'Marcus Aurelius', category: 'Philosophy', description: 'Stoic reflections.', stock: 3 },
      { title: 'Atomic Habits', author: 'James Clear', category: 'Self-help', description: 'Build better habits.', stock: 6 },
      { title: 'The Lean Startup', author: 'Eric Ries', category: 'Business', description: 'Entrepreneurship methodology.', stock: 5 },
      { title: '1984', author: 'George Orwell', category: 'Classics', description: 'Dystopian classic.', stock: 5 },
      { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', category: 'Psychology', description: 'Two systems of thought.', stock: 4 }
    ];

    const titleToBook = {};
    for (const b of booksData) {
      const [book] = await Book.findOrCreate({
        where: { title: b.title },
        defaults: b
      });
      titleToBook[b.title] = book;
    }

    // 3) 10 active borrows (2 due soon) for the regular user, one per selected book
    const titlesToBorrow = [
      'To Kill a Mockingbird',
      'The Girl with the Dragon Tattoo',
      "Harry Potter and the Sorcerer's Stone",
      'A Brief History of Time',
      'Sapiens: A Brief History of Humankind',
      'The Diary of a Young Girl',
      'Clean Code',
      'Meditations',
      'Atomic Habits',
      'The Lean Startup'
    ];

    const now = new Date();
    let createdCount = 0;
    for (let i = 0; i < titlesToBorrow.length; i++) {
      const t = titlesToBorrow[i];
      const book = titleToBook[t];
      if (!book) continue;

      const dueDate = i < 2 ? addDays(now, 1) : addDays(now, 10 + i); // 2 near-due

      // Skip if an active borrow already exists for this user-book pair
      const exists = await Borrow.findOne({ where: { userId: user.id, bookId: book.id, status: 'borrowed' } });
      if (exists) continue;

      // Ensure stock then create borrow, decrement stock
      const liveBook = await Book.findByPk(book.id);
      if (liveBook.stock <= 0) {
        await liveBook.update({ stock: 1 });
      }

      await Borrow.create({
        userId: user.id,
        bookId: liveBook.id,
        borrowDate: now,
        dueDate,
        status: 'borrowed'
      });

      await liveBook.update({ stock: Math.max(0, liveBook.stock - 1) });
      createdCount++;
    }

    console.log(`✅ Seed complete. Books ensured: ${Object.keys(titleToBook).length}, New active borrows: ${createdCount}`);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();
