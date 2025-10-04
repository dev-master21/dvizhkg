import jwt from 'jsonwebtoken';
import { pool } from '../services/database.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ? AND is_blocked = FALSE',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found or blocked' });
    }

    // Update last active
    await pool.execute(
      'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?',
      [decoded.userId]
    );

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(500).json({ error: 'Server error' });
  }
};


export const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [decoded.userId]
    );

    req.user = users[0] || null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};