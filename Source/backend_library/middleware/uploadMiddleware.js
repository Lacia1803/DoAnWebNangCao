const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const logger = require('../config/logger');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '..', 'uploads');
const uploadOriginalDir = path.join(uploadDir, 'original');
const uploadOptimizedDir = path.join(uploadDir, 'optimized');

[uploadDir, uploadOriginalDir, uploadOptimizedDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadOriginalDir); // Save to original folder first
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'book-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
  fileFilter: fileFilter
});

/**
 * Optimize uploaded image using Sharp
 * @param {string} originalPath - Path to original image
 * @param {string} filename - Filename
 * @returns {Promise<string>} - Path to optimized image
 */
const optimizeImage = async (originalPath, filename) => {
  try {
    const parsed = path.parse(filename);
    const optimizedFilename = parsed.name + '.jpg';
    const optimizedPath = path.join(uploadOptimizedDir, optimizedFilename);
    // Read original file size to decide compression level
    let stats;
    try {
      stats = fs.statSync(originalPath);
    } catch (e) {
      stats = { size: 0 };
    }

    const sizeInBytes = stats.size || 0;
    // If original > 5MB, use stronger compression
    const strongCompressThreshold = 5 * 1024 * 1024; // 5MB
    const quality = sizeInBytes > strongCompressThreshold ? 70 : 85;

    await sharp(originalPath)
      .resize(800, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality,
        progressive: true
      })
      .toFile(optimizedPath);

    logger.info('Image optimized', { filename: optimizedFilename, originalPath, optimizedPath });
    return optimizedPath;
  } catch (error) {
    logger.logError(error, { context: 'optimizeImage', filename });
    throw error;
  }
};

/**
 * Create thumbnail
 * @param {string} originalPath - Path to original image
 * @param {string} filename - Filename
 * @returns {Promise<string>} - Path to thumbnail
 */
const createThumbnail = async (originalPath, filename) => {
  try {
    const parsedThumb = path.parse(filename);
    const thumbnailFilename = 'thumb-' + parsedThumb.name + '.jpg';
    const thumbnailPath = path.join(uploadOptimizedDir, thumbnailFilename);
    // Thumbnails can be lower quality to save space
    await sharp(originalPath)
      .resize(200, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 70
      })
      .toFile(thumbnailPath);

    logger.info('Thumbnail created', { filename: thumbnailFilename });
    return thumbnailPath;
  } catch (error) {
    logger.logError(error, { context: 'createThumbnail', filename });
    throw error;
  }
};

module.exports = upload;
module.exports.optimizeImage = optimizeImage;
module.exports.createThumbnail = createThumbnail;
