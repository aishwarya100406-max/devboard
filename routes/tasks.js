const express = require('express');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  const { title, description, priority, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const validPriorities = ['High', 'Medium', 'Low'];
  const p = validPriorities.includes(priority) ? priority : 'Medium';

  try {
    const result = await pool.query(
      'INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, title, description || null, p, due_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const taskResult = await pool.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    const task = taskResult.rows[0];
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { title, description, priority, due_date, completed } = req.body;
    const validPriorities = ['High', 'Medium', 'Low'];

    const result = await pool.query(`
      UPDATE tasks SET
        title = $1, description = $2, priority = $3,
        due_date = $4, completed = $5, updated_at = NOW()
      WHERE id = $6 AND user_id = $7
      RETURNING *
    `, [
      title ?? task.title,
      description !== undefined ? description : task.description,
      validPriorities.includes(priority) ? priority : task.priority,
      due_date !== undefined ? due_date : task.due_date,
      completed !== undefined ? (completed ? 1 : 0) : task.completed,
      req.params.id,
      req.user.id,
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Task not found' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
