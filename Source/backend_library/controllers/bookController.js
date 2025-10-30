const sequelize = require('../configdatabase');
const Book = require('../models/book');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');
const ApiResponse = require('../utils/ApiResponse');
const { optimizeImage, createThumbnail } = require('../middleware/uploadMiddleware');
const { CacheService } = require('../config/redis');
const { execFileSync } = require('child_process');

// Mammoth for DOCX -> HTML conversion (optional dependency)
let mammoth = null;
try {
  mammoth = require('mammoth');
} catch (e) {
  // logger may not be initialized yet; if available, log informationally
  try { logger && logger.info && logger.info('mammoth not installed; DOCX->HTML conversion disabled'); } catch (e) {}
}

// Convert DOCX to HTML using mammoth. Returns relative path (/uploads/book-contents/...html) or null
const convertDocxToHtml = async (inputFilePath) => {
  try {
    if (!mammoth) return null;
    const ext = path.extname(inputFilePath).toLowerCase();
    if (ext !== '.docx') return null;

    const absInput = path.join(__dirname, '..', inputFilePath);
    if (!fs.existsSync(absInput)) return null;

    const buffer = fs.readFileSync(absInput);
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value || '';

    const base = path.parse(absInput).name;
    const outHtmlPath = path.join(__dirname, '..', 'uploads', 'book-contents', base + '.html');
    fs.writeFileSync(outHtmlPath, html, 'utf8');

    // Remove original .docx to save space
    try { fs.unlinkSync(absInput); } catch (e) {}

    return `/uploads/book-contents/${path.basename(outHtmlPath)}`;
  } catch (err) {
    logger.logError(err, { context: 'convertDocxToHtml' });
    return null;
  }
};

// Helper: make a relative /uploads/... path into an absolute URL using current request
const makeAbsoluteUrl = (req, p) => {
  if (!p) return p;
  // If already absolute, return as-is
  if (/^(https?:)?\/\//i.test(p)) return p;
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}${p}`;
};

const attachAbsoluteUrlsToBook = (req, book) => {
  if (!book) return book;
  // clone shallow
  const b = book.toJSON ? book.toJSON() : { ...book };
  if (b.coverImage) b.coverImage = makeAbsoluteUrl(req, b.coverImage);
  if (b.contentFile) b.contentFile = makeAbsoluteUrl(req, b.contentFile);
  return b;
};

// Convert DOC/DOCX to PDF using LibreOffice (soffice) if available.
// Returns the relative path (e.g. /uploads/book-contents/xxx.pdf) or null on failure.
const convertDocToPdf = (inputFilePath) => {
  try {
    const allowed = ['.doc', '.docx'];
    const ext = path.extname(inputFilePath).toLowerCase();
    if (!allowed.includes(ext)) return null;

    const uploadsDir = path.join(__dirname, '..', 'uploads', 'book-contents');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    // Absolute input path
    const absInput = path.join(__dirname, '..', inputFilePath);
    if (!fs.existsSync(absInput)) return null;

    // LibreOffice will output to the specified outdir with the same base name
    // Try common binary names: soffice, libreoffice
    const binCandidates = ['soffice', 'libreoffice'];
    let usedBin = null;
    for (const b of binCandidates) {
      try {
        execFileSync(b, ['--version'], { stdio: 'ignore' });
        usedBin = b;
        break;
      } catch (e) {
        // not found, try next
      }
    }

    if (!usedBin) {
      logger.info('LibreOffice binary not found on PATH; skipping DOC->PDF conversion');
      return null;
    }

    // Run conversion
    try {
      execFileSync(usedBin, ['--headless', '--convert-to', 'pdf', '--outdir', uploadsDir, absInput], { stdio: 'ignore' });
    } catch (err) {
      logger.logError(err, { context: 'convertDocToPdf - exec', input: absInput });
      return null;
    }

    const base = path.parse(absInput).name;
    const outPdf = path.join(uploadsDir, base + '.pdf');
    if (!fs.existsSync(outPdf)) return null;

    // Move/rename output to match app's stored relative path (/uploads/book-contents/<filename>)
    const relative = `/uploads/book-contents/${path.basename(outPdf)}`;

    // Optionally remove original input to save space
    try {
      fs.unlinkSync(absInput);
    } catch (e) {
      // ignore deletion errors
    }

    return relative;
  } catch (error) {
    logger.logError(error, { context: 'convertDocToPdf' });
    return null;
  }
};

// Lấy tất cả sách với phân trang, sắp xếp và tìm kiếm
exports.getAllBooks = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      order = 'DESC',
      search = '',
      category = '',
      bookType = ''
    } = req.query;

    // Tạo cache key dựa trên các tham số query
  const cacheKey = `books:list:${page}:${limit}:${sortBy}:${order}:${search}:${category}:${bookType}`;
    
    // Thử lấy từ cache
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      logger.info(`Trúng cache cho danh sách sách: ${cacheKey}`);
      return res.json(cachedData);
    }

    const offset = (page - 1) * limit;

    // Xây dựng where clause cho tìm kiếm và lọc
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { author: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (category) {
      whereClause.category = category;
    }
    if (bookType) {
      whereClause.bookType = bookType;
    }

    const { count, rows: books } = await Book.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, order.toUpperCase()]]
    });

    // Convert Sequelize instances to plain objects and attach absolute URLs
    const plainBooks = books.map(b => attachAbsoluteUrlsToBook(req, b));

    const response = {
      books: plainBooks,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit)
    };

    // Lưu cache trong 5 phút
    await CacheService.set(cacheKey, response, 300);
    logger.info(`Đã cache danh sách sách: ${cacheKey}`);

    res.json(response);
  } catch (error) {
    logger.logError(error, { context: 'getAllBooks', query: req.query });
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// Lấy một cuốn sách theo ID
exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Thử lấy từ cache trước
    const book = await CacheService.remember(
      `book:${id}`,
      async () => await Book.findByPk(id),
      600 // Cache trong 10 phút
    );

    if (!book) {
      return res.status(404).json({ message: 'Không tìm thấy sách' });
    }

    const plain = attachAbsoluteUrlsToBook(req, book);
    res.json(plain);
  } catch (error) {
    logger.logError(error, { context: 'getBookById', bookId: req.params.id });
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// Tạo sách mới
exports.createBook = async (req, res) => {
  try {
    const { title, author, category, description, stock, coverImage, bookType } = req.body;
    
    // Lấy contentFile từ req.file nếu có upload
    let contentFile = req.file ? `/uploads/book-contents/${req.file.filename}` : null;

    // Nếu là doc/docx thì xử lý:
    // - .docx: ưu tiên convert -> HTML (mammoth) and save .html
    // - .doc: convert -> PDF using LibreOffice
    if (contentFile) {
      const ext = path.extname(contentFile).toLowerCase();
      if (ext === '.docx') {
        try {
          const convertedHtml = await convertDocxToHtml(contentFile);
          if (convertedHtml) {
            contentFile = convertedHtml;
          } else {
            // Fallback: try libreoffice to PDF
            const convertedPdf = convertDocToPdf(contentFile);
            if (convertedPdf) contentFile = convertedPdf;
          }
        } catch (e) {
          // ignore and fallback
          const convertedPdf = convertDocToPdf(contentFile);
          if (convertedPdf) contentFile = convertedPdf;
        }
      } else if (ext === '.doc') {
        const convertedPdf = convertDocToPdf(contentFile);
        if (convertedPdf) contentFile = convertedPdf;
      }
    }

    const book = await Book.create({
      title,
      author,
      category,
      description,
      stock: stock || 1,
      coverImage: coverImage || null,
      bookType: bookType || 'physical',
      contentFile: contentFile
    });

    // Xóa cache danh sách sách
    await CacheService.delPattern('books:list:*');
    logger.info('Đã xóa cache danh sách sách sau khi tạo mới');

    const plain = attachAbsoluteUrlsToBook(req, book);
    res.status(201).json({
      message: 'Tạo sách thành công',
      book: plain
    });
  } catch (error) {
    logger.logError(error, { context: 'createBook', body: req.body });
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// Cập nhật sách
exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, category, description, stock, coverImage, bookType } = req.body;
    
    // Lấy contentFile từ req.file nếu có upload mới
    let contentFile = req.file ? `/uploads/book-contents/${req.file.filename}` : undefined;

    // Nếu upload mới là doc/docx thì xử lý tương tự createBook
    if (typeof contentFile === 'string') {
      const ext = path.extname(contentFile).toLowerCase();
      if (ext === '.docx') {
        try {
          const convertedHtml = await convertDocxToHtml(contentFile);
          if (convertedHtml) contentFile = convertedHtml;
          else {
            const convertedPdf = convertDocToPdf(contentFile);
            if (convertedPdf) contentFile = convertedPdf;
          }
        } catch (e) {
          const convertedPdf = convertDocToPdf(contentFile);
          if (convertedPdf) contentFile = convertedPdf;
        }
      } else if (ext === '.doc') {
        const convertedPdf = convertDocToPdf(contentFile);
        if (convertedPdf) contentFile = convertedPdf;
      }
    }

    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({ message: 'Không tìm thấy sách' });
    }
    
    // Nếu có contentFile mới và đã có file cũ, xóa file cũ
    if (contentFile && book.contentFile) {
      const oldFilePath = path.join(__dirname, '..', book.contentFile);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        logger.info(`Đã xóa file nội dung cũ: ${oldFilePath}`);
      }
    }

    await book.update({
      title: title || book.title,
      author: author || book.author,
      category: category || book.category,
      description: description || book.description,
      stock: stock !== undefined ? stock : book.stock,
      coverImage: coverImage !== undefined ? coverImage : book.coverImage,
      bookType: bookType || book.bookType,
      contentFile: contentFile !== undefined ? contentFile : book.contentFile
    });

    // Xóa cache
    await CacheService.del(`book:${id}`);
    await CacheService.delPattern('books:list:*');
    logger.info(`Đã xóa cache cho sách ${id}`);

    const refreshed = await Book.findByPk(id);
    const plain = attachAbsoluteUrlsToBook(req, refreshed);
    res.json({
      message: 'Cập nhật sách thành công',
      book: plain
    });
  } catch (error) {
    logger.logError(error, { context: 'updateBook', bookId: req.params.id });
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// Xóa sách
exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({ message: 'Không tìm thấy sách' });
    }

    await book.destroy();

    // Xóa cache
    await CacheService.del(`book:${id}`);
    await CacheService.delPattern('books:list:*');
    logger.info(`Đã xóa cache cho sách đã xóa ${id}`);

    res.json({ message: 'Xóa sách thành công' });
  } catch (error) {
    logger.logError(error, { context: 'deleteBook', bookId: req.params.id });
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// Lấy danh sách thể loại sách
exports.getCategories = async (req, res) => {
  try {
    const categories = await Book.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
      raw: true
    });

    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thể loại:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// Lấy thống kê sách
exports.getBookStats = async (req, res) => {
  try {
    const totalBooks = await Book.count();
    const totalStock = await Book.sum('stock');
    const outOfStock = await Book.count({ where: { stock: 0 } });
    const availableBooks = await Book.count({ where: { stock: { [Op.gt]: 0 } } });
    const onlineBooks = await Book.count({ where: { bookType: 'online' } });
    const physicalBooks = await Book.count({ where: { bookType: 'physical' } });
    const withCover = await Book.count({ where: { coverImage: { [Op.ne]: null } } });
    const withContent = await Book.count({ where: { contentFile: { [Op.ne]: null } } });
    // Aggregate categories by normalized key (trim + lower) to avoid duplicates
    const rawCategoryCounts = await Book.findAll({
      attributes: [
        [sequelize.fn('LOWER', sequelize.fn('TRIM', sequelize.col('category'))), 'norm'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('LOWER', sequelize.fn('TRIM', sequelize.col('category')))],
      raw: true
    });

    // Produce a user-friendly category name (capitalize words) while keeping counts
    const categoryCounts = rawCategoryCounts.map(r => {
      const norm = (r.norm || '').toString();
      // pretty: capitalize first letter of each word (locale-aware)
      const pretty = norm.split(/\s+/).filter(Boolean).map(w => {
        return w.charAt(0).toLocaleUpperCase('vi') + w.slice(1);
      }).join(' ');
      return { category: pretty || norm, count: parseInt(r.count, 10) || 0 };
    });

    res.json({
      totalBooks,
      totalStock,
      availableBooks,
      outOfStock,
      onlineBooks,
      physicalBooks,
      withCover,
      withContent,
      categoryCounts
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê sách:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// Tải lên ảnh bìa sách
exports.uploadCover = async (req, res) => {
  try {
    if (!req.file) {
      logger.warn('Cố gắng tải lên nhưng không có file');
      return ApiResponse.badRequest(res, 'Không có file nào được tải lên');
    }

    const originalPath = req.file.path;
    const filename = req.file.filename;

    // Server-side image dimension checks to avoid huge images
    try {
      const metadata = await require('sharp')(originalPath).metadata();
      const maxWidth = 5000; // tối đa chiều rộng
      const maxHeight = 5000; // tối đa chiều cao
      if ((metadata.width && metadata.width > maxWidth) || (metadata.height && metadata.height > maxHeight)) {
        // Xóa file gốc vì không chấp nhận
        if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
        return ApiResponse.badRequest(res, `Kích thước ảnh quá lớn (tối đa ${maxWidth}x${maxHeight} pixels)`);
      }
    } catch (metaErr) {
      // Nếu không lấy được metadata, log và tiếp tục (không block upload)
      logger.logError(metaErr, { context: 'uploadCover - metadata' });
    }

    // Tối ưu hóa ảnh và tạo thumbnail
    try {
      await optimizeImage(originalPath, filename);
      await createThumbnail(originalPath, filename);
      
      logger.info('Xử lý ảnh thành công', { filename });
    } catch (error) {
      logger.logError(error, { context: 'uploadCover - xử lý ảnh', filename });
      // Tiếp tục ngay cả khi tối ưu hóa thất bại
    }

    // Since optimizeImage/createThumbnail now write .jpg files, return the
    // corresponding .jpg filenames (replace original extension)
    const baseName = path.parse(filename).name;
    const optimizedFilename = baseName + '.jpg';
    const thumbFilename = 'thumb-' + baseName + '.jpg';

    const coverImagePath = `/uploads/optimized/${optimizedFilename}`;
    const thumbnailPath = `/uploads/optimized/${thumbFilename}`;

    // If request includes a bookId query param, attach the cover to that book
    const bookId = req.query.bookId || req.body.bookId;
    let updatedBook = null;
    if (bookId) {
      try {
        const book = await Book.findByPk(bookId);
        if (book) {
          await book.update({ coverImage: coverImagePath });
          updatedBook = attachAbsoluteUrlsToBook(req, book);
          // Clear cache for this book and books list
          await CacheService.del(`book:${bookId}`);
          await CacheService.delPattern('books:list:*');
        }
      } catch (e) {
        logger.logError(e, { context: 'uploadCover - attach to book', bookId });
      }
    }

    return ApiResponse.success(res, {
      coverImage: coverImagePath,
      thumbnail: thumbnailPath,
      filename: optimizedFilename,
      attachedBook: updatedBook
    }, 'Tải lên file thành công');
  } catch (error) {
    logger.logError(error, { context: 'uploadCover' });
    return ApiResponse.serverError(res, 'Tải lên file thất bại');
  }
};

  /**
   * Lấy nội dung sách (chỉ cho VIP và Admin)
   * Kiểm tra quyền truy cập và trả về file
   */
  exports.getBookContent = async (req, res) => {
    try {
      const { id } = req.params;
      const userRole = req.user.role;
    
      // Kiểm tra quyền: chỉ VIP và Admin
      if (userRole !== 'vip' && userRole !== 'admin') {
        logger.warn(`User ${req.user.id} (${userRole}) cố đọc sách online nhưng không có quyền`);
        return ApiResponse.forbidden(res, 'Vui lòng nâng cấp tài khoản để đọc sách trực tuyến');
      }
    
      // Lấy thông tin sách
      const book = await Book.findByPk(id);
      if (!book) {
        return ApiResponse.notFound(res, 'Không tìm thấy sách');
      }
    
      // Kiểm tra sách có phải loại online không
      if (book.bookType !== 'online') {
        return ApiResponse.badRequest(res, 'Sách này không hỗ trợ đọc trực tuyến');
      }
    
      // Kiểm tra có file nội dung không
      if (!book.contentFile) {
        return ApiResponse.notFound(res, 'Sách chưa có nội dung để đọc');
      }
    
      // Đường dẫn file
      const filePath = path.join(__dirname, '..', book.contentFile);
    
      // Kiểm tra file tồn tại
      if (!fs.existsSync(filePath)) {
        logger.error(`File nội dung sách không tồn tại: ${filePath}`);
        return ApiResponse.notFound(res, 'File nội dung không tồn tại');
      }
    
      logger.info(`User ${req.user.id} (${userRole}) đang đọc sách ${id}: ${book.title}`);
    
      // Trả về file
      res.sendFile(filePath);
    } catch (error) {
      logger.logError(error, { context: 'getBookContent', bookId: req.params.id });
      return ApiResponse.serverError(res, 'Lỗi khi lấy nội dung sách');
    }
  };

// Xóa ảnh bìa đã tải lên
exports.deleteCoverImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Xóa file thành công' });
    } else {
      res.status(404).json({ message: 'Không tìm thấy file' });
    }
  } catch (error) {
    console.error('Lỗi khi xóa file:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};
