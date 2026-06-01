const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/timelogs?days=7
router.get('/', async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  try {
    const result = await pool.query(`
      SELECT * FROM time_logs
      WHERE user_id = $1 AND date >= CURRENT_DATE - ($2 * INTERVAL '1 day')
      ORDER BY date ASC
    `, [req.user.id, days]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/timelogs/all
router.get('/all', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM time_logs WHERE user_id = $1 ORDER BY date DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/timelogs — upsert by date
router.post('/', async (req, res) => {
  const { date, hours, notes } = req.body;
  if (!date || hours === undefined) return res.status(400).json({ error: 'date and hours are required' });
  if (isNaN(hours) || hours <= 0 || hours > 24) return res.status(400).json({ error: 'hours must be between 0 and 24' });

  try {
    await pool.query(`
      INSERT INTO time_logs (user_id, date, hours, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT(user_id, date) DO UPDATE SET hours = EXCLUDED.hours, notes = EXCLUDED.notes
    `, [req.user.id, date, hours, notes || null]);

    const result = await pool.query(
      'SELECT * FROM time_logs WHERE user_id = $1 AND date = $2',
      [req.user.id, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/timelogs/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM time_logs WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Log not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
