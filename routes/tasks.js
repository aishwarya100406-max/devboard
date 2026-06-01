const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/tasks
router.get('/', (req, res) => {
  const tasks = db
    .prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json(tasks);
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, description, priority, due_date } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const validPriorities = ['High', 'Medium', 'Low'];
  const p = validPriorities.includes(priority) ? priority : 'Medium';

  const result = db
    .prepare('INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, title, description || null, p, due_date || null);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, description, priority, due_date, completed } = req.body;
  const validPriorities = ['High', 'Medium', 'Low'];

  db.prepare(`
    UPDATE tasks SET
      title = ?,
      description = ?,
      priority = ?,
      due_date = ?,
      completed = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(
    title ?? task.title,
    description !== undefined ? description : task.description,
    validPriorities.includes(priority) ? priority : task.priority,
    due_date !== undefined ? due_date : task.due_date,
    completed !== undefined ? (completed ? 1 : 0) : task.completed,
    req.params.id,
    req.user.id
  );

  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Task not found' });
  res.status(204).end();
});

module.exports = router;
