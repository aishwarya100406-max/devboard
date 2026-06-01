const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/timelogs?days=7
router.get('/', (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const logs = db.prepare(`
    SELECT * FROM time_logs
    WHERE user_id = ? AND date >= date('now', ? || ' days')
    ORDER BY date ASC
  `).all(req.user.id, `-${days}`);
  res.json(logs);
});

// GET /api/timelogs/all
router.get('/all', (req, res) => {
  const logs = db.prepare('SELECT * FROM time_logs WHERE user_id = ? ORDER BY date DESC').all(req.user.id);
  res.json(logs);
});

// POST /api/timelogs  — upsert by date
router.post('/', (req, res) => {
  const { date, hours, notes } = req.body;
  if (!date || hours === undefined) return res.status(400).json({ error: 'date and hours are required' });
  if (isNaN(hours) || hours <= 0 || hours > 24) return res.status(400).json({ error: 'hours must be between 0 and 24' });

  db.prepare(`
    INSERT INTO time_logs (user_id, date, hours, notes)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET hours = excluded.hours, notes = excluded.notes
  `).run(req.user.id, date, hours, notes || null);

  const log = db.prepare('SELECT * FROM time_logs WHERE user_id = ? AND date = ?').get(req.user.id, date);
  res.status(201).json(log);
});

// DELETE /api/timelogs/:id
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM time_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Log not found' });
  res.status(204).end();
});

module.exports = router;
