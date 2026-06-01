const express = require('express');
const axios = require('axios');
const pool = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function ghHeaders() {
  const headers = { Accept: 'application/vnd.github+json' };
  const token = process.env.GITHUB_TOKEN;
  if (token && token.startsWith('ghp_') && token.length > 20 && !token.includes('your_')) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function getGithubUsername(userId) {
  const result = await pool.query('SELECT github_username FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.github_username || null;
}

// GET /api/github/repos
router.get('/repos', async (req, res) => {
  const ghUser = await getGithubUsername(req.user.id);
  if (!ghUser) return res.status(400).json({ error: 'No GitHub username set. Update your profile.' });

  try {
    const { data } = await axios.get(
      `https://api.github.com/users/${ghUser}/repos?sort=updated&per_page=10`,
      { headers: ghHeaders() }
    );
    const repos = data.map(r => ({
      id: r.id, name: r.name, full_name: r.full_name,
      description: r.description, html_url: r.html_url,
      language: r.language, stargazers_count: r.stargazers_count, updated_at: r.updated_at,
    }));
    res.json(repos);
  } catch (err) {
    const status = err.response?.status;
    res.status(status === 401 || status === 403 ? 502 : status || 500).json({ error: err.response?.data?.message || 'GitHub API error' });
  }
});

// GET /api/github/commits
router.get('/commits', async (req, res) => {
  const ghUser = await getGithubUsername(req.user.id);
  if (!ghUser) return res.status(400).json({ error: 'No GitHub username set.' });

  try {
    const { data } = await axios.get(
      `https://api.github.com/users/${ghUser}/events/public?per_page=30`,
      { headers: ghHeaders() }
    );
    const pushEvents = data
      .filter(e => e.type === 'PushEvent')
      .flatMap(e =>
        (e.payload.commits || []).map(c => ({
          sha: c.sha, message: c.message, repo: e.repo.name, date: e.created_at,
        }))
      )
      .slice(0, 20);
    res.json(pushEvents);
  } catch (err) {
    const status = err.response?.status;
    res.status(status === 401 || status === 403 ? 502 : status || 500).json({ error: err.response?.data?.message || 'GitHub API error' });
  }
});

// GET /api/github/stats
router.get('/stats', async (req, res) => {
  const ghUser = await getGithubUsername(req.user.id);
  if (!ghUser) return res.status(400).json({ error: 'No GitHub username set.' });

  try {
    const { data } = await axios.get(
      `https://api.github.com/users/${ghUser}/events/public?per_page=100`,
      { headers: ghHeaders() }
    );

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let commitsThisWeek = 0;
    const commitDays = new Set();

    for (const event of data) {
      if (event.type !== 'PushEvent') continue;
      const eventDate = new Date(event.created_at);
      commitDays.add(eventDate.toISOString().slice(0, 10));
      if (eventDate >= oneWeekAgo) {
        commitsThisWeek += event.payload.commits?.length || 0;
      }
    }

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (commitDays.has(d.toISOString().slice(0, 10))) streak++;
      else break;
    }

    res.json({ commitsThisWeek, streak, ghUser });
  } catch (err) {
    const status = err.response?.status;
    res.status(status === 401 || status === 403 ? 502 : status || 500).json({ error: err.response?.data?.message || 'GitHub API error' });
  }
});

module.exports = router;
