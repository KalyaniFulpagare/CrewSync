import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, Building2 } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ClubList() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', headEmail: '', coHeadEmail: '', facultyCoordinatorEmail: '' });
  const [error, setError] = useState('');

  const load = () => client.get('/clubs').then((res) => setClubs(res.data.clubs)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await client.post('/clubs', form);
      setShowForm(false);
      setForm({ name: '', description: '', headEmail: '', coHeadEmail: '', facultyCoordinatorEmail: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the club.');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Your clubs</h1>
          <p className="text-text-muted text-sm mt-1">Coordinators, teams, and events — one hub per club.</p>
        </div>
        {user?.role === 'FACULTY_ADMIN' && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent/90">
            <Plus size={16} /> New club
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-text-muted text-sm">Loading…</p>
      ) : clubs.length === 0 ? (
        <p className="text-text-muted text-sm">No clubs yet — create one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clubs.map((c) => (
            <Link key={c._id} to={`/clubs/${c._id}`} className="bg-surface border border-black/5 rounded-xl p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-1"><Building2 size={16} className="text-accent" /><span className="font-display font-semibold">{c.name}</span></div>
              <p className="text-xs text-text-muted">{c.description}</p>
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">Create club</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <p className="text-xs text-text-muted mb-4">Use this once the head, co-head, and faculty coordinator have agreed to the idea in person.</p>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              {error && <p className="text-xs text-red-500">{error}</p>}
              <label className="text-xs font-medium text-text-muted mb-1 block">Club name</label>
              <input required placeholder="Club name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
              <textarea placeholder="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent resize-none" />
              <label className="text-xs font-medium text-text-muted mb-1 block">Faculty coordinator email</label>
              <input required type="email" placeholder="faculty@ccoew.edu" value={form.facultyCoordinatorEmail} onChange={(e) => setForm({ ...form, facultyCoordinatorEmail: e.target.value })}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
              <label className="text-xs font-medium text-text-muted mb-1 block">Head coordinator email</label>
              <input required type="email" placeholder="head@ccoew.edu" value={form.headEmail} onChange={(e) => setForm({ ...form, headEmail: e.target.value })}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
              <label className="text-xs font-medium text-text-muted mb-1 block">Co-head email (optional)</label>
              <input type="email" placeholder="cohead@ccoew.edu" value={form.coHeadEmail} onChange={(e) => setForm({ ...form, coHeadEmail: e.target.value })}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
              <button className="bg-accent text-white text-sm font-medium py-2.5 rounded-lg hover:bg-accent/90">Create</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
