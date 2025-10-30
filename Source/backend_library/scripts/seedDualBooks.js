const { Book, sequelize } = require('../models');

// Five titles to create as both physical and online versions
const dualTitles = [
  {
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    category: 'Trinh thám',
    description: 'Tiểu thuyết tâm lý ly kỳ về một người phụ nữ im lặng sau một vụ án mạng.',
    slug: 'the-silent-patient'
  },
  {
    title: 'Where the Crawdads Sing',
    author: 'Delia Owens',
    category: 'Văn học',
    description: 'Câu chuyện hòa quyện giữa thiên nhiên và cuộc đời một cô gái sống đơn độc ở vùng đầm lầy.',
    slug: 'where-the-crawdads-sing'
  },
  {
    title: 'Educated',
    author: 'Tara Westover',
    category: 'Hồi ký',
    description: 'Hành trình tự học và thoát khỏi gia đình khắt khe để đạt được nền giáo dục và tự do.',
    slug: 'educated'
  },
  {
    title: 'Becoming',
    author: 'Michelle Obama',
    category: 'Hồi ký',
    description: 'Cuộc đời và suy ngẫm của cựu Đệ nhất Phu nhân Hoa Kỳ Michelle Obama.',
    slug: 'becoming'
  },
  {
    title: 'The Subtle Art of Not Giving a F*ck',
    author: 'Mark Manson',
    category: 'Phát triển bản thân',
    description: 'Một góc nhìn thẳng thắn về cách chọn giá trị sống và chịu trách nhiệm cho sự hài lòng lâu dài.',
    slug: 'subtle-art'
  }
];

(async () => {
  try {
    console.log('Seeding 5 dual-mode books (physical + online)...');

    for (const t of dualTitles) {
      // Physical version
      const phys = await Book.create({
        title: t.title,
        author: t.author,
        category: t.category || 'Khác',
        description: t.description || '',
        stock: 5,
        bookType: 'physical',
        contentFile: null,
        coverImage: null
      });
      console.log(`Created physical: ${phys.title} (id=${phys.id})`);

      // Online version
      const online = await Book.create({
        title: t.title,
        author: t.author,
        category: t.category || 'Khác',
        description: t.description || '',
        stock: 0,
        bookType: 'online',
        contentFile: `/uploads/book-contents/${t.slug}.pdf`,
        coverImage: null
      });
      console.log(`Created online: ${online.title} (id=${online.id})`);
    }

    console.log('Done seeding dual-mode books.');
  } catch (e) {
    console.error('Seeding error', e);
  } finally {
    await sequelize.close();
  }
})();
