import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../services/database.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Generate auth session
router.post('/generate-session', authRateLimiter, async (req, res) => {
  try {
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    // Store session in database
    await pool.execute(
      'INSERT INTO auth_sessions (session_id, created_at, expires_at) VALUES (?, NOW(), DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
      [sessionId]
    );
    
    const botUsername = process.env.TELEGRAM_BOT_USERNAME;
    const botLink = `https://t.me/${botUsername}?start=auth_${sessionId}`;
    
    res.json({ 
      sessionId,
      botLink 
    });
  } catch (error) {
    console.error('Generate session error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check auth session status
router.post('/check-session', authRateLimiter, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    // Check if auth token exists for this session
    const [tokens] = await pool.execute(
      `SELECT at.*, u.* FROM auth_tokens at
       JOIN users u ON at.user_id = u.id
       WHERE at.session_id = ? AND at.expires_at > NOW()`,
      [sessionId]
    );
    
    if (tokens.length === 0) {
      return res.json({ status: 'pending' });
    }
    
    const tokenData = tokens[0];
    
    // Create JWT token
    const jwtToken = jwt.sign(
      { userId: tokenData.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Save session
    await pool.execute(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))',
      [tokenData.user_id, jwtToken]
    );
    
    // Delete used auth token
    await pool.execute(
      'DELETE FROM auth_tokens WHERE session_id = ?',
      [sessionId]
    );
    
    // Prepare user data
    const user = {
      id: tokenData.user_id,
      telegram_id: tokenData.telegram_id,
      username: tokenData.username,
      first_name: tokenData.first_name,
      last_name: tokenData.last_name,
      avatar_url: tokenData.avatar_url,
      reputation: tokenData.reputation,
      message_count: tokenData.message_count,
      role: tokenData.role
    };
    
    res.json({ 
      status: 'authorized',
      token: jwtToken,
      user
    });
  } catch (error) {
    console.error('Check session error:', error);
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