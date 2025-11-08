// Main Backend Server
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000; // Changed to port 8000 to avoid conflicts

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 avatar data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/users', require('./api/users'));
app.use('/api/books', require('./api/books'));
app.use('/api/borrowing', require('./api/borrowing'));

// Serve static files (project root)
app.use('/', express.static(path.join(__dirname, '../')));
// Serve uploaded files (avatars) from backend/uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Default route - serve index.html for both root and /index.html
app.get(['/', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Fallback route for direct page access
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  if (req.path.endsWith('.html')) {
    const filePath = path.join(__dirname, '..', req.path);
    // Check if file exists
    if (require('fs').existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  // If no matching file, serve index.html
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Pustakalayah LibraryHub API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Pustakalayah LibraryHub API server running on port ${PORT}`);
  console.log(`📚 Access the application at: http://localhost:${PORT}`);
  console.log(`🔧 API endpoints available at: http://localhost:${PORT}/api`);
});

module.exports = app;
