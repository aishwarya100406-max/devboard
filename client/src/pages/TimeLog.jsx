import { useEffect, useState } from 'react';
import api from '../api/axios';

const today = () => new Date().toISOString().slice(0, 10);

export default function TimeLog() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ date: today(), hours: '', notes: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => api.get('/timelogs/all').then(r => setLogs(r.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/timelogs', { ...form, hours: parseFloat(form.hours) });
      setSuccess('Logged!');
      setForm({ date: today(), hours: '', notes: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log time');
    }
  };

  const remove = async (id) => {
    await api.delete(`/timelogs/${id}`);
    load();
  };

  const totalThisWeek = logs
    .filter(l => {
      const d = new Date(l.date);
      const week = new Date();
      week.setDate(week.getDate() - 7);
      return d >= week;
    })
    .reduce((s, l) => s + l.hours, 0);

  return (
    <div className="flex-1 p-8 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-white">Time Log</h2>
        <p className="text-gray-500 text-sm mt-1">
          {totalThisWeek.toFixed(1)} hrs logged in the last 7 days
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-400">Log Coding Time</h3>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">{success}</p>}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input
              type="date" required value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="w-28">
            <label className="block text-xs text-gray-500 mb-1">Hours</label>
            <input
              type="number" required min="0.5" max="24" step="0.5" value={form.hours}
              onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
              placeholder="2.5"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <input
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Notes (optional)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
        />
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">
          Save Log
        </button>
      </form>

      {/* History */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3">History</h3>
        <div className="space-y-2">
          {logs.length === 0 && <p className="text-gray-600 text-sm text-center py-6">No logs yet</p>}
          {logs.map(log => (
            <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-white">{log.date}</span>
                {log.notes && <span className="text-xs text-gray-500 ml-3">{log.notes}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-blue-400 font-semibold text-sm">{log.hours} hrs</span>
                <button onClick={() => remove(log.id)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
