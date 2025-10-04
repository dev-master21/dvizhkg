import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { pool } from '../services/database.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { upload, optimizeImage } from '../middleware/upload.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import { sendMessageToChat } from '../services/telegram.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get media - ИСПРАВЛЕННАЯ ВЕРСИЯ
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { event_id, type, limit = '100', offset = '0' } = req.query;
    
    let query = `
      SELECT m.*, u.username, u.first_name, u.last_name, e.title as event_title
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      LEFT JOIN events e ON m.event_id = e.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Проверяем event_id более тщательно
    if (event_id && event_id !== 'null' && event_id !== 'undefined') {
      query += ' AND m.event_id = ?';
      params.push(parseInt(event_id) || null);
    }
    
    if (type && type !== 'all') {
      query += ' AND m.type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY m.uploaded_at DESC LIMIT ? OFFSET ?';
    
    // Убедимся что limit и offset - числа
    const limitNum = parseInt(limit) || 100;
    const offsetNum = parseInt(offset) || 0;
    params.push(limitNum, offsetNum);
    
    console.log('Media query:', query);
    console.log('Media params:', params);
    
    const [media] = await pool.execute(query, params);
    res.json(media);
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload media (admin only)
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
          thumbnailUrl = null;
        } else {
          // Use optimized image if available
          if (file.optimizedPath) {
            url = `/uploads/media/optimized-${file.filename}`;
            thumbnailUrl = `/uploads/thumbs/thumb-${file.filename}`;
          } else {
            url = `/uploads/media/${file.filename}`;
            thumbnailUrl = null;
          }
        }
        
        // Обработка event_id
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
    
    // Get media info
    const [media] = await pool.execute(
      'SELECT * FROM media WHERE id = ?',
      [mediaId]
    );
    
    if (media.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    const mediaItem = media[0];
    
    // Delete from database
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