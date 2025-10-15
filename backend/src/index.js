require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const totpRoutes = require('./routes/totp');
const syncRoutes = require('./routes/sync');
const db = require('./services/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware bezpieczeństwa
app.set('trust proxy', 1); // Trust first proxy
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 1000 // limit 100 requestów na IP
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/totp', totpRoutes);
app.use('/api/sync', syncRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Inicjalizuj bazę danych
    await db.initDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 TOTP Sync Backend running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Rate limiting: enabled`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
