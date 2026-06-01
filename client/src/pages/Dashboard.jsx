import { useEffect, useState } from 'react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import HoursChart from '../components/HoursChart';
import { useAuth } from '../context/AuthContext';

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ commitsThisWeek: null, streak: null });
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetches = [
      api.get('/tasks').then(r => setTasks(r.data)).catch(() => {}),
      api.get('/timelogs?days=7').then(r => setLogs(r.data)).catch(() => {}),
    ];
    if (user?.github_username) {
      fetches.push(api.get('/github/stats').then(r => setStats(r.data)).catch(() => {}));
    }
    Promise.all(fetches).finally(() => setLoading(false));
  }, [user]);

  const days = getLast7Days();
  const logMap = Object.fromEntries(logs.map(l => [l.date, l.hours]));
  const chartData = days.map(d => ({ date: d.slice(5), hours: logMap[d] || 0 }));

  const totalHours = logs.reduce((s, l) => s + l.hours, 0);
  const doneTasks = tasks.filter(t => t.completed).length;

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-500">Loading dashboard…</div>;

  return (
    <div className="flex-1 p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Good to see you, {user?.username} 👋</h2>
        <p className="text-gray-500 text-sm mt-1">Here's your productivity snapshot</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Commits this week" value={stats.commitsThisWeek ?? (user?.github_username ? '…' : 'N/A')} color="blue" />
        <StatCard label="Streak" value={stats.streak != null ? `${stats.streak}d` : (user?.github_username ? '…' : 'N/A')} sub="consecutive days" color="purple" />
        <StatCard label="Tasks done" value={doneTasks} sub={`of ${tasks.length} total`} color="green" />
        <StatCard label="Hours logged" value={totalHours.toFixed(1)} sub="last 7 days" color="orange" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Coding Hours — Last 7 Days</h3>
        <HoursChart data={chartData} />
      </div>

      {!user?.github_username && (
        <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl px-5 py-4 text-sm text-yellow-300">
          Connect your GitHub username in the{' '}
          <a href="/github" className="underline">GitHub tab</a> to see commit stats.
        </div>
      )}
    </div>
  );
}
