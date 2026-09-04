import React, { useEffect, useState } from 'react';
import client from '../api/client';

const statusColors = {
  TODO: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-accent-soft text-accent',
  DONE: 'bg-emerald-50 text-emerald-700',
  BLOCKED: 'bg-red-50 text-danger'
};

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/tasks/mine').then((res) => setTasks(res.data.tasks)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-1">My tasks</h1>
      <p className="text-text-muted text-sm mb-6">Everything assigned to you, across every event.</p>

      {loading ? (
        <p className="text-text-muted text-sm">Loadingâ€¦</p>
      ) : tasks.length === 0 ? (
        <p className="text-text-muted text-sm">Nothing assigned to you yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((t) => (
            <div key={t._id} className="bg-surface border border-black/5 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-text-muted">{t.eventId?.title} Â· due {new Date(t.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' })} Â· {t.estimatedHours}h</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-md ${statusColors[t.status]}`}>{t.status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

