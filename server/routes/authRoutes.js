import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/schema.js';
import { generateToken, authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body;

    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ error: 'All fields (name, email, password, confirm password, role) are required.' });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!['STUDENT', 'MENTOR'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either STUDENT or MENTOR.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please login instead.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRes = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run(trimmedName, trimmedEmail, passwordHash, role);

    const userId = userRes.lastInsertRowid;

    if (role === 'STUDENT') {
      // Clean zero start as required by Section 3
      db.prepare(`
        INSERT INTO student_profiles (user_id, xp, level, skill_coins, current_streak, longest_streak)
        VALUES (?, 0, 1, 0, 0, 0)
      `).run(userId);

      // Welcome notification
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, 'SYSTEM', 'Welcome to UpSkill!', 'Start your journey by exploring the Course Library or solving your first coding challenge.')
      `).run(userId);
    } else {
      db.prepare(`
        INSERT INTO mentor_profiles (user_id)
        VALUES (?)
      `).run(userId);

      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, 'SYSTEM', 'Welcome Mentor!', 'You can now search for students, send mentor requests, create quizzes, and evaluate coding tests.')
      `).run(userId);
    }

    const user = { id: userId, name: trimmedName, email: trimmedEmail, role };
    const token = generateToken(user);

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT id, name, email, password_hash, role FROM users WHERE email = ?').get(trimmedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Role validation: selected role must match the user's actual database role
    if (role && user.role !== role) {
      const actualRoleLabel = user.role === 'STUDENT' ? 'Student' : 'Mentor';
      const correctSelection = user.role === 'STUDENT' ? 'Student' : 'Mentor';
      return res.status(403).json({
        error: `These credentials belong to a ${actualRoleLabel} account. Please select ${correctSelection} to continue.`
      });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = generateToken(safeUser);

    return res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  let profile = null;
  if (req.user.role === 'STUDENT') {
    profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(req.user.id);
  } else {
    profile = db.prepare('SELECT * FROM mentor_profiles WHERE user_id = ?').get(req.user.id);
  }

  return res.json({
    user: req.user,
    profile
  });
});

export default router;
