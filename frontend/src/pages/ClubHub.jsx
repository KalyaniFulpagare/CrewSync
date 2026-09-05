import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, X, UserPlus, Flame, Crown, ClipboardList } from 'lucide-react';
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

  const [drives, setDrives] = useState([]);
  const [showDriveForm, setShowDriveForm] = useState(false);
  const emptyQuestion = { label: '', type: 'TEXT', options: '', required: true };
  const [driveForm, setDriveForm] = useState({ title: '', description: '', teams: [], questions: [{ ...emptyQuestion }] });

  const load = useCallback(async () => {
    const [hierarchyRes, eventsRes] = await Promise.all([
      client.get(`/clubs/${clubId}/hierarchy`),
      client.get(`/clubs/${clubId}/events`)
    ]);
    const isCoordinator = hierarchyRes.data.coordinators.some((coordinator) => String(coordinator.userId?._id) === String(user?.id));
    const isHeadOrJointHead = hierarchyRes.data.coordinators.some((coordinator) =>
      String(coordinator.userId?._id) === String(user?.id) &&
      ['HEAD_COORDINATOR', 'JOINT_HEAD_COORDINATOR'].includes(coordinator.position)
    );
    const isTeamLead = hierarchyRes.data.teams.some((team) => team.members.some((member) => String(member.userId?._id) === String(user?.id) && ['HEAD', 'CO_HEAD'].includes(member.role)));
    const heatmapRes = (isCoordinator || isTeamLead)
      ? await client.get(`/clubs/${clubId}/heatmap`).catch(() => ({ data: { heatmap: [] } }))
      : { data: { heatmap: [] } };
    const drivesRes = isHeadOrJointHead
      ? await client.get(`/recruitment/clubs/${clubId}/drives`).catch(() => ({ data: { drives: [] } }))
      : { data: { drives: [] } };
    setHierarchy(hierarchyRes.data);
    setHeatmap(heatmapRes.data.heatmap);
    setEvents(eventsRes.data.events);
    setDrives(drivesRes.data.drives);
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

  const toggleDriveTeam = (teamId) => {
    setDriveForm((prev) => ({
      ...prev,
      teams: prev.teams.includes(teamId) ? prev.teams.filter((t) => t !== teamId) : [...prev.teams, teamId]
    }));
  };

  const updateDriveQuestion = (idx, patch) => {
    setDriveForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    }));
  };

  const addDriveQuestion = () => setDriveForm((prev) => ({ ...prev, questions: [...prev.questions, { ...emptyQuestion }] }));
  const removeDriveQuestion = (idx) => setDriveForm((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    const questions = driveForm.questions
      .filter((q) => q.label.trim())
      .map((q) => ({
        label: q.label.trim(),
        type: q.type,
        required: q.required,
        options: q.type === 'SELECT' ? q.options.split(',').map((o) => o.trim()).filter(Boolean) : []
      }));
    if (driveForm.teams.length === 0) {
      alert('Select at least one team this drive is recruiting for.');
      return;
    }
    try {
      await client.post(`/recruitment/clubs/${clubId}/drives`, { ...driveForm, questions });
      setDriveForm({ title: '', description: '', teams: [], questions: [{ ...emptyQuestion }] });
      setShowDriveForm(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not create the recruitment drive.');
    }
  };

  if (!hierarchy) return <div className="p-8 text-text-muted text-sm">Loading...</div>;

  const isCoordinator = hierarchy.coordinators.some((coordinator) => String(coordinator.userId?._id) === String(user?.id));
  const isHeadOrJointHead = hierarchy.coordinators.some((coordinator) =>
    String(coordinator.userId?._id) === String(user?.id) &&
    ['HEAD_COORDINATOR', 'JOINT_HEAD_COORDINATOR'].includes(coordinator.position)
  );
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
              {isHeadOrJointHead && <div className="flex items-center gap-3"><button onClick={() => setShowCoordinatorForm(true)} className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-accent"><Crown size={14} /> Add coordinator</button><button onClick={() => setShowTeamForm(true)} className="flex items-center gap-1.5 text-xs font-medium text-accent"><Plus size={14} /> New team</button></div>}
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

          {isHeadOrJointHead && (
            <div className="bg-surface border border-black/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-text flex items-center gap-2"><ClipboardList size={16} className="text-accent" /> Recruitment drives</h2>
                <button onClick={() => setShowDriveForm(true)} className="flex items-center gap-1.5 text-xs font-medium text-accent">
                  <Plus size={14} /> New drive
                </button>
              </div>
              {drives.length === 0 ? (
                <p className="text-sm text-text-muted">No recruitment drives yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {drives.map((d) => (
                    <Link key={d._id} to={`/clubs/${clubId}/drives/${d._id}`}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border border-black/5 hover:border-accent">
                      <span className="text-sm font-medium">{d.title}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${d.status === 'OPEN' ? 'bg-emerald-50 text-success' : 'bg-slate-100 text-text-muted'}`}>
                        {d.status === 'OPEN' ? 'Open' : 'Closed'}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
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

      {showDriveForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface rounded-xl p-6 w-full max-w-lg my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">New recruitment drive</h2>
              <button onClick={() => setShowDriveForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateDrive} className="flex flex-col gap-3">
              <input required placeholder="e.g. Design Team Recruitment 2026" value={driveForm.title}
                onChange={(e) => setDriveForm({ ...driveForm, title: e.target.value })}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent" />
              <textarea placeholder="Description" rows={2} value={driveForm.description}
                onChange={(e) => setDriveForm({ ...driveForm, description: e.target.value })}
                className="px-3 py-2 rounded-lg border border-black/10 text-sm outline-none focus:border-accent resize-none" />

              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Teams recruiting</p>
                <div className="flex flex-wrap gap-2">
                  {hierarchy.teams.map((t) => (
                    <button type="button" key={t._id} onClick={() => toggleDriveTeam(t._id)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${driveForm.teams.includes(t._id) ? 'bg-ink text-white border-ink' : 'border-black/10 text-text-muted'}`}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Application questions</p>
                  <button type="button" onClick={addDriveQuestion} className="text-xs font-medium text-accent flex items-center gap-1"><Plus size={12} /> Add question</button>
                </div>
                <div className="flex flex-col gap-2">
                  {driveForm.questions.map((q, idx) => (
                    <div key={idx} className="border border-black/10 rounded-lg p-2.5 flex flex-col gap-1.5">
                      <div className="flex gap-1.5">
                        <input placeholder="Question label" value={q.label} onChange={(e) => updateDriveQuestion(idx, { label: e.target.value })}
                          className="flex-1 px-2.5 py-1.5 rounded-md border border-black/10 text-xs outline-none focus:border-accent" />
                        <select value={q.type} onChange={(e) => updateDriveQuestion(idx, { type: e.target.value })}
                          className="px-2 py-1.5 rounded-md border border-black/10 text-xs outline-none focus:border-accent bg-white">
                          <option value="TEXT">Short text</option>
                          <option value="TEXTAREA">Long text</option>
                          <option value="SELECT">Dropdown</option>
                        </select>
                        <button type="button" onClick={() => removeDriveQuestion(idx)} className="text-text-muted hover:text-danger px-1"><X size={14} /></button>
                      </div>
                      {q.type === 'SELECT' && (
                        <input placeholder="Options, comma separated" value={q.options} onChange={(e) => updateDriveQuestion(idx, { options: e.target.value })}
                          className="px-2.5 py-1.5 rounded-md border border-black/10 text-xs outline-none focus:border-accent" />
                      )}
                      <label className="flex items-center gap-1.5 text-xs text-text-muted">
                        <input type="checkbox" checked={q.required} onChange={(e) => updateDriveQuestion(idx, { required: e.target.checked })} /> Required
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <button className="bg-accent text-white text-sm font-medium py-2.5 rounded-lg hover:bg-accent/90">Open drive</button>
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
