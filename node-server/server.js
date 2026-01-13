// ===========================================
// GeoProof - Geolocation Camera Attendance System
// ===========================================
require('dotenv').config(); // Load environment variables first!

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const app = express();
const port = process.env.PORT || 3001;

// Trust proxy - required for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Import routes
const presensiRoutes = require('./routes/presensi');
const reportRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');
const geofenceRoutes = require('./routes/geofences');

// Import rate limiter
const rateLimit = require('express-rate-limit');

// ===========================================
// Security Middleware
// ===========================================
// Helmet for security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow serving images cross-origin
}));

// CORS Configuration - localhost only
const corsOptions = {
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Rate limiting - general
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { message: 'Terlalu banyak request, coba lagi nanti' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

// Rate limiting - stricter for attendance submit
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.SUBMIT_RATE_LIMIT_MAX) || 10,
  message: { message: 'Terlalu banyak percobaan submit presensi, coba lagi nanti' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Export for use in routes
app.set('submitLimiter', submitLimiter);

// ===========================================
// Standard Middleware
// ===========================================
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ===========================================
// Routes
// ===========================================
app.get('/', (req, res) => {
  res.json({
    name: 'GeoProof API',
    version: '1.0.0',
    description: 'Geolocation Camera Attendance System',
    endpoints: {
      auth: '/api/auth',
      presensi: '/api/presensi',
      reports: '/api/reports',
      geofences: '/api/geofences'
    }
  });
});

app.use('/api/presensi', presensiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/geofences', geofenceRoutes);

// ===========================================
// Error Handling
// ===========================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// ===========================================
// Start Server
// ===========================================
app.listen(port, () => {
  console.log('===========================================');
  console.log('  GeoProof - Geolocation Attendance System');
  console.log('===========================================');
  console.log(`  Server running on http://localhost:${port}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('===========================================');
});
