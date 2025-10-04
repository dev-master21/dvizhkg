import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

// Import routes
import authRoutes from './routes/auth.js';
import eventsRoutes from './routes/events.js';
import mediaRoutes from './routes/media.js';
import usersRoutes from './routes/users.js';

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 1312;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 CORS enabled for: https://dvizh.kg, https://www.dvizh.kg`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});