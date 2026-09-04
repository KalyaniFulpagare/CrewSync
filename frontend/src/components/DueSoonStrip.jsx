import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

export default function DueSoonStrip({ tasks }) {
  const now = Date.now();
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

  const dueSoon = tasks
    .filter((t) => t.status !== 'DONE')
    .filter((t) => new Date(t.dueDate).getTime() - now <= THREE_DAYS)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (dueSoon.length === 0) return null;

  return (
    <div className="bg-accent-soft rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Clock size={16} className="text-accent" />
        <span className="font-display font-semibold text-sm text-accent">Due in the next 3 days</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {dueSoon.map((t) => {
          const overdue = new Date(t.dueDate).getTime() < now;
          return (
            <Link key={t._id} to={`/events/${t.eventId?._id || t.eventId}`} className="flex items-center justify-between text-sm hover:underline">
              <span>{t.title}</span>
              <span className={overdue ? 'text-danger font-medium' : 'text-text-muted'}>
                {overdue ? 'Overdue' : new Date(t.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
