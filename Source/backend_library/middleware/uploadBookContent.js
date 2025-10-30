const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads/book-contents nếu chưa có
const uploadDir = path.join(__dirname, '..', 'uploads', 'book-contents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình storage cho multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

// File filter - chỉ cho phép PDF, Word, TXT
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'text/plain' // .txt
  ];
  
  const allowedExts = ['.pdf', '.doc', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file PDF, Word (.doc, .docx) hoặc TXT'), false);
  }
};

// Multer config với giới hạn 150MB
const uploadBookContent = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 150 * 1024 * 1024 // 150MB
  }
}).single('contentFile'); // Field name là 'contentFile'

// Wrapper middleware để xử lý lỗi multer
const handleBookContentUpload = (req, res, next) => {
  uploadBookContent(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Lỗi từ multer
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false,
          message: 'File quá lớn. Kích thước tối đa là 150MB' 
        });
      }
      return res.status(400).json({ 
        success: false,
        message: `Lỗi upload: ${err.message}` 
      });
    } else if (err) {
      // Lỗi custom từ fileFilter
      return res.status(400).json({ 
        success: false,
        message: err.message 
      });
    }
    
    // Upload thành công hoặc không có file
    next();
  });
};

module.exports = {
  handleBookContentUpload,
  uploadDir
};
