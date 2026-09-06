import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';

const columns = [
  { key: 'APPLIED', label: 'Applied' },
  { key: 'SHORTLISTED', label: 'Shortlisted' },
  { key: 'INTERVIEW', label: 'Interview round' },
  { key: 'SELECTED', label: 'Selected' },
  { key: 'REJECTED', label: 'Not selected' }
];

const nextActions = {
  APPLIED: [{ to: 'SHORTLISTED', label: 'Shortlist' }, { to: 'REJECTED', label: 'Reject' }],
  SHORTLISTED: [{ to: 'INTERVIEW', label: 'Move to interview' }, { to: 'REJECTED', label: 'Reject' }],
  INTERVIEW: [{ to: 'SELECTED', label: 'Select' }, { to: 'REJECTED', label: 'Reject' }],
  SELECTED: [],
  REJECTED: [{ to: 'APPLIED', label: 'Reopen' }]
};

export default function DriveApplications() {
  const { driveId } = useParams();
  const [drive, setDrive] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      client.get(`/recruitment/drives/${driveId}`),
      client.get(`/recruitment/drives/${driveId}/applications`)
    ]).then(([driveRes, appsRes]) => {
      setDrive(driveRes.data.drive);
      setApplications(appsRes.data.applications);
      setIsCoordinator(!!appsRes.data.isCoordinator);
    }).finally(() => setLoading(false));
  }, [driveId]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (applicationId, status) => {
    setError('');
    try {
      await client.patch(`/recruitment/drives/${driveId}/applications/${applicationId}/status`, { status });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update this applicant.');
    }
  };

  const toggleDriveStatus = async () => {
    setError('');
    try {
      const status = drive.status === 'OPEN' ? 'CLOSED' : 'OPEN';
      await client.patch(`/recruitment/drives/${driveId}/status`, { status });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the drive status.');
    }
  };

  if (loading || !drive) return <div className="p-8 text-text-muted text-sm">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link to={`/clubs/${drive.clubId?._id || drive.clubId}`} className="text-xs text-text-muted hover:text-text">Back to club</Link>
      <div className="flex items-center justify-between mt-2 mb-2">
        <div>
          <h1 className="font-display text-2xl font-bold mb-1">{drive.title}</h1>
          <p className="text-text-muted text-sm">
            {applications.length} applicant{applications.length !== 1 && 's'}
            {!isCoordinator && ' — showing your team only'}
          </p>
        </div>
        {isCoordinator && (
          <button onClick={toggleDriveStatus}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg ${drive.status === 'OPEN' ? 'bg-red-50 text-danger hover:bg-red-100' : 'bg-emerald-50 text-success hover:bg-emerald-100'}`}>
            {drive.status === 'OPEN' ? 'Close drive' : 'Reopen drive'}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {columns.map((col) => (
          <div key={col.key}>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">{col.label} ({applications.filter((a) => a.status === col.key).length})</p>
            <div className="flex flex-col gap-2">
              {applications.filter((a) => a.status === col.key).map((a) => (
                <div key={a._id} className="bg-surface border border-black/5 rounded-lg p-3">
                  <p className="text-sm font-medium">{a.applicantId?.name}</p>
                  <p className="text-xs text-text-muted mb-2">{a.applicantId?.email} - {a.teamId?.name}</p>
                  {a.answers?.length > 0 && (
                    <details className="text-xs text-text-muted mb-2">
                      <summary className="cursor-pointer select-none">View answers</summary>
                      <ul className="mt-1.5 space-y-1">
                        {a.answers.map((ans) => (
                          <li key={ans.questionLabel}><span className="font-medium text-text">{ans.questionLabel}:</span> {ans.value || '-'}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {nextActions[col.key].map((action) => (
                      <button key={action.to} onClick={() => updateStatus(a._id, action.to)}
                        className="text-[11px] font-medium px-2 py-1 rounded-md border border-black/10 text-text-muted hover:border-accent hover:text-accent">
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
