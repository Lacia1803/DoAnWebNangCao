const { Book, sequelize } = require('../models');

// Replace demo seeds with a list of realistic book entries and short descriptions.
const realisticBooks = [
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    category: 'Văn học',
    description: 'Một câu chuyện về công lý và định kiến ở miền Nam nước Mỹ, kể qua ánh mắt của Scout Finch khi trưởng thành.',
    stock: 3,
    bookType: 'physical'
  },
  {
    title: '1984',
    author: 'George Orwell',
    category: 'Văn học',
    description: 'Tiểu thuyết chính trị giả tưởng mô tả xã hội giám sát toàn diện và sự kiểm soát tư tưởng bởi một chế độ độc tài.',
    stock: 2,
    bookType: 'physical'
  },
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    category: 'Văn học',
    description: 'Bức tranh về giấc mơ Mỹ và những mặt trái của thập niên 1920 thông qua cuộc đời của Jay Gatsby.',
    stock: 4,
    bookType: 'physical'
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    category: 'Văn học',
    description: 'Tiểu thuyết lãng mạn về tình yêu và phạm trù giai cấp, với nhân vật Elizabeth Bennet đầy sắc sảo.',
    stock: 5,
    bookType: 'physical'
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    category: 'Khoa học',
    description: 'Tổng quan về lịch sử loài người từ thời tiền sử đến kỷ nguyên hiện đại, phân tích các lực lượng hình thành xã hội.',
    stock: 2,
    bookType: 'online',
    contentFile: '/uploads/book-contents/sapiens-sample.pdf'
  },
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    category: 'Tâm lý học',
    description: 'Giải thích hai hệ thống tư duy của con người — nhanh trực giác và chậm logic — và cách chúng ảnh hưởng đến quyết định.',
    stock: 1,
    bookType: 'online',
    contentFile: '/uploads/book-contents/thinking-fast-and-slow.pdf'
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    category: 'Công nghệ',
    description: 'Hướng dẫn các nguyên tắc và thực hành viết mã sạch, dễ bảo trì cho lập trình viên.',
    stock: 2,
    bookType: 'physical'
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Tâm lý học',
    description: 'Chiến lược nhỏ, hiệu quả để xây dựng thói quen tốt và loại bỏ thói quen xấu bằng các thay đổi từng bước.',
    stock: 6,
    bookType: 'physical'
  },
  {
    title: 'Deep Work',
    author: 'Cal Newport',
    category: 'Kỹ năng',
    description: 'Phương pháp tập trung sâu để tạo ra công việc có giá trị trong thời đại phân tâm.',
    stock: 3,
    bookType: 'online',
    contentFile: '/uploads/book-contents/deep-work.pdf'
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt, David Thomas',
    category: 'Công nghệ',
    description: 'Những lời khuyên thực tế cho lập trình viên muốn nâng cao kỹ năng và phong cách làm việc chuyên nghiệp.',
    stock: 2,
    bookType: 'physical'
  },
  {
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    category: 'Văn học',
    description: 'Câu chuyện về tuổi thanh xuân và những bỡ ngỡ, qua góc nhìn của Holden Caulfield.',
    stock: 3,
    bookType: 'physical'
  },
  {
    title: "Harry Potter and the Sorcerer's Stone",
    author: 'J.K. Rowling',
    category: 'Văn học',
    description: 'Khởi đầu cho hành trình của cậu bé phù thủy Harry Potter tại trường Hogwarts.',
    stock: 8,
    bookType: 'physical'
  },
  {
    title: 'The Lord of the Rings',
    author: 'J.R.R. Tolkien',
    category: 'Văn học',
    description: 'Sử thi giả tưởng về cuộc hành trình tiêu diệt chiếc nhẫn quyền lực và cứu thế giới Trung Địa.',
    stock: 2,
    bookType: 'physical'
  },
  {
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    category: 'Văn học',
    description: 'Truyện cổ tích hiện đại về hành trình tìm kiếm ước mơ và ý nghĩa đời sống.',
    stock: 4,
    bookType: 'physical'
  },
  {
    title: 'Rich Dad Poor Dad',
    author: 'Robert Kiyosaki',
    category: 'Kinh tế',
    description: 'Những bài học tài chính và tư duy đầu tư từ quan điểm khác nhau của hai thế hệ.',
    stock: 5,
    bookType: 'online',
    contentFile: '/uploads/book-contents/rich-dad-poor-dad.pdf'
  },
  {
    title: 'The Lean Startup',
    author: 'Eric Ries',
    category: 'Kinh tế',
    description: 'Phương pháp phát triển sản phẩm tinh gọn, thử nghiệm nhanh và học hỏi liên tục cho startup.',
    stock: 3,
    bookType: 'online',
    contentFile: '/uploads/book-contents/lean-startup.pdf'
  },
  {
    title: 'The Power of Habit',
    author: 'Charles Duhigg',
    category: 'Tâm lý học',
    description: 'Giải mã cơ chế hình thành thói quen và cách thay đổi chúng để cải thiện cuộc sống.',
    stock: 2,
    bookType: 'physical'
  },
  {
    title: 'The Kite Runner',
    author: 'Khaled Hosseini',
    category: 'Văn học',
    description: 'Câu chuyện cảm động về tình bạn, phản bội và cứu chuộc giữa bối cảnh Afghanistan đầy biến động.',
    stock: 3,
    bookType: 'physical'
  },
  {
    title: 'Le Petit Prince',
    author: 'Antoine de Saint-Exupéry',
    category: 'Văn học',
    description: 'Tác phẩm triết lý nhẹ nhàng về tình bạn, tình yêu và nhìn nhận giá trị cuộc sống qua câu chuyện của hoàng tử nhỏ.',
    stock: 4,
    bookType: 'physical'
  }
];

(async () => {
  try {
    console.log('Seeding realistic books...');

    // Clear existing books to replace demo data with realistic set.
    // NOTE: This truncates the Books table in the dev DB; keep cautious for production.
    await Book.destroy({ where: {}, truncate: true, cascade: true });

    for (const b of realisticBooks) {
      const where = { title: b.title };
      const defaults = {
        author: b.author,
        category: b.category || 'Khác',
        description: b.description || '',
        stock: typeof b.stock === 'number' ? b.stock : 0,
        bookType: b.bookType || 'physical',
        contentFile: b.contentFile || null,
        coverImage: b.coverImage || null
      };

      const [book, created] = await Book.findOrCreate({ where, defaults });
      if (created) console.log(`Created: ${b.title}`);
      else {
        await book.update(defaults);
        console.log(`Updated: ${b.title}`);
      }
    }

    console.log('Done seeding realistic books.');
  } catch (e) {
    console.error('Seeding error', e);
  } finally {
    await sequelize.close();
  }
})();
