require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db');
const { initAiWorker } = require('./queue');
const { Client: MinioClient } = require('minio');

// Route imports
const authRoutes = require('./modules/auth/routes');
const examRoutes = require('./modules/exams/routes');
const classRoutes = require('./modules/classes/routes');
const gradingRoutes = require('./modules/grading/routes');
const proctoringRoutes = require('./modules/proctoring/routes');
const analyticsRoutes = require('./modules/analytics/routes');

const app = express();
const server = http.createServer(app);

// Initialize MinIO client
const minioClient = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'admin123',
});

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Expose MinIO and Socket.io instances on app
app.set('io', io);
app.set('minio', minioClient);

// Initialize Background Workers
initAiWorker(io, minioClient);

app.use(cors());
app.use(express.json());

// Register API modules
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/submissions', gradingRoutes);
app.use('/api/exams/:examId/proctoring', proctoringRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    // Verify DB Connection
    await db.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
    });
  }
});

// Real-time Event Management via Socket.io
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // Join the proctoring monitoring room for a specific exam
  socket.on('join_exam_monitor', (examId) => {
    const roomName = `exam:${examId}`;
    socket.join(roomName);
    console.log(`Client ${socket.id} joined monitoring room: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
