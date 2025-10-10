import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

// Import database pool for cleanup
import { pool } from './services/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import eventsRoutes from './routes/events.js';
import mediaRoutes from './routes/media.js';
import usersRoutes from './routes/users.js';
import merchRoutes from './routes/merch.js';
import communitiesRoutes from './routes/communities.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = createServer(app);

// Trust proxy
app.set('trust proxy', true);

// CORS configuration - ИСПРАВЛЕННЫЙ
const corsOptions = {
  origin: function (origin, callback) {
    // Разрешаем запросы с этих доменов
    const allowedOrigins = [
      'https://dvizh.kg',
      'https://www.dvizh.kg',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    
    // Разрешаем запросы без origin (например, от Postman или curl)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Остальные middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
import { mkdir } from 'fs/promises';
try {
  await mkdir(path.join(__dirname, 'uploads'), { recursive: true });
  await mkdir(path.join(__dirname, 'uploads', 'events'), { recursive: true });
  await mkdir(path.join(__dirname, 'uploads', 'media'), { recursive: true });
  await mkdir(path.join(__dirname, 'uploads', 'thumbs'), { recursive: true });
  await mkdir(path.join(__dirname, 'uploads', 'merch'), { recursive: true });
} catch (err) {
  console.error('Error creating directories:', err);
}

// Rate limiting
app.use('/api/', rateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/merch', merchRoutes);
app.use('/api/communities', communitiesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Clean up expired auth sessions and tokens periodically
const cleanupExpiredAuth = async () => {
  try {
    // Clean expired auth sessions
    const [sessionsResult] = await pool.execute(
      'DELETE FROM auth_sessions WHERE expires_at < NOW()'
    );
    
    // Clean expired auth tokens
    const [tokensResult] = await pool.execute(
      'DELETE FROM auth_tokens WHERE expires_at < NOW()'
    );
    
    // Clean expired user sessions (JWT sessions)
    const [userSessionsResult] = await pool.execute(
      'DELETE FROM sessions WHERE expires_at < NOW()'
    );
    
    const totalDeleted = 
      (sessionsResult.affectedRows || 0) + 
      (tokensResult.affectedRows || 0) + 
      (userSessionsResult.affectedRows || 0);
    
    if (totalDeleted > 0) {
      console.log(`✅ Cleaned up expired auth data: ${totalDeleted} records`);
    }
  } catch (error) {
    console.error('❌ Auth cleanup error:', error);
  }
};

// Run cleanup on startup
cleanupExpiredAuth();

// Schedule cleanup every hour
const cleanupInterval = setInterval(cleanupExpiredAuth, 60 * 60 * 1000);

// Also run more frequent cleanup for auth tokens (every 5 minutes)
// since they expire quickly (1 minute lifetime)
const tokenCleanupInterval = setInterval(async () => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM auth_tokens WHERE expires_at < NOW()'
    );
    if (result.affectedRows > 0) {
      console.log(`🔄 Cleaned ${result.affectedRows} expired auth tokens`);
    }
  } catch (error) {
    console.error('Token cleanup error:', error);
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Start server
const PORT = process.env.PORT || 1312;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 CORS enabled for: https://dvizh.kg, https://www.dvizh.kg`);
  console.log(`🔄 Auth cleanup scheduled: hourly for sessions, every 5 min for tokens`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  
  // Clear intervals
  clearInterval(cleanupInterval);
  clearInterval(tokenCleanupInterval);
  
  server.close(() => {
    console.log('HTTP server closed');
    // Close database connections
    pool.end().then(() => {
      console.log('Database connections closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  
  // Clear intervals
  clearInterval(cleanupInterval);
  clearInterval(tokenCleanupInterval);
  
  server.close(() => {
    console.log('HTTP server closed');
    // Close database connections  
    pool.end().then(() => {
      console.log('Database connections closed');
      process.exit(0);
    });
  });
});