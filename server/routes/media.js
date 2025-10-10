import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { pool } from '../services/database.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { upload, optimizeImage } from '../middleware/upload.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import { sendMessageToChat } from '../services/telegram.js';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Функция для генерации thumbnail из видео с сохранением пропорций
const generateVideoThumbnail = (videoPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['00:00:02'], // Берем кадр на 2-й секунде
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '?x600'  // Высота 600px, ширина автоматически с сохранением пропорций
      })
      .on('end', () => {
        console.log('Thumbnail generated successfully');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error generating thumbnail:', err);
        reject(err);
      });
  });
};

// Public endpoint для главной страницы
router.get('/public', async (req, res) => {
  try {
    const query = `
      SELECT m.id, m.type, m.url, m.thumbnail_url, m.event_id, e.title as event_title
      FROM media m
      LEFT JOIN events e ON m.event_id = e.id
      ORDER BY m.uploaded_at DESC
      LIMIT 8
    `;
    
    const [media] = await pool.execute(query);
    
    const formattedMedia = media.map(item => ({
      id: item.id,
      type: item.type,
      url: item.url,
      file_url: item.url,
      thumbnail_url: item.thumbnail_url,
      event_id: item.event_id,
      event_title: item.event_title
    }));
    
    res.json(formattedMedia);
  } catch (error) {
    console.error('Get public media error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get media
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { event_id, type, limit = '100', offset = '0' } = req.query;
    
    const limitNum = Math.min(parseInt(limit) || 100, 1000);
    const offsetNum = Math.max(parseInt(offset) || 0, 0);
    
    let query = `
      SELECT m.*, u.username, u.first_name, u.last_name, e.title as event_title
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      LEFT JOIN events e ON m.event_id = e.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (event_id && event_id !== 'null' && event_id !== 'undefined') {
      query += ' AND m.event_id = ?';
      params.push(parseInt(event_id) || null);
    }
    
    if (type && type !== 'all') {
      query += ' AND m.type = ?';
      params.push(type);
    }
    
    query += ` ORDER BY m.uploaded_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
    
    console.log('Media query:', query);
    console.log('Media params:', params);
    
    const [media] = await pool.execute(query, params);
    
    const formattedMedia = media.map(item => ({
      id: item.id,
      event_id: item.event_id,
      type: item.type,
      url: item.url,
      file_url: item.url,
      thumbnail_url: item.thumbnail_url,
      uploaded_by: item.uploaded_by,
      uploaded_at: item.uploaded_at,
      uploader_name: item.first_name || item.username || 'Анонимный',
      event_title: item.event_title || null
    }));
    
    res.json(formattedMedia);
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload media with video thumbnail generation
router.post('/upload', authMiddleware, adminMiddleware, uploadRateLimiter, upload.array('files', 20), optimizeImage, async (req, res) => {
  try {
    const { event_id } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const uploadedMedia = [];
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      for (const file of req.files) {
        const isVideo = file.mimetype.startsWith('video/');
        
        let url, thumbnailUrl;
        
        if (isVideo) {
          url = `/uploads/media/${file.filename}`;
          
          // Генерируем thumbnail для видео
          try {
            const thumbnailFilename = `video-thumb-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            const thumbnailPath = path.join(__dirname, '..', 'uploads', 'thumbs', thumbnailFilename);
            
            // Создаем директорию если её нет
            const thumbnailDir = path.dirname(thumbnailPath);
            await fs.mkdir(thumbnailDir, { recursive: true });
            
            // Генерируем thumbnail из видео
            const videoPath = path.join(__dirname, '..', 'uploads', 'media', file.filename);
            await generateVideoThumbnail(videoPath, thumbnailPath);
            
            // Оптимизируем thumbnail с сохранением пропорций
            const optimizedThumbnailFilename = `opt-${thumbnailFilename}`;
            const optimizedThumbnailPath = path.join(__dirname, '..', 'uploads', 'thumbs', optimizedThumbnailFilename);
            
            await sharp(thumbnailPath)
              .resize(800, 600, { 
                fit: 'inside',  // Изменено с 'cover' на 'inside' для сохранения пропорций
                withoutEnlargement: true  // Не увеличивать если изображение меньше
              })
              .jpeg({ quality: 85 })
              .toFile(optimizedThumbnailPath);
            
            // Удаляем неоптимизированный thumbnail
            await fs.unlink(thumbnailPath);
            
            thumbnailUrl = `/uploads/thumbs/${optimizedThumbnailFilename}`;
            
            console.log('Video thumbnail generated:', thumbnailUrl);
          } catch (err) {
            console.error('Error generating video thumbnail:', err);
            thumbnailUrl = null; // Если не удалось создать thumbnail
          }
        } else {
          // Для изображений используем существующую логику
          if (file.optimizedPath) {
            url = `/uploads/media/optimized-${file.filename}`;
            thumbnailUrl = `/uploads/thumbs/thumb-${file.filename}`;
          } else {
            url = `/uploads/media/${file.filename}`;
            thumbnailUrl = null;
          }
        }
        
        const eventIdValue = event_id && event_id !== 'null' && event_id !== 'undefined' 
          ? parseInt(event_id) 
          : null;
        
        const [result] = await connection.execute(
          'INSERT INTO media (event_id, type, url, thumbnail_url, uploaded_by) VALUES (?, ?, ?, ?, ?)',
          [eventIdValue, isVideo ? 'video' : 'photo', url, thumbnailUrl, req.user.id]
        );
        
        uploadedMedia.push({
          id: result.insertId,
          type: isVideo ? 'video' : 'photo',
          url,
          thumbnail_url: thumbnailUrl,
          uploaded_at: new Date()
        });
      }
      
      await connection.commit();
      
      // Send notification to Telegram
      const chatId = process.env.TELEGRAM_CHAT_ID;
      const siteUrl = process.env.SITE_URL || 'https://dvizh.kg';
      const uploaderName = req.user.first_name || req.user.username || 'Администратор';
      
      let message = `📸 Администратор *${uploaderName}* загрузил новые `;
      
      const photoCount = uploadedMedia.filter(m => m.type === 'photo').length;
      const videoCount = uploadedMedia.filter(m => m.type === 'video').length;
      
      if (photoCount > 0 && videoCount > 0) {
        message += `фоточки (${photoCount}) и видео (${videoCount})`;
      } else if (photoCount > 0) {
        message += `фоточки (${photoCount})`;
      } else {
        message += `видео (${videoCount})`;
      }
      
      message += ` на сайт!`;
      
      await sendMessageToChat(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '👀 Бегом глядеть', url: `${siteUrl}/media` }
          ]]
        }
      });
      
      res.json(uploadedMedia);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete media (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const mediaId = req.params.id;
    
    const [media] = await pool.execute(
      'SELECT * FROM media WHERE id = ?',
      [mediaId]
    );
    
    if (media.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    const mediaItem = media[0];
    
    await pool.execute('DELETE FROM media WHERE id = ?', [mediaId]);
    
    // Delete files from disk
    try {
      if (mediaItem.url) {
        const filePath = path.join(__dirname, '..', mediaItem.url);
        await fs.unlink(filePath);
      }
      
      if (mediaItem.thumbnail_url) {
        const thumbPath = path.join(__dirname, '..', mediaItem.thumbnail_url);
        await fs.unlink(thumbPath);
      }
    } catch (err) {
      console.error('Error deleting files:', err);
      // Не останавливаем процесс если файл не найден
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get media stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN type = 'photo' THEN 1 END) as photos,
        COUNT(CASE WHEN type = 'video' THEN 1 END) as videos,
        COUNT(DISTINCT event_id) as events
      FROM media
    `);
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Get media stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;