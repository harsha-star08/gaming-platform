import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

import { initDatabase } from './db/schema.js';
import { seedEducationalContent } from './db/seed.js';

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import codingRoutes from './routes/codingRoutes.js';
import mentorRoutes from './routes/mentorRoutes.js';
import mentorRequestRoutes from './routes/mentorRequestRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import rewardRoutes from './routes/rewardRoutes.js';
import streakRoutes from './routes/streakRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import publicMentorRoutes from './routes/publicMentorRoutes.js';
import mentorInboxRoutes from './routes/mentorInboxRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database & Seeds
initDatabase();
seedEducationalContent();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', platform: 'UpSkill Gamified Platform', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/mentor-requests', mentorRequestRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/mentors', publicMentorRoutes);
app.use('/api/mentor-inbox', mentorInboxRoutes);

// Explicit 404 for unhandled API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// In production, serve frontend build
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('API Server Running. Vite client dev server is available on port 5173.');
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`UpSkill Backend API Server running on http://localhost:${PORT}`);
});
