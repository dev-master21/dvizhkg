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
      'INSERT INTO auth_sessions (session_id, expires_at) VALUES (?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
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

// Check auth session status (for polling)
router.post('/check-session', authRateLimiter, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    // Check if session is still valid
    const [sessions] = await pool.execute(
      'SELECT * FROM auth_sessions WHERE session_id = ? AND expires_at > NOW()',
      [sessionId]
    );
    
    if (sessions.length === 0) {
      return res.json({ status: 'expired' });
    }
    
    // Check if immediate auth token exists for this session
    const [tokens] = await pool.execute(
      `SELECT at.*, u.* FROM auth_tokens at
       JOIN users u ON at.user_id = u.id
       WHERE at.session_id = ? 
       AND at.token_type = 'immediate' 
       AND at.expires_at > NOW() 
       AND at.used = FALSE`,
      [sessionId]
    );
    
    if (tokens.length === 0) {
      return res.json({ status: 'pending' });
    }
    
    const tokenData = tokens[0];
    
    // Mark token as used
    await pool.execute(
      'UPDATE auth_tokens SET used = TRUE WHERE id = ?',
      [tokenData.id]
    );
    
    // Create JWT token (12 hours)
    const jwtToken = jwt.sign(
      { userId: tokenData.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );
    
    // Save session
    await pool.execute(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 12 HOUR))',
      [tokenData.user_id, jwtToken]
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

// Auth via Telegram URL token
router.post('/auth-telegram', authRateLimiter, async (req, res) => {
  try {
    const { sessionId, token } = req.body;
    
    if (!sessionId || !token) {
      return res.status(400).json({ 
        error: 'Session ID and token required',
        status: 'error'
      });
    }
    
    // Check if token is valid
    const [tokens] = await pool.execute(
      `SELECT at.*, u.* FROM auth_tokens at
       JOIN users u ON at.user_id = u.id
       WHERE at.session_id = ? 
       AND at.token = ?
       AND at.token_type = 'url'
       AND at.expires_at > NOW()`,
      [sessionId, token]
    );
    
    if (tokens.length === 0) {
      // Check if session expired
      const [sessions] = await pool.execute(
        'SELECT * FROM auth_sessions WHERE session_id = ?',
        [sessionId]
      );
      
      if (sessions.length === 0) {
        return res.status(401).json({ 
          error: 'Invalid session',
          status: 'invalid'
        });
      }
      
      const session = sessions[0];
      if (new Date(session.expires_at) < new Date()) {
        return res.status(401).json({ 
          error: 'Session expired',
          status: 'expired'
        });
      }
      
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        status: 'invalid'
      });
    }
    
    const tokenData = tokens[0];
    
    // Check if token was already used
    if (tokenData.used) {
      // User is already authorized, check if they have an active session
      const [activeSessions] = await pool.execute(
        'SELECT * FROM sessions WHERE user_id = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
        [tokenData.user_id]
      );
      
      if (activeSessions.length > 0) {
        return res.json({ 
          status: 'already_authorized',
          message: 'You are already logged in'
        });
      }
    }
    
    // Mark token as used
    await pool.execute(
      'UPDATE auth_tokens SET used = TRUE WHERE id = ?',
      [tokenData.id]
    );
    
    // Create JWT token (12 hours)
    const jwtToken = jwt.sign(
      { userId: tokenData.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );
    
    // Save session
    await pool.execute(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 12 HOUR))',
      [tokenData.user_id, jwtToken]
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
    console.error('Auth telegram error:', error);
    res.status(500).json({ 
      error: 'Server error',
      status: 'error'
    });
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

// Clean up expired sessions and tokens (run periodically)
router.post('/cleanup', async (req, res) => {
  try {
    // Clean expired auth sessions
    await pool.execute(
      'DELETE FROM auth_sessions WHERE expires_at < NOW()'
    );
    
    // Clean expired auth tokens
    await pool.execute(
      'DELETE FROM auth_tokens WHERE expires_at < NOW()'
    );
    
    // Clean expired sessions
    await pool.execute(
      'DELETE FROM sessions WHERE expires_at < NOW()'
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;