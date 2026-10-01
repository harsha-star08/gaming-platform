import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { generateContextAwareChat, generateWeeklyAiAnalysis, getStudentPerformanceMetrics } from '../services/aiService.js';

const router = express.Router();

router.use(authenticateToken);

// 1. Context-Aware AI Chat Assistant (Section 28 & 29)
router.post('/chat', (req, res) => {
  const studentId = req.user.id;
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  const response = generateContextAwareChat(studentId, message);
  return res.json(response);
});

// 2. Dedicated Centralized AI Performance & Week-by-Week Analysis (Section 30 & 31)
router.get('/performance', (req, res) => {
  const studentId = req.user.id;
  const analysis = generateWeeklyAiAnalysis(studentId);
  const rawMetrics = getStudentPerformanceMetrics(studentId);

  return res.json({
    analysis,
    metrics: rawMetrics
  });
});

export default router;
