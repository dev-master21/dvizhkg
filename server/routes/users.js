import express from 'express';
import { pool } from '../services/database.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { kickChatMember } from '../services/telegram.js';

const router = express.Router();

// Get user profile
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't send sensitive data
    const user = { ...users[0] };
    delete user.is_blocked;
    
    // Only admins can see blocked status
    if (req.user.role === 'admin') {
      user.is_blocked = users[0].is_blocked;
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user stats
router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get user's rank
    const [rankResult] = await pool.execute(
      `SELECT COUNT(*) + 1 as rank 
       FROM users 
       WHERE reputation > (SELECT reputation FROM users WHERE id = ?)`,
      [userId]
    );
    
    // Get events count
    const [eventsResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM event_registrations WHERE user_id = ?',
      [userId]
    );
    
    // Get recent events
    const [recentEvents] = await pool.execute(
      `SELECT e.id, e.title, e.event_date, e.status
       FROM event_registrations er
       JOIN events e ON er.event_id = e.id
       WHERE er.user_id = ?
       ORDER BY e.event_date DESC
       LIMIT 5`,
      [userId]
    );
    
    // Calculate days in dvizh
    const [userDates] = await pool.execute(
      'SELECT registration_date FROM users WHERE id = ?',
      [userId]
    );
    
    const daysInDvizh = userDates.length > 0 
      ? Math.floor((Date.now() - new Date(userDates[0].registration_date)) / (1000 * 60 * 60 * 24))
      : 0;
    
    res.json({
      rank: rankResult[0].rank,
      events_count: eventsResult[0].count,
      recent_events: recentEvents,
      days_in_dvizh: daysInDvizh
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (for search)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search = '', limit = 50 } = req.query;
    
    let query = `
      SELECT id, telegram_id, username, first_name, last_name, avatar_url, reputation, message_count
      FROM users
      WHERE is_blocked = FALSE
    `;
    
    const params = [];
    
    if (search) {
      query += ` AND (
        first_name LIKE ? OR 
        last_name LIKE ? OR 
        username LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    query += ' ORDER BY reputation DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [users] = await pool.execute(query, params);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get top users
router.get('/top', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, telegram_id, username, first_name, last_name, avatar_url, reputation, message_count
       FROM users
       WHERE reputation > 0 AND is_blocked = FALSE
       ORDER BY reputation DESC
       LIMIT 20`
    );
    
    res.json(users);
  } catch (error) {
    console.error('Get top users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user reputation (admin only)
router.put('/:id/reputation', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reputation } = req.body;
    const userId = req.params.id;
    
    if (reputation < 0) {
      return res.status(400).json({ error: 'Reputation cannot be negative' });
    }
    
    await pool.execute(
      'UPDATE users SET reputation = ? WHERE id = ?',
      [reputation, userId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update reputation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Block user (admin only)
router.post('/:id/block', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get user's Telegram ID
    const [users] = await pool.execute(
      'SELECT telegram_id FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Block user in database
    await pool.execute(
      'UPDATE users SET is_blocked = TRUE WHERE id = ?',
      [userId]
    );
    
    // Kick from Telegram chat
    const chatId = process.env.TELEGRAM_CHAT_ID;
    await kickChatMember(chatId, users[0].telegram_id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unblock user (admin only)
router.post('/:id/unblock', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    
    await pool.execute(
      'UPDATE users SET is_blocked = FALSE WHERE id = ?',
      [userId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;