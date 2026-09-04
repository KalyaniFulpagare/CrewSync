import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CircleCheckBig, ListTodo, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import EventCard from '../components/EventCard';
import DueSoonStrip from '../components/DueSoonStrip';

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([client.get('/events'), client.get('/tasks/mine')])
      .then(([eventsRes, tasksRes]) => {
        setEvents(eventsRes.data.events);
        setMyTasks(tasksRes.data.tasks);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="premium-card relative overflow-hidden p-7 sm:p-8 mb-7 bg-gradient-to-br from-ink via-[#25295a] to-accent text-white">
        <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55 mb-3">CrewSync workspace</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">Good to see you, {user?.name?.split(' ')[0] || 'there'}.</h1>
            <p className="text-sm text-white/65 mt-2">One view for every event, deadline, and commitment.</p>
          </div>
          <Link to="/clubs" className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold bg-white text-ink px-4 py-2.5 rounded-xl hover:-translate-y-px">Manage clubs <ArrowRight size={16} /></Link>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
        <div className="premium-card p-4"><CalendarDays size={18} className="text-accent mb-3" /><p className="text-2xl font-display font-bold">{events.length}</p><p className="text-xs text-text-muted mt-1">Active events</p></div>
        <div className="premium-card p-4"><ListTodo size={18} className="text-warning mb-3" /><p className="text-2xl font-display font-bold">{myTasks.filter((task) => task.status !== 'DONE').length}</p><p className="text-xs text-text-muted mt-1">Open tasks</p></div>
        <div className="premium-card p-4"><CircleCheckBig size={18} className="text-success mb-3" /><p className="text-2xl font-display font-bold">{myTasks.filter((task) => task.status === 'DONE').length}</p><p className="text-xs text-text-muted mt-1">Completed tasks</p></div>
      </div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display text-xl font-bold">Your events</h2>
          <p className="text-text-muted text-sm mt-1">Every event you're on, across every club.</p>
        </div>
        <Link to="/clubs" className="text-sm font-semibold text-accent">Manage clubs</Link>
      </div>

      {!loading && <DueSoonStrip tasks={myTasks} />}

      {loading ? (
        <p className="text-text-muted text-sm">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-text-muted text-sm">No events yet — head to a club hub to create one.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((e) => <EventCard key={e._id} event={e} />)}
        </div>
      )}
    </div>
  );
}
