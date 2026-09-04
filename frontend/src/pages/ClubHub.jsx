import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, X, UserPlus, Flame, Crown } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import OrgChart from '../components/OrgChart';
import WorkloadHeatmap from '../components/WorkloadHeatmap';
import ChatPanel from '../components/ChatPanel';
import EventCard from '../components/EventCard';

export default function ClubHub() {
  const { clubId } = useParams();
  const { user } = useAuth();
  const [hierarchy, setHierarchy] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState(null);

  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [showMemberForm, setShowMemberForm] = useState(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('MEMBER');
  const [showCoordinatorForm, setShowCoordinatorForm] = useState(false);
  const [coordinatorEmail, setCoordinatorEmail] = useState('');
  const [coordinatorPosition, setCoordinatorPosition] = useState('JOINT_HEAD_COORDINATOR');

  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', description: '', eventDate: '', venue: '', budget: '' });

  const load = useCallback(async () => {
    const [hierarchyRes, eventsRes] = await Promise.all([
      client.get(`/clubs/${clubId}/hierarchy`),
      client.get(`/clubs/${clubId}/events`)
    ]);
    const isCoordinator = hierarchyRes.data.coordinators.some((coordinator) => String(coordinator.userId?._id) === String(user?.id));
    const isTeamLead = hierarchyRes.data.teams.some((team) => team.members.some((member) => String(member.userId?._id) === String(user?.id) && ['HEAD', 'CO_HEAD'].includes(member.role)));
    const heatmapRes = (isCoordinator || isTeamLead)
      ? await client.get(`/clubs/${clubId}/heatmap`)
      : { data: { heatmap: [] } };
    setHierarchy(hierarchyRes.data);
    setHeatmap(heatmapRes.data.heatmap);
    setEvents(eventsRes.data.events);
    if (hierarchyRes.data.teams.length && !activeTeamId) setActiveTeamId(hierarchyRes.data.teams[0]._id);
  }, [clubId, user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleLeaveTeam = async (teamId) => {
    if (!confirm('Leave this team?')) return;
    try {
      await client.post(`/clubs/teams/${teamId}/leave`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not leave the team.');
    }
  };

  const handleRemoveMember = async (teamId, membershipId) => {
    if (!confirm('Remove this member from the team?')) return;
    try {
      await client.delete(`/clubs/teams/${teamId}/members/${membershipId}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not remove this member.');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    await client.post(`/clubs/${clubId}/teams`, { name: teamName });
    setTeamName(''); setShowTeamForm(false);
    load();
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    await client.post(`/clubs/teams/${showMemberForm}/members`, { email: memberEmail, role: memberRole });
    setMemberEmail(''); setMemberRole('MEMBER'); setShowMemberForm(null);
    load();
  };

  const handleAddCoordinator = async (e) => {
    e.preventDefault();
    await client.post(`/clubs/${clubId}/coordinators`, { email: coordinatorEmail, position: coordinatorPosition });
    setCoordinatorEmail(''); setCoordinatorPosition('JOINT_HEAD_COORDINATOR'); setShowCoordinatorForm(false);
    load();
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    await client.post('/events', { ...eventForm, clubId, budget: Number(eventForm.budget) || 0 });
    setShowEventForm(false);
    setEventForm({ title: '', description: '', eventDate: '', venue: '', budget: '' });
    load();
  };

  if (!hierarchy) return <div className="p-8 text-text-muted text-sm">Loading...</div>;

  const isCoordinator = hierarchy.coordinators.some((coordinator) => String(coordinator.userId?._id) === String(user?.id));
  const canManageTeam = (team) => isCoordinator || team.members.some((member) => String(member.userId?._id) === String(user?.id) && ['HEAD', 'CO_HEAD'].includes(member.role));
  const canViewHeatmap = isCoordinator || hierarchy.teams.some(canManageTeam);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link to="/clubs" className="text-xs text-text-muted hover:text-text">Back to all clubs</Link>
      <h1 className="font-display text-2xl font-bold mt-2 mb-1">{hierarchy.club.name}</h1>
      <p className="text-text-muted text-sm mb-6">{hierarchy.club.description}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-surface border border-black/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-text">Club structure</h2>
              {isCoordinator && <div className="flex items-center gap-3"><button onClick={() => setShowCoordinatorForm(true)} className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-accent"><Crown size={14} /> Add coordinator</button><button onClick={() => setShowTeamForm(true)} className="flex items-center gap-1.5 text-xs font-medium text-accent"><Plus size={14} /> New team</button></div>}
            </div>
            <OrgChart
              coordinators={hierarchy.coordinators}
              teams={hierarchy.teams}
              currentUserId={user?.id}
              canManageTeam={canManageTeam}
              onLeaveTeam={handleLeaveTeam}
              onRemoveMember={handleRemoveMember}
            />

            {hierarchy.teams.some(canManageTeam) && (
              <div className="mt-4 pt-4 border-t border-black/5">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Add a member to a team</p>
                <div className="flex flex-wrap gap-2">
                  {hierarchy.teams.filter(canManageTeam).map((t) => (
                    <button key={t._id} onClick={() => setShowMemberForm(t._id)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-black/10 hover:border-accent text-text-muted">
                      <UserPlus size={12} /> {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {canViewHeatmap && <div className="bg-surface border border-black/5 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Flame size={16} className="text-accent" />
              <h2 className="font-display font-semibold text-text">Club-wide workload heatmap</h2>
            </div>
            <WorkloadHeatmap heatmap={heatmap} />
          </div>}

          <div className="bg-surface border border-black/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-text">Events</h2>
              <button onClick={() => setShowEventForm(true)} className="flex items-center gap-1.5 text-xs font-medium text-accent">
                <Plus size={14} /> New event
              </button>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-text-muted">No events yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {events.map((e) => <EventCard key={e._id} event={{ ...e, clubId: hierarchy.club }} />)}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <ChatPanel channelType="club" channelId={clubId} title={`${hierarchy.club.name} - Club-wide`} />

          {hierarchy.teams.length > 0 && (
            <div>
              <div className="flex gap-1.5 mb-2 overflow-x-auto">
                {hierarchy.teams.map((t) => (
                  <button key={t._id} onClick={() => setActiveTeamId(t._id)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${activeTeamId === t._id ? 'bg-ink text-white' : 'bg-surface border border-black/10 text-text-muted'}`}>
                    {t.name}
                  </button>
                ))}
              </div>
              {activeTeamId && <ChatPanel channelType="team" channelId={activeTeamId} title={hierarchy.teams.find((t) => t._id === activeTeamId)?.name} />}
            </div>
          )}
        </div>
      </div>

      {showTeamForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">New team</h2>
              <button onClick={() => setShowTeamForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTeam} className="flex flex-col gap-3">
              <input required placeholder="e.g. Design Team" value={teamName} onChange={(e) => setTeamName(e.target.value)}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
              <button className="bg-accent text-white text-sm font-medium py-2.5 rounded-lg hover:bg-accent/90">Create team</button>
            </form>
          </div>
        </div>
      )}

      {showMemberForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">Add team member</h2>
              <button onClick={() => setShowMemberForm(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddMember} className="flex flex-col gap-3">
              <input required type="email" placeholder="member@email.com" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
              <select value={memberRole} onChange={(e) => setMemberRole(e.target.value)}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent bg-white">
                <option value="MEMBER">Member</option>
                <option value="CO_HEAD">Co-head</option>
                <option value="HEAD">Head</option>
              </select>
              <button className="bg-accent text-white text-sm font-medium py-2.5 rounded-lg hover:bg-accent/90">Add</button>
            </form>
          </div>
        </div>
      )}

      {showCoordinatorForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4"><h2 className="font-display font-semibold text-lg">Add coordinator</h2><button onClick={() => setShowCoordinatorForm(false)}><X size={18} /></button></div>
            <form onSubmit={handleAddCoordinator} className="flex flex-col gap-3">
              <input required type="email" placeholder="coordinator@email.com" value={coordinatorEmail} onChange={(e) => setCoordinatorEmail(e.target.value)} className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
              <select value={coordinatorPosition} onChange={(e) => setCoordinatorPosition(e.target.value)} className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent bg-white"><option value="FACULTY_COORDINATOR">Faculty coordinator</option><option value="JOINT_HEAD_COORDINATOR">Joint head coordinator</option><option value="HEAD_COORDINATOR">Head coordinator</option></select>
              <button className="bg-accent text-white text-sm font-medium py-2.5 rounded-lg hover:bg-accent/90">Add coordinator</button>
            </form>
          </div>
        </div>
      )}

      {showEventForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">New event</h2>
              <button onClick={() => setShowEventForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateEvent} className="flex flex-col gap-3">
              <input required placeholder="Title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
              <textarea placeholder="Description" rows={2} value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent resize-none" />
              <input required type="date" value={eventForm.eventDate} onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
              <input placeholder="Venue" value={eventForm.venue} onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
              <input type="number" placeholder="Budget (Rs.)" value={eventForm.budget} onChange={(e) => setEventForm({ ...eventForm, budget: e.target.value })}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
              <button className="bg-accent text-white text-sm font-medium py-2.5 rounded-lg hover:bg-accent/90">Create event</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

