import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../services/database.js';
import { verifyTelegramAuth, checkChatMember } from '../services/telegram.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Check subscription status
router.post('/check-subscription', authRateLimiter, async (req, res) => {
  try {
    const { telegramId } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID required' });
    }
    
    const groupId = process.env.TELEGRAM_GROUP_ID;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    const [isGroupMember, isChatMember] = await Promise.all([
      checkChatMember(groupId, telegramId),
      checkChatMember(chatId, telegramId)
    ]);
    
    res.json({
      group: isGroupMember,
      chat: isChatMember
    });
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login/Register
router.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { id, first_name, last_name, username, photo_url, hash, auth_date } = req.body;
    
    // Verify Telegram auth data
    if (!verifyTelegramAuth(req.body)) {
      return res.status(401).json({ error: 'Invalid authentication data' });
    }
    
    // Check if auth is not too old (1 hour)
    const authTimestamp = parseInt(auth_date);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (currentTimestamp - authTimestamp > 3600) {
      return res.status(401).json({ error: 'Authentication expired' });
    }
    
    // Check subscriptions
    const groupId = process.env.TELEGRAM_GROUP_ID;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    const [isGroupMember, isChatMember] = await Promise.all([
      checkChatMember(groupId, id),
      checkChatMember(chatId, id)
    ]);
    
    if (!isGroupMember || !isChatMember) {
      return res.status(403).json({ 
        error: 'Please subscribe to our group and chat first',
        subscription: { group: isGroupMember, chat: isChatMember }
      });
    }
    
    const connection = await pool.getConnection();
    try {
      // Check if user exists
      const [existing] = await connection.execute(
        'SELECT * FROM users WHERE telegram_id = ?',
        [id]
      );
      
      let userId;
      let user;
      
      if (existing.length === 0) {
        // Create new user
        const [result] = await connection.execute(
          `INSERT INTO users (telegram_id, username, first_name, last_name, avatar_url) 
           VALUES (?, ?, ?, ?, ?)`,
          [id, username || null, first_name, last_name || null, photo_url || null]
        );
        userId = result.insertId;
        
        // Get created user
        const [newUsers] = await connection.execute(
          'SELECT * FROM users WHERE id = ?',
          [userId]
        );
        user = newUsers[0];
      } else {
        user = existing[0];
        
        // Check if blocked
        if (user.is_blocked) {
          return res.status(403).json({ error: 'User is blocked' });
        }
        
        // Update user info
        await connection.execute(
          `UPDATE users SET 
           username = ?, first_name = ?, last_name = ?, avatar_url = ?, last_active = CURRENT_TIMESTAMP
           WHERE telegram_id = ?`,
          [username || null, first_name, last_name || null, photo_url || null, id]
        );
        
        userId = user.id;
      }
      
      // Create JWT token
      const token = jwt.sign(
        { userId: userId },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      // Save session
      await connection.execute(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))',
        [userId, token]
      );
      
      res.json({ 
        token, 
        user: {
          ...user,
          username: username || user.username,
          first_name: first_name,
          last_name: last_name || user.last_name,
          avatar_url: photo_url || user.avatar_url
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  res.json(req.user);
});

// Logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    await pool.execute(
      'DELETE FROM sessions WHERE token = ?',
      [token]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;