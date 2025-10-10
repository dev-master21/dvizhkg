import express from 'express';
import { pool } from '../services/database.js';
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { upload, optimizeImage } from '../middleware/upload.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Вспомогательная функция для безопасного парсинга размеров
// Вспомогательная функция для безопасного парсинга размеров
const parseSizes = (sizesString) => {
  if (!sizesString) return ['S', 'M', 'L', 'XL', 'XXL'];
  
  // Если это уже массив, возвращаем его как есть
  if (Array.isArray(sizesString)) {
    return sizesString;
  }
  
  try {
    // Проверяем тип данных
    if (typeof sizesString === 'string') {
      if (sizesString.startsWith('[')) {
        // Это JSON массив
        return JSON.parse(sizesString);
      } else {
        // Это строка через запятую
        return sizesString.split(',').map(s => s.trim());
      }
    } else {
      // Если это не строка и не массив, возвращаем дефолтные значения
      console.error('Unexpected sizes type:', typeof sizesString, sizesString);
      return ['S', 'M', 'L', 'XL', 'XXL'];
    }
  } catch (e) {
    console.error('Error parsing sizes:', e, sizesString);
    return ['S', 'M', 'L', 'XL', 'XXL'];
  }
};

// Get all merch (public)
router.get('/', async (req, res) => {
  try {
    const { category, type, revision } = req.query;
    
    let query = `
      SELECT m.*, 
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', mi.id,
            'url', mi.image_url,
            'thumbnail', mi.thumbnail_url,
            'is_primary', mi.is_primary,
            'order', mi.sort_order
          )
        ) as images
      FROM merch m
      LEFT JOIN merch_images mi ON m.id = mi.merch_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (category && category !== 'all') {
      query += ' AND m.category = ?';
      params.push(category);
    }
    
    if (type && type !== 'all') {
      query += ' AND m.type = ?';
      params.push(type);
    }
    
    if (revision && revision !== 'all') {
      query += ' AND m.revision = ?';
      params.push(revision);
    }
    
    query += ' GROUP BY m.id ORDER BY m.created_at DESC';
    
    const [items] = await pool.execute(query, params);
    
    // Parse images JSON и форматируем пути правильно
    const formattedItems = items.map(item => ({
      ...item,
      images: item.images ? 
        JSON.parse(`[${item.images}]`)
          .sort((a, b) => b.is_primary - a.is_primary || a.order - b.order)
          .map(img => ({
            ...img,
            url: img.url.startsWith('/') ? img.url : '/' + img.url,
            thumbnail: img.thumbnail ? (img.thumbnail.startsWith('/') ? img.thumbnail : '/' + img.thumbnail) : null
          })) : 
        [],
      sizes: parseSizes(item.sizes),
      available_sizes: parseSizes(item.available_sizes)
    }));
    
    res.json(formattedItems);
  } catch (error) {
    console.error('Get merch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single merch item
router.get('/:id', async (req, res) => {
  try {
    const [items] = await pool.execute(
      `SELECT m.*, 
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', mi.id,
            'url', mi.image_url,
            'thumbnail', mi.thumbnail_url,
            'is_primary', mi.is_primary,
            'order', mi.sort_order
          )
        ) as images
      FROM merch m
      LEFT JOIN merch_images mi ON m.id = mi.merch_id
      WHERE m.id = ?
      GROUP BY m.id`,
      [req.params.id]
    );
    
    if (items.length === 0) {
      return res.status(404).json({ error: 'Merch not found' });
    }
    
    const item = items[0];
    item.images = item.images ? 
      JSON.parse(`[${item.images}]`)
        .sort((a, b) => b.is_primary - a.is_primary || a.order - b.order)
        .map(img => ({
          ...img,
          url: img.url.startsWith('/') ? img.url : '/' + img.url,
          thumbnail: img.thumbnail ? (img.thumbnail.startsWith('/') ? img.thumbnail : '/' + img.thumbnail) : null
        })) : 
      [];
    item.sizes = parseSizes(item.sizes);
    item.available_sizes = parseSizes(item.available_sizes);
    
    res.json(item);
  } catch (error) {
    console.error('Get merch item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Остальной код остается без изменений...
// Create merch item (admin only)
router.post('/', authMiddleware, adminMiddleware, uploadRateLimiter, upload.array('images', 10), optimizeImage, async (req, res) => {
  try {
    const { 
      title, description, type, category, revision, 
      price, sizes, available_sizes, status 
    } = req.body;
    
    if (!title || !type || !category || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Create merch item
      const [result] = await connection.execute(
        `INSERT INTO merch 
         (title, description, type, category, revision, price, sizes, available_sizes, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          description || null,
          type,
          category,
          revision || null,
          price,
          sizes || JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
          available_sizes || sizes || JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
          status || 'available',
          req.user.id
        ]
      );
      
      const merchId = result.insertId;
      
      // Add images
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          
          let imageUrl, thumbnailUrl;
          
          if (file.optimizedPath && file.thumbnailPath) {
            imageUrl = `/uploads/merch/optimized-${file.filename}`;
            thumbnailUrl = `/uploads/thumbs/thumb-${file.filename}`;
          } else {
            imageUrl = `/uploads/merch/${file.filename}`;
            thumbnailUrl = null;
          }
          
          await connection.execute(
            'INSERT INTO merch_images (merch_id, image_url, thumbnail_url, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)',
            [merchId, imageUrl, thumbnailUrl, i === 0, i]
          );
        }
      }
      
      await connection.commit();
      res.json({ id: merchId, success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create merch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update merch item (admin only)
router.put('/:id', authMiddleware, adminMiddleware, upload.array('images', 10), optimizeImage, async (req, res) => {
  try {
    const merchId = req.params.id;
    const { 
      title, description, type, category, revision, 
      price, sizes, available_sizes, status 
    } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Update merch item
      await connection.execute(
        `UPDATE merch SET 
         title = ?, description = ?, type = ?, category = ?, 
         revision = ?, price = ?, sizes = ?, available_sizes = ?, status = ?
         WHERE id = ?`,
        [
          title, description, type, category, revision,
          price, sizes, available_sizes, status, merchId
        ]
      );
      
      // Add new images if uploaded
      if (req.files && req.files.length > 0) {
        const [maxOrder] = await connection.execute(
          'SELECT MAX(sort_order) as max_order FROM merch_images WHERE merch_id = ?',
          [merchId]
        );
        
        let startOrder = (maxOrder[0].max_order || 0) + 1;
        
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          
          let imageUrl, thumbnailUrl;
          
          if (file.optimizedPath && file.thumbnailPath) {
            imageUrl = `/uploads/merch/optimized-${file.filename}`;
            thumbnailUrl = `/uploads/thumbs/thumb-${file.filename}`;
          } else {
            imageUrl = `/uploads/merch/${file.filename}`;
            thumbnailUrl = null;
          }
          
          await connection.execute(
            'INSERT INTO merch_images (merch_id, image_url, thumbnail_url, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)',
            [merchId, imageUrl, thumbnailUrl, false, startOrder + i]
          );
        }
      }
      
      await connection.commit();
      res.json({ success: true });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update merch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete merch item (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.execute('DELETE FROM merch WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete merch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete merch image (admin only)
router.delete('/image/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.execute('DELETE FROM merch_images WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete merch image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set primary image (admin only)
router.post('/image/:id/primary', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const imageId = req.params.id;
    
    const [images] = await pool.execute(
      'SELECT merch_id FROM merch_images WHERE id = ?',
      [imageId]
    );
    
    if (images.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const merchId = images[0].merch_id;
    
    await pool.execute(
      'UPDATE merch_images SET is_primary = FALSE WHERE merch_id = ?',
      [merchId]
    );
    
    await pool.execute(
      'UPDATE merch_images SET is_primary = TRUE WHERE id = ?',
      [imageId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Set primary image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;