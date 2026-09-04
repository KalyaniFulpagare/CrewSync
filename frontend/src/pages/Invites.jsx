import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import client from '../api/client';

export default function Invites() {
  const [eventInvites, setEventInvites] = useState([]);
  const [teamInvites, setTeamInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => Promise.all([
    client.get('/events/invites/pending'),
    client.get('/clubs/invites/pending')
  ]).then(([eventsRes, teamsRes]) => {
    setEventInvites(eventsRes.data.invites);
    setTeamInvites(teamsRes.data.invites);
  }).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const respondToEvent = (membershipId, accept) =>
    client.patch(`/events/invites/${membershipId}/respond`, { accept }).then(load);

  const respondToTeam = (membershipId, accept) =>
    client.patch(`/clubs/invites/${membershipId}/respond`, { accept }).then(load);

  const totalCount = eventInvites.length + teamInvites.length;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold mb-1">Invites</h1>
      <p className="text-text-muted text-sm mb-6">Things you've been invited to but haven't responded to yet.</p>

      {loading ? (
        <p className="text-text-muted text-sm">Loading…</p>
      ) : totalCount === 0 ? (
        <p className="text-text-muted text-sm">No pending invites right now.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {eventInvites.map((inv) => (
            <div key={inv._id} className="bg-surface border border-black/5 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{inv.eventId?.title}</p>
                <p className="text-xs text-text-muted">Event invite · {new Date(inv.eventId?.eventDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => respondToEvent(inv._id, true)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><Check size={16} /></button>
                <button onClick={() => respondToEvent(inv._id, false)} className="p-1.5 rounded-lg bg-red-50 text-danger hover:bg-red-100"><X size={16} /></button>
              </div>
            </div>
          ))}
          {teamInvites.map((inv) => (
            <div key={inv._id} className="bg-surface border border-black/5 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{inv.teamId?.name}</p>
                <p className="text-xs text-text-muted">Team invite · role: {inv.role}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => respondToTeam(inv._id, true)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><Check size={16} /></button>
                <button onClick={() => respondToTeam(inv._id, false)} className="p-1.5 rounded-lg bg-red-50 text-danger hover:bg-red-100"><X size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
