import { useEffect, useState } from 'react';
import api from '../api/axios';

const PRIORITIES = ['High', 'Medium', 'Low'];
const PRIORITY_COLOR = { High: 'text-red-400 bg-red-900/30', Medium: 'text-yellow-400 bg-yellow-900/30', Low: 'text-green-400 bg-green-900/30' };

const emptyForm = { title: '', description: '', priority: 'Medium', due_date: '' };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const load = () => api.get('/tasks').then(r => setTasks(r.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        await api.put(`/tasks/${editId}`, form);
        setEditId(null);
      } else {
        await api.post('/tasks', form);
      }
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
    }
  };

  const toggle = async (task) => {
    await api.put(`/tasks/${task.id}`, { completed: !task.completed });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    load();
  };

  const startEdit = (task) => {
    setEditId(task.id);
    setForm({ title: task.title, description: task.description || '', priority: task.priority, due_date: task.due_date || '' });
  };

  const cancelEdit = () => { setEditId(null); setForm(emptyForm); };

  const filtered = tasks.filter(t =>
    filter === 'all' ? true : filter === 'done' ? t.completed : !t.completed
  );

  return (
    <div className="flex-1 p-8 space-y-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-white">Tasks</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-400">{editId ? 'Edit Task' : 'New Task'}</h3>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <input
          required value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Task title"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
        />
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Description (optional)"
          rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
        />
        <div className="flex gap-3">
          <select
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
          <input
            type="date" value={form.due_date}
            onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <div className="flex gap-2 ml-auto">
            {editId && (
              <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 transition-colors">
                Cancel
              </button>
            )}
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
              {editId ? 'Update' : 'Add Task'}
            </button>
          </div>
        </div>
      </form>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'active', 'done'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-gray-600 text-sm text-center py-8">No tasks here</p>}
        {filtered.map(task => (
          <div key={task.id} className={`bg-gray-900 border rounded-xl px-4 py-3 flex items-start gap-3 ${task.completed ? 'border-gray-800 opacity-60' : 'border-gray-800'}`}>
            <button onClick={() => toggle(task)} className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${task.completed ? 'bg-green-600 border-green-600 text-white' : 'border-gray-600 hover:border-blue-500'}`}>
              {task.completed && '✓'}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>{task.title}</p>
              {task.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>}
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[task.priority]}`}>{task.priority}</span>
                {task.due_date && <span className="text-xs text-gray-500">Due {task.due_date}</span>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => startEdit(task)} className="text-gray-500 hover:text-blue-400 px-2 py-1 text-xs transition-colors">Edit</button>
              <button onClick={() => remove(task.id)} className="text-gray-500 hover:text-red-400 px-2 py-1 text-xs transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
