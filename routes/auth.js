const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { username, email, password, github_username } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email, and password are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
  if (existing) {
    return res.status(409).json({ error: 'Email or username already taken' });
  }

  const password_hash = await bcrypt.hash(password, 12);
  const result = db
    .prepare('INSERT INTO users (username, email, password_hash, github_username) VALUES (?, ?, ?, ?)')
    .run(username, email, password_hash, github_username || null);

  const user = db.prepare('SELECT id, username, email, github_username FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ token: signToken(user), user });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const { password_hash, ...safeUser } = user;
  res.json({ token: signToken(safeUser), user: safeUser });
});

// GET /api/auth/me
const requireAuth = require('../middleware/auth');
router.get('/me', requireAuth, (req, res) => {
  const user = db
    .prepare('SELECT id, username, email, github_username, created_at FROM users WHERE id = ?')
    .get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// PATCH /api/auth/me — update github_username
router.patch('/me', requireAuth, (req, res) => {
  const { github_username } = req.body;
  db.prepare('UPDATE users SET github_username = ? WHERE id = ?').run(github_username || null, req.user.id);
  const user = db.prepare('SELECT id, username, email, github_username, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

module.exports = router;
