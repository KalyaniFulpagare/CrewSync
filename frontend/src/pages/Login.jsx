import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(form.email, form.password); navigate('/'); }
    catch (err) { setError(err.response?.data?.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold text-center mb-1">CrewSync</h1>
        <p className="text-center text-text-muted text-sm mb-8">Coordinate your club's events and tasks.</p>
        <form onSubmit={handleSubmit} className="bg-surface border border-black/5 rounded-xl p-6 flex flex-col gap-4">
          {error && <p className="text-sm text-danger bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="text-sm font-medium text-text mb-1 block">Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-accent outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-text mb-1 block">Password</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:border-accent outline-none" />
          </div>
          <button disabled={loading} className="bg-accent text-white font-medium text-sm py-2.5 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-60">
            {loading ? 'Logging inâ€¦' : 'Log in'}
          </button>
        </form>
        <p className="text-center text-sm text-text-muted mt-4">No account? <Link to="/register" className="text-accent font-medium">Register</Link></p>
      </div>
    </div>
  );
}

