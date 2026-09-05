import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, ClipboardList } from 'lucide-react';
import client from '../api/client';

const statusStyles = {
  APPLIED: 'bg-slate-100 text-slate-600',
  SHORTLISTED: 'bg-accent-soft text-accent',
  INTERVIEW: 'bg-amber-50 text-warning',
  SELECTED: 'bg-emerald-50 text-success',
  REJECTED: 'bg-red-50 text-danger'
};

const statusLabel = {
  APPLIED: 'Applied',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview round',
  SELECTED: 'Selected',
  REJECTED: 'Not selected'
};

export default function Recruitment() {
  const [tab, setTab] = useState('browse');
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([client.get('/recruitment/drives'), client.get('/recruitment/my-applications')])
      .then(([drivesRes, appsRes]) => {
        setDrives(drivesRes.data.drives);
        setApplications(appsRes.data.applications);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const appliedDriveIds = new Set(applications.map((a) => String(a.driveId?._id)));

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-1">Recruitment</h1>
      <p className="text-text-muted text-sm mb-6">Open drives across every club, and where your applications stand.</p>

      <div className="flex gap-1.5 mb-6">
        <button onClick={() => setTab('browse')}
          className={`text-sm font-medium px-3.5 py-1.5 rounded-full ${tab === 'browse' ? 'bg-ink text-white' : 'bg-surface border border-black/10 text-text-muted'}`}>
          Open drives
        </button>
        <button onClick={() => setTab('mine')}
          className={`text-sm font-medium px-3.5 py-1.5 rounded-full ${tab === 'mine' ? 'bg-ink text-white' : 'bg-surface border border-black/10 text-text-muted'}`}>
          My applications {applications.length > 0 && `(${applications.length})`}
        </button>
      </div>

      {loading ? (
        <p className="text-text-muted text-sm">Loading...</p>
      ) : tab === 'browse' ? (
        drives.length === 0 ? (
          <p className="text-text-muted text-sm">No open recruitment drives right now - check back later.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {drives.map((d) => {
              const applied = appliedDriveIds.has(String(d._id));
              return (
                <div key={d._id} className="bg-surface border border-black/5 rounded-xl p-5 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-text-muted"><Building2 size={13} /> {d.clubId?.name}</div>
                  <p className="font-display font-semibold">{d.title}</p>
                  <p className="text-xs text-text-muted line-clamp-2">{d.description}</p>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                    <Users size={13} /> {d.teams?.map((t) => t.name).join(', ')}
                  </div>
                  {applied ? (
                    <span className="mt-2 inline-flex w-fit text-xs font-medium px-2.5 py-1 rounded-full bg-accent-soft text-accent">Already applied</span>
                  ) : (
                    <Link to={`/recruitment/${d._id}`} className="mt-2 inline-flex w-fit text-xs font-medium px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent/90">
                      Apply now
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : applications.length === 0 ? (
        <p className="text-text-muted text-sm">You have not applied to any drives yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((a) => (
            <div key={a._id} className="bg-surface border border-black/5 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList size={16} className="text-text-muted" />
                <div>
                  <p className="text-sm font-medium">{a.driveId?.title}</p>
                  <p className="text-xs text-text-muted">{a.driveId?.clubId?.name} - applied for {a.teamId?.name}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[a.status]}`}>{statusLabel[a.status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
