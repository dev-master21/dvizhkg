import express from 'express';
import { pool } from '../services/database.js';

const router = express.Router();

// Получить все сообщества (публичный эндпоинт)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT id, name, name_ru, city, city_ru, country, country_ru, 
             instagram, telegram
      FROM dvizh_communities
      WHERE 1=1
    `;
    
    const params = [];
    
    if (search && search.trim() !== '') {
      // Поиск по всем полям
      query += ` AND (
        name LIKE ? OR 
        name_ru LIKE ? OR 
        city LIKE ? OR 
        city_ru LIKE ? OR 
        country LIKE ? OR 
        country_ru LIKE ? OR
        search_tags LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    query += ' ORDER BY sort_order ASC, name ASC';
    
    const [communities] = await pool.execute(query, params);
    
    res.json(communities);
  } catch (error) {
    console.error('Get communities error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;