import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function GitHub() {
  const { user, setUser } = useAuth();
  const [ghUsername, setGhUsername] = useState(user?.github_username || '');
  const [repos, setRepos] = useState([]);
  const [commits, setCommits] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchGitHub = async () => {
    setLoading(true);
    setError('');
    try {
      const [reposRes, commitsRes, statsRes] = await Promise.all([
        api.get('/github/repos'),
        api.get('/github/commits'),
        api.get('/github/stats'),
      ]);
      setRepos(reposRes.data);
      setCommits(commitsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch GitHub data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.github_username) fetchGitHub();
  }, []);

  const saveUsername = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/me', { github_username: ghUsername });
      setUser(data);
      await fetchGitHub();
    } catch {
      setError('Failed to save username');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-8 space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-white">GitHub</h2>

      {/* Connect */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">GitHub Username</h3>
        <div className="flex gap-3">
          <input
            value={ghUsername}
            onChange={e => setGhUsername(e.target.value)}
            placeholder="your-github-handle"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={saveUsername} disabled={saving || !ghUsername}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Connect'}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-blue-600/30 rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-blue-400">{stats.commitsThisWeek}</p>
            <p className="text-xs text-gray-500 mt-1">Commits this week</p>
          </div>
          <div className="bg-gray-900 border border-purple-600/30 rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-purple-400">{stats.streak}d</p>
            <p className="text-xs text-gray-500 mt-1">Current streak</p>
          </div>
        </div>
      )}

      {loading && <p className="text-gray-500 text-sm text-center py-4">Loading GitHub data…</p>}

      {/* Recent commits */}
      {commits.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Recent Commits</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {commits.map(c => (
              <div key={c.sha} className="flex gap-3 items-start py-2 border-b border-gray-800 last:border-0">
                <span className="font-mono text-xs text-gray-600 shrink-0 mt-0.5">{c.sha.slice(0, 7)}</span>
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{c.message}</p>
                  <p className="text-xs text-gray-500">{c.repo} · {new Date(c.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repos */}
      {repos.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Recent Repositories</h3>
          <div className="space-y-2">
            {repos.map(repo => (
              <a
                key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer"
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-800 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-blue-400 group-hover:underline">{repo.name}</p>
                  {repo.description && <p className="text-xs text-gray-500 truncate">{repo.description}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  {repo.language && <span className="text-xs text-gray-500">{repo.language}</span>}
                  {repo.stargazers_count > 0 && <span className="text-xs text-yellow-500">★ {repo.stargazers_count}</span>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
