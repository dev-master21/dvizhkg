import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Функция для создания директории если она не существует
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    
    // Определяем папку в зависимости от типа файла
    if (file.fieldname === 'preview') {
      folder = 'uploads/events/';
    } else if (file.fieldname === 'files') {
      folder = 'uploads/media/';
    } else if (file.fieldname === 'images' || file.fieldname === 'image') {
      // ДЛЯ МЕРЧА - добавлено условие
      folder = 'uploads/merch/';
    }
    
    // Создаем папку если не существует
    ensureDirectoryExists(folder);
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'video/mp4': true,
    'video/quicktime': true,
    'video/x-msvideo': true,
    'video/x-matroska': true,
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

// Multer configuration
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 20 // Max 20 files at once
  }
});

// Image optimization middleware
export const optimizeImage = async (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  try {
    const files = req.files || [req.file];
    
    for (const file of files) {
      if (!file.mimetype.startsWith('image/')) continue;
      
      const optimizedPath = path.join(
        path.dirname(file.path),
        'optimized-' + path.basename(file.path)
      );
      
      // Создаем путь для миниатюр
      const thumbsDir = path.join(
        path.dirname(file.path),
        '..',
        'thumbs'
      );
      
      // Создаем директорию thumbs если не существует
      ensureDirectoryExists(thumbsDir);
      
      const thumbnailPath = path.join(
        thumbsDir,
        'thumb-' + path.basename(file.path)
      );
      
      // Optimize main image
      await sharp(file.path)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85, progressive: true })
        .toFile(optimizedPath);
      
      // Create thumbnail
      await sharp(file.path)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      
      // Update file info
      file.optimizedPath = optimizedPath;
      file.thumbnailPath = thumbnailPath;
    }
    
    next();
  } catch (error) {
    console.error('Image optimization error:', error);
    // Продолжаем без оптимизации если что-то пошло не так
    next();
  }
};