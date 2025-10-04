import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Добавьте эту опцию если не хотите использовать trust proxy
  skip: (req) => {
    // Можно пропускать rate limiting для локальных запросов
    return req.ip === '127.0.0.1' || req.ip === '::1';
  },
  keyGenerator: (req) => {
    // Используем реальный IP из заголовков nginx
    return req.headers['x-real-ip'] || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection.remoteAddress;
  }
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    return req.headers['x-real-ip'] || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection.remoteAddress;
  }
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 uploads per hour
  message: 'Upload limit exceeded, please try again later.',
  keyGenerator: (req) => {
    return req.headers['x-real-ip'] || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection.remoteAddress;
  }
});