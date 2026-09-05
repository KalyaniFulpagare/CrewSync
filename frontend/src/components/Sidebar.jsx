import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, ListChecks, Building2, Flame, Bell, LogOut, ClipboardList } from 'lucide-react';
import BrandMark from './BrandMark';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const linkClasses = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
    isActive ? 'bg-white text-ink shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5'
  }`;

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [inviteCount, setInviteCount] = useState(0);

  useEffect(() => {
    Promise.all([client.get('/events/invites/pending'), client.get('/clubs/invites/pending')])
      .then(([e, t]) => setInviteCount(e.data.invites.length + t.data.invites.length))
      .catch(() => {});
  }, []);

  return (
    <aside className="w-64 bg-ink flex flex-col shrink-0 h-screen sticky top-0 border-r border-white/5">
      <div className="px-5 py-7"><span className="inline-flex items-center gap-2.5 font-display text-xl font-bold text-white"><BrandMark size={31} />CrewSync</span><p className="text-[10px] uppercase tracking-[0.16em] text-white/35 mt-3 px-1">Club operations</p></div>
      <nav className="flex-1 px-3 flex flex-col gap-1">
        <NavLink to="/" end className={linkClasses}><LayoutGrid size={18} /> Events</NavLink>
        <NavLink to="/clubs" className={linkClasses}><Building2 size={18} /> Clubs</NavLink>
        <NavLink to="/recruitment" className={linkClasses}><ClipboardList size={18} /> Recruitment</NavLink>
        <NavLink to="/my-tasks" className={linkClasses}><ListChecks size={18} /> My Tasks</NavLink>
        <NavLink to="/my-load" className={linkClasses}><Flame size={18} /> My Load</NavLink>
        <NavLink to="/invites" className={linkClasses}>
          <Bell size={18} /> Invites
          {inviteCount > 0 && <span className="ml-auto bg-danger text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{inviteCount}</span>}
        </NavLink>
      </nav>

      <div className="px-3 pb-5 border-t border-white/10 pt-4 mx-3">
        <div className="px-2 mb-3">
          <p className="text-sm font-medium text-white truncate">{user?.name}</p>
          <p className="text-xs text-white/40 truncate">{user?.email}</p>
        </div>
        <button onClick={logout} className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 w-full transition-colors">
          <LogOut size={18} /> Log out
        </button>
      </div>
    </aside>
  );
}
