export default function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'from-blue-600/20 to-blue-600/5 border-blue-600/30 text-blue-400',
    green:  'from-green-600/20 to-green-600/5 border-green-600/30 text-green-400',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-600/30 text-purple-400',
    orange: 'from-orange-600/20 to-orange-600/5 border-orange-600/30 text-orange-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5`}>
      <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colors[color].split(' ').pop()}`}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
