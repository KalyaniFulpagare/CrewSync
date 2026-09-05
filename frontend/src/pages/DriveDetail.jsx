import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Building2, Users } from 'lucide-react';
import client from '../api/client';

export default function DriveDetail() {
  const { driveId } = useParams();
  const navigate = useNavigate();
  const [drive, setDrive] = useState(null);
  const [teamId, setTeamId] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get(`/recruitment/drives/${driveId}`).then((res) => {
      setDrive(res.data.drive);
      if (res.data.drive.teams.length === 1) setTeamId(res.data.drive.teams[0]._id);
    });
  }, [driveId]);

  if (!drive) return <div className="p-8 text-text-muted text-sm">Loading...</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!teamId) { setError('Choose which team you are applying to.'); return; }
    setSubmitting(true);
    try {
      const payload = {
        teamId,
        answers: drive.questions.map((q) => ({ questionLabel: q.label, value: answers[q.label] || '' }))
      };
      await client.post(`/recruitment/drives/${driveId}/apply`, payload);
      navigate('/recruitment');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit your application.');
    } finally {
      setSubmitting(false);
    }
  };

  const setAnswer = (label, value) => setAnswers((prev) => ({ ...prev, [label]: value }));

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link to="/recruitment" className="text-xs text-text-muted hover:text-text">Back to open drives</Link>
      <div className="flex items-center gap-2 text-xs text-text-muted mt-2"><Building2 size={13} /> {drive.clubId?.name}</div>
      <h1 className="font-display text-2xl font-bold mt-1 mb-1">{drive.title}</h1>
      {drive.description && <p className="text-text-muted text-sm mb-6">{drive.description}</p>}

      {drive.status !== 'OPEN' ? (
        <p className="text-sm text-danger bg-red-50 rounded-lg p-4">This recruitment drive has closed.</p>
      ) : (
        <form onSubmit={handleSubmit} className="bg-surface border border-black/5 rounded-xl p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 flex items-center gap-1.5"><Users size={13} /> Which team are you applying to?</label>
            <select required value={teamId} onChange={(e) => setTeamId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent bg-white">
              <option value="" disabled>Select a team</option>
              {drive.teams.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>

          {drive.questions.map((q) => (
            <div key={q.label}>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 block">
                {q.label}{q.required && <span className="text-danger"> *</span>}
              </label>
              {q.type === 'TEXTAREA' ? (
                <textarea required={q.required} rows={3} value={answers[q.label] || ''} onChange={(e) => setAnswer(q.label, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent resize-none" />
              ) : q.type === 'SELECT' ? (
                <select required={q.required} value={answers[q.label] || ''} onChange={(e) => setAnswer(q.label, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent bg-white">
                  <option value="" disabled>Select an option</option>
                  {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input required={q.required} value={answers[q.label] || ''} onChange={(e) => setAnswer(q.label, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
              )}
            </div>
          ))}

          {error && <p className="text-xs text-danger">{error}</p>}
          <button disabled={submitting} className="bg-accent text-white text-sm font-medium py-2.5 rounded-lg hover:bg-accent/90 disabled:opacity-60">
            {submitting ? 'Submitting...' : 'Submit application'}
          </button>
        </form>
      )}
    </div>
  );
}
